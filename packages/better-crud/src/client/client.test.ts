import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { adiemus } from "../index";

// Mock better-call/client
vi.mock("better-call/client", () => ({
	createClient: vi.fn(() => {
		return vi.fn((endpoint: string, options?: any) => {
			return Promise.resolve({
				data: { id: "test-id", name: "test-product" },
				error: null,
				status: 200,
			});
		});
	}),
}));

const productSchema = z.object({
	id: z.string().optional(),
	name: z.string(),
	price: z.number().optional(),
	description: z.string().optional(),
});

describe("CRUD Client", () => {
	it("should create a CRUD client", () => {
		const client = createCrudClient({
			baseURL: "http://localhost:3000/api",
		});

		expect(client).toBeDefined();
		expect(typeof client).toBe("object");
	});

	it("should provide resource-specific methods", async () => {
		const client = createCrudClient({
			baseURL: "http://localhost:3000/api",
		});

		// Test product methods
		expect(typeof client.product.create).toBe("function");
		expect(typeof client.product.read).toBe("function");
		expect(typeof client.product.update).toBe("function");
		expect(typeof client.product.delete).toBe("function");
		expect(typeof client.product.list).toBe("function");
	});

	it("should call create method correctly", async () => {
		const client = createCrudClient({
			baseURL: "http://localhost:3000/api",
		});

		const result = await client.product.create(
			{
				name: "Tee shirt",
				price: 29.99,
			},
			{
				headers: {
					Authorization: "Bearer token",
				},
			},
		);

		expect(result).toBeDefined();
		expect(result.data).toBeDefined();
	});

	it("should call read method correctly", async () => {
		const client = createCrudClient({
			baseURL: "http://localhost:3000/api",
		});

		const result = await client.product.read("test-id", {
			headers: {
				Authorization: "Bearer token",
			},
		});

		expect(result).toBeDefined();
		expect(result.data).toBeDefined();
	});

	it("should call update method correctly", async () => {
		const client = createCrudClient({
			baseURL: "http://localhost:3000/api",
		});

		const result = await client.product.update(
			"test-id",
			{
				name: "Updated Tee shirt",
				price: 39.99,
			},
			{
				headers: {
					Authorization: "Bearer token",
				},
			},
		);

		expect(result).toBeDefined();
		expect(result.data).toBeDefined();
	});

	it("should call delete method correctly", async () => {
		const client = createCrudClient({
			baseURL: "http://localhost:3000/api",
		});

		const result = await client.product.delete("test-id", {
			headers: {
				Authorization: "Bearer token",
			},
		});

		expect(result).toBeDefined();
	});

	it("should call list method correctly", async () => {
		const client = createCrudClient({
			baseURL: "http://localhost:3000/api",
		});

		const result = await client.product.list(
			{
				page: 1,
				limit: 10,
				search: "tee",
				sortBy: "name",
				sortOrder: "asc",
			},
			{
				headers: {
					Authorization: "Bearer token",
				},
			},
		);

		expect(result).toBeDefined();
		expect(result.data).toBeDefined();
	});

	it("should work with multiple resources", async () => {
		const client = createCrudClient({
			baseURL: "http://localhost:3000/api",
		});

		// Test multiple resource access
		expect(typeof client.product.create).toBe("function");
		expect(typeof client.category.create).toBe("function");
		expect(typeof client.user.create).toBe("function");

		// Each resource should have independent methods
		expect(client.product).not.toBe(client.category);
		expect(client.category).not.toBe(client.user);
	});
});
