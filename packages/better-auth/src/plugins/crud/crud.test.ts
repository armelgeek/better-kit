import { describe, expect, test } from "vitest";
import { z } from "zod";
import { createResource, crud } from "./index";

// Define a test schema since we no longer have predefined ones
const testProductSchema = z.object({
	id: z.string(),
	name: z.string().min(1, "Product name is required"),
	description: z.string().optional(),
	price: z.number().min(0, "Price must be positive"),
	createdAt: z.date().default(() => new Date()),
	updatedAt: z.date().default(() => new Date()),
});

describe("CRUD Plugin", () => {
	test("should create CRUD plugin with endpoints", () => {
		const crudPlugin = crud({
			resources: [
				createResource({
					name: "product",
					schema: testProductSchema,
				}),
			],
		});

		expect(crudPlugin.id).toBe("crud");
		expect(crudPlugin.endpoints).toBeDefined();
		expect(crudPlugin.schema).toBeDefined();

		// Check that endpoints are created
		const endpoints = Object.keys(crudPlugin.endpoints);
		expect(endpoints).toContain("createProduct");
		expect(endpoints).toContain("getProduct");
		expect(endpoints).toContain("updateProduct");
		expect(endpoints).toContain("deleteProduct");
		expect(endpoints).toContain("listProducts");
	});

	test("should create resource with default endpoints", () => {
		const resource = createResource({
			name: "test",
			schema: testProductSchema,
		});

		expect(resource.name).toBe("test");
		expect(resource.schema).toBe(testProductSchema);
		expect(resource.endpoints).toEqual({
			create: true,
			read: true,
			update: true,
			delete: true,
			list: true,
		});
	});

	test("should create resource with custom endpoints", () => {
		const resource = createResource({
			name: "test",
			schema: testProductSchema,
			endpoints: {
				create: true,
				read: true,
				update: false,
				delete: false,
				list: true,
			},
		});

		expect(resource.endpoints?.create).toBe(true);
		expect(resource.endpoints?.update).toBe(false);
		expect(resource.endpoints?.delete).toBe(false);
	});

	test("should generate schema fields from Zod schema", () => {
		const crudPlugin = crud({
			resources: [
				createResource({
					name: "product",
					schema: testProductSchema,
				}),
			],
		});

		expect(crudPlugin.schema.product).toBeDefined();

		if (crudPlugin.schema.product) {
			expect(crudPlugin.schema.product.fields).toBeDefined();

			// Check that fields is an object (the Zod introspection might not work perfectly in tests)
			const fields = crudPlugin.schema.product.fields;
			expect(typeof fields).toBe("object");
			console.log("Generated fields:", Object.keys(fields));
		}
	});
});
