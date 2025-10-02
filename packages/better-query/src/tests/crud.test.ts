import { describe, expect, it } from "vitest";
import { z } from "zod";
import { adiemus } from "..";
import { createResource } from "..";

// Define a test schema since we no longer have predefined ones
const testProductSchema = z.object({
	id: z.string().optional(),
	name: z.string().min(1, "Product name is required"),
	description: z.string().optional(),
	price: z.number().min(0, "Price must be positive"),
	createdAt: z.date().default(() => new Date()),
	updatedAt: z.date().default(() => new Date()),
});

describe("BetterCrud", () => {
	it("should create a CRUD instance", () => {
		const crud = adiemus({
			resources: [
				createResource({
					name: "product",
					schema: testProductSchema,
				}),
			],
			database: {
				provider: "sqlite",
				url: ":memory:",
			},
		});

		expect(crud).toBeDefined();
		expect(crud.handler).toBeTypeOf("function");
		expect(crud.api).toBeDefined();
		expect(crud.options).toBeDefined();
		expect(crud.context).toBeDefined();
		expect(crud.schema).toBeDefined();
	});

	it("should generate schema from Zod schemas", () => {
		const testSchema = z.object({
			id: z.string().optional(),
			name: z.string(),
			price: z.number(),
			active: z.boolean().default(true),
		});

		const crud = adiemus({
			resources: [
				createResource({
					name: "test",
					schema: testSchema,
				}),
			],
			database: {
				provider: "sqlite",
				url: ":memory:",
			},
		});

		expect(crud.schema.test).toBeDefined();
		if (crud.schema.test) {
			expect(crud.schema.test.fields).toBeDefined();
			expect(crud.schema.test.fields.name).toEqual({
				type: "string",
				required: true,
			});
			expect(crud.schema.test.fields.price).toEqual({
				type: "number",
				required: true,
			});
			expect(crud.schema.test.fields.active).toEqual({
				type: "boolean",
				required: true,
				default: true,
			});
		}
	});

	it("should support custom permissions", () => {
		const crud = adiemus({
			resources: [
				createResource({
					name: "product",
					schema: testProductSchema,
					permissions: {
						create: () => true,
						read: () => false,
						update: () => true,
						delete: () => false,
						list: () => true,
					},
				}),
			],
			database: {
				provider: "sqlite",
				url: ":memory:",
			},
		});

		expect(crud).toBeDefined();
	});

	it("should support custom table names", () => {
		const crud = adiemus({
			resources: [
				createResource({
					name: "product",
					schema: testProductSchema,
					tableName: "custom_products",
				}),
			],
			database: {
				provider: "sqlite",
				url: ":memory:",
			},
		});

		expect(crud).toBeDefined();
	});

	it("should support selective endpoint enabling", () => {
		const crud = adiemus({
			resources: [
				createResource({
					name: "product",
					schema: testProductSchema,
					endpoints: {
						create: true,
						read: true,
						update: false,
						delete: false,
						list: true,
					},
				}),
			],
			database: {
				provider: "sqlite",
				url: ":memory:",
			},
		});

		expect(crud).toBeDefined();
	});

	it("should handle auto-migration without errors", () => {
		// This test specifically checks the initTables function fix
		expect(() => {
			const crud = adiemus({
				resources: [
					createResource({
						name: "product",
						schema: productSchema,
					}),
				],
				database: {
					provider: "sqlite",
					url: ":memory:",
					autoMigrate: true, // This triggers the initTables function
				},
			});
			expect(crud).toBeDefined();
		}).not.toThrow();
	});
});
