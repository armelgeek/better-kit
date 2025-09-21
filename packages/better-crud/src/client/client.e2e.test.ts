/**
 * Playwright test to validate the CRUD client functionality
 * This test verifies that the client works correctly with a real server
 */

import { expect, test } from "@playwright/test";
import { z } from "zod";
import { betterCrud, createCrudClient, createResource } from "../src/index";

// Define a test schema
const productSchema = z.object({
	id: z.string().optional(),
	name: z.string(),
	price: z.number(),
	description: z.string().optional(),
	status: z.enum(["active", "inactive"]).default("active"),
	createdAt: z.date().default(() => new Date()),
	updatedAt: z.date().default(() => new Date()),
});

// Create CRUD instance for testing
const crud = betterCrud({
	resources: [
		createResource({
			name: "product",
			schema: productSchema,
			permissions: {
				create: () => true,
				read: () => true,
				update: () => true,
				delete: () => true,
				list: () => true,
			},
		}),
	],
	database: {
		provider: "sqlite",
		url: "sqlite::memory:",
		autoMigrate: true,
	},
});

// Test server setup
let server: any;

test.beforeAll(async () => {
	// Start a test server
	const { createServer } = await import("http");

	server = createServer(async (req, res) => {
		try {
			const request = new Request(`http://localhost:3000${req.url}`, {
				method: req.method,
				headers: req.headers as any,
				body:
					req.method !== "GET" && req.method !== "HEAD"
						? await streamToString(req)
						: undefined,
			});

			const response = await crud.handler(request);
			const data = await response.text();

			res.writeHead(
				response.status,
				Object.fromEntries(response.headers.entries()),
			);
			res.end(data);
		} catch (error) {
			res.writeHead(500, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ error: "Internal Server Error" }));
		}
	});

	await new Promise<void>((resolve) => {
		server.listen(3000, resolve);
	});
});

test.afterAll(async () => {
	if (server) {
		await new Promise<void>((resolve) => {
			server.close(resolve);
		});
	}
});

// Helper function to convert stream to string
function streamToString(stream: any): Promise<string> {
	return new Promise((resolve, reject) => {
		let data = "";
		stream.on("data", (chunk: any) => {
			data += chunk;
		});
		stream.on("end", () => {
			resolve(data);
		});
		stream.on("error", reject);
	});
}

test.describe("CRUD Client Integration", () => {
	let crudClient: ReturnType<typeof createCrudClient>;

	test.beforeEach(() => {
		crudClient = createCrudClient({
			baseURL: "http://localhost:3000",
		});
	});

	test("should create a product successfully", async () => {
		const productData = {
			name: "Test T-Shirt",
			price: 29.99,
			description: "A comfortable cotton t-shirt",
			status: "active" as const,
		};

		const result = await crudClient.product.create(productData);

		expect(result.status).toBe(201);
		expect(result.data).toBeDefined();
		expect(result.data.name).toBe(productData.name);
		expect(result.data.price).toBe(productData.price);
		expect(result.data.id).toBeDefined();
	});

	test("should read a product successfully", async () => {
		// First create a product
		const createResult = await crudClient.product.create({
			name: "Read Test Product",
			price: 19.99,
		});

		expect(createResult.status).toBe(201);
		const productId = createResult.data.id;

		// Then read it
		const readResult = await crudClient.product.read(productId);

		expect(readResult.status).toBe(200);
		expect(readResult.data).toBeDefined();
		expect(readResult.data.id).toBe(productId);
		expect(readResult.data.name).toBe("Read Test Product");
	});

	test("should update a product successfully", async () => {
		// First create a product
		const createResult = await crudClient.product.create({
			name: "Update Test Product",
			price: 39.99,
		});

		const productId = createResult.data.id;

		// Then update it
		const updateResult = await crudClient.product.update(productId, {
			name: "Updated Product Name",
			price: 49.99,
		});

		expect(updateResult.status).toBe(200);
		expect(updateResult.data.name).toBe("Updated Product Name");
		expect(updateResult.data.price).toBe(49.99);
	});

	test("should delete a product successfully", async () => {
		// First create a product
		const createResult = await crudClient.product.create({
			name: "Delete Test Product",
			price: 9.99,
		});

		const productId = createResult.data.id;

		// Then delete it
		const deleteResult = await crudClient.product.delete(productId);

		expect(deleteResult.status).toBe(200);
		expect(deleteResult.data.success).toBe(true);

		// Verify it's actually deleted
		const readResult = await crudClient.product.read(productId);
		expect(readResult.status).toBe(404);
	});

	test("should list products with pagination", async () => {
		// Create multiple products
		const products = await Promise.all([
			crudClient.product.create({ name: "Product 1", price: 10 }),
			crudClient.product.create({ name: "Product 2", price: 20 }),
			crudClient.product.create({ name: "Product 3", price: 30 }),
		]);

		// List products
		const listResult = await crudClient.product.list({
			page: 1,
			limit: 2,
		});

		expect(listResult.status).toBe(200);
		expect(listResult.data.items).toBeDefined();
		expect(listResult.data.items.length).toBeLessThanOrEqual(2);
		expect(listResult.data.pagination).toBeDefined();
		expect(listResult.data.pagination.page).toBe(1);
		expect(listResult.data.pagination.limit).toBe(2);
	});

	test("should support custom headers", async () => {
		const result = await crudClient.product.create(
			{
				name: "Header Test Product",
				price: 15.99,
			},
			{
				headers: {
					Authorization: "Bearer test-token",
					"X-Custom-Header": "custom-value",
				},
			},
		);

		expect(result.status).toBe(201);
		expect(result.data).toBeDefined();
	});

	test("should handle search in list operations", async () => {
		// Create products with different names
		await Promise.all([
			crudClient.product.create({ name: "Red Shirt", price: 25 }),
			crudClient.product.create({ name: "Blue Shirt", price: 30 }),
			crudClient.product.create({ name: "Green Pants", price: 40 }),
		]);

		// Search for "Shirt"
		const searchResult = await crudClient.product.list({
			search: "Shirt",
		});

		expect(searchResult.status).toBe(200);
		expect(searchResult.data.items).toBeDefined();
		// Note: The actual search behavior depends on the implementation
		// This test validates that search parameters are accepted
	});

	test("should handle sorting in list operations", async () => {
		// Create products
		await Promise.all([
			crudClient.product.create({ name: "Product C", price: 30 }),
			crudClient.product.create({ name: "Product A", price: 10 }),
			crudClient.product.create({ name: "Product B", price: 20 }),
		]);

		// Sort by name ascending
		const sortResult = await crudClient.product.list({
			sortBy: "name",
			sortOrder: "asc",
		});

		expect(sortResult.status).toBe(200);
		expect(sortResult.data.items).toBeDefined();
		// Note: The actual sorting behavior depends on the implementation
		// This test validates that sort parameters are accepted
	});

	test("should handle validation errors gracefully", async () => {
		// Try to create a product with invalid data
		const result = await crudClient.product.create({
			// Missing required 'name' field
			price: "invalid-price" as any, // Invalid price type
		});

		expect(result.status).toBe(400);
		expect(result.error).toBeDefined();
	});

	test("should handle 404 errors for non-existent resources", async () => {
		const result = await crudClient.product.read("non-existent-id");

		expect(result.status).toBe(404);
	});
});

test.describe("CRUD Client Type Safety", () => {
	test("should provide type-safe access to resource methods", async () => {
		const client = createCrudClient({
			baseURL: "http://localhost:3000",
		});

		// These should be accessible and typed correctly
		expect(typeof client.product.create).toBe("function");
		expect(typeof client.product.read).toBe("function");
		expect(typeof client.product.update).toBe("function");
		expect(typeof client.product.delete).toBe("function");
		expect(typeof client.product.list).toBe("function");

		// Different resources should be independent
		expect(client.product).not.toBe(client.category);
	});
});
