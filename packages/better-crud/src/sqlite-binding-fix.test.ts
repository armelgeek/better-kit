import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { adiemus } from "./crud";
import { productSchema } from "./schemas";

describe("SQLite Data Binding Fix Integration Test", () => {
	it("should handle product creation with complex data types without SQLite binding errors", async () => {
		// This test reproduces the exact scenario from the issue
		const crud = adiemus({
			resources: [
				{
					name: "product",
					schema: productSchema,
					permissions: {
						create: async () => true,
						read: async () => true,
						update: async () => true,
						delete: async () => true,
						list: async () => true,
					},
				},
			],
			database: {
				provider: "sqlite",
				url: "sqlite::memory:",
				autoMigrate: true,
			},
		});

		// This data would previously cause: "SQLite3 can only bind numbers, strings, bigints, buffers, and null"
		const productData = {
			name: "Test Product",
			description: "A test product with complex data types",
			price: 99.99,
			tags: ["electronics", "gadgets", "popular"], // Array - would cause error
			status: "active" as const,
			sku: "TEST-001",
			stock: 10,
			// createdAt and updatedAt will be auto-generated as Date objects - would cause error
		};

		// Test direct adapter usage (this is where the error occurred)
		const adapter = crud.context.adapter;

		// Manually create the table for testing since auto-migration is async
		await crud.context.db.schema
			.createTable("product")
			.ifNotExists()
			.addColumn("id", "text", (col) => col.primaryKey())
			.addColumn("name", "text", (col) => col.notNull())
			.addColumn("description", "text")
			.addColumn("price", "real")
			.addColumn("categoryId", "text")
			.addColumn("tags", "text") // JSON array
			.addColumn("status", "text")
			.addColumn("sku", "text")
			.addColumn("stock", "integer")
			.addColumn("createdAt", "text") // Date as ISO string
			.addColumn("updatedAt", "text") // Date as ISO string
			.execute();

		// This should not throw "SQLite3 can only bind numbers, strings, bigints, buffers, and null"
		const result = await adapter.create({
			model: "product",
			data: productData,
		});

		// Verify the result
		expect(result).toBeDefined();
		expect(result.id).toBeDefined();
		expect(result.name).toBe("Test Product");
		expect(result.price).toBe(99.99);

		// Verify complex data types are properly handled
		expect(Array.isArray(result.tags)).toBe(true);
		expect(result.tags).toEqual(["electronics", "gadgets", "popular"]);
		expect(result.createdAt).toBeInstanceOf(Date);
		expect(result.updatedAt).toBeInstanceOf(Date);

		// Test that we can read it back
		const found = await adapter.findFirst({
			model: "product",
			where: [{ field: "id", value: result.id }],
		});

		expect(found).toBeDefined();
		expect(found.id).toBe(result.id);
		expect(Array.isArray(found.tags)).toBe(true);
		expect(found.tags).toEqual(["electronics", "gadgets", "popular"]);
		expect(found.createdAt).toBeInstanceOf(Date);
		expect(found.updatedAt).toBeInstanceOf(Date);
	});

	it("should handle product creation with all complex schema fields", async () => {
		const crud = adiemus({
			resources: [
				{
					name: "product",
					schema: productSchema,
					permissions: {
						create: async () => true,
						read: async () => true,
						update: async () => true,
						delete: async () => true,
						list: async () => true,
					},
				},
			],
			database: {
				provider: "sqlite",
				url: "sqlite::memory:",
				autoMigrate: true,
			},
		});

		// Test with all possible complex data types from the schema
		const productData = {
			name: "Complex Product",
			description: "A product with all complex data types",
			price: 199.99,
			categoryId: "cat-123",
			tags: ["premium", "limited-edition", "bestseller"], // Array field
			status: "draft" as const,
			sku: "COMPLEX-001",
			stock: 5,
			createdAt: new Date("2024-01-01T10:00:00Z"), // Date field
			updatedAt: new Date("2024-01-01T11:00:00Z"), // Date field
		};

		const adapter = crud.context.adapter;

		// Manually create the table for testing since auto-migration is async
		await crud.context.db.schema
			.createTable("product")
			.ifNotExists()
			.addColumn("id", "text", (col) => col.primaryKey())
			.addColumn("name", "text", (col) => col.notNull())
			.addColumn("description", "text")
			.addColumn("price", "real")
			.addColumn("categoryId", "text")
			.addColumn("tags", "text") // JSON array
			.addColumn("status", "text")
			.addColumn("sku", "text")
			.addColumn("stock", "integer")
			.addColumn("createdAt", "text") // Date as ISO string
			.addColumn("updatedAt", "text") // Date as ISO string
			.execute();

		// This should work without SQLite binding errors
		const result = await adapter.create({
			model: "product",
			data: productData,
		});

		expect(result).toBeDefined();
		expect(result.name).toBe("Complex Product");
		expect(result.price).toBe(199.99);
		expect(Array.isArray(result.tags)).toBe(true);
		expect(result.tags).toHaveLength(3);
		expect(result.tags).toContain("premium");
		expect(result.tags).toContain("limited-edition");
		expect(result.tags).toContain("bestseller");
		expect(result.createdAt).toBeInstanceOf(Date);
		expect(result.updatedAt).toBeInstanceOf(Date);
		expect(result.createdAt.toISOString()).toBe("2024-01-01T10:00:00.000Z");
		expect(result.updatedAt.toISOString()).toBe("2024-01-01T11:00:00.000Z");
	});
});
