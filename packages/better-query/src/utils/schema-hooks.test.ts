import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createResource } from "./schema";

describe("createResource with hooks", () => {
	const testSchema = z.object({
		id: z.string(),
		name: z.string(),
		price: z.number(),
	});

	it("should accept beforeCreate hook", () => {
		const beforeCreateHook = vi.fn();

		const resource = createResource({
			name: "product",
			schema: testSchema,
			hooks: {
				beforeCreate: beforeCreateHook,
			},
		});

		expect(resource.hooks?.beforeCreate).toBe(beforeCreateHook);
	});

	it("should accept beforeUpdate hook", () => {
		const beforeUpdateHook = vi.fn();

		const resource = createResource({
			name: "product",
			schema: testSchema,
			hooks: {
				beforeUpdate: beforeUpdateHook,
			},
		});

		expect(resource.hooks?.beforeUpdate).toBe(beforeUpdateHook);
	});

	it("should accept beforeDelete hook", () => {
		const beforeDeleteHook = vi.fn();

		const resource = createResource({
			name: "product",
			schema: testSchema,
			hooks: {
				beforeDelete: beforeDeleteHook,
			},
		});

		expect(resource.hooks?.beforeDelete).toBe(beforeDeleteHook);
	});

	it("should accept afterCreate hook", () => {
		const afterCreateHook = vi.fn();

		const resource = createResource({
			name: "product",
			schema: testSchema,
			hooks: {
				afterCreate: afterCreateHook,
			},
		});

		expect(resource.hooks?.afterCreate).toBe(afterCreateHook);
	});

	it("should accept afterUpdate hook", () => {
		const afterUpdateHook = vi.fn();

		const resource = createResource({
			name: "product",
			schema: testSchema,
			hooks: {
				afterUpdate: afterUpdateHook,
			},
		});

		expect(resource.hooks?.afterUpdate).toBe(afterUpdateHook);
	});

	it("should accept afterDelete hook", () => {
		const afterDeleteHook = vi.fn();

		const resource = createResource({
			name: "product",
			schema: testSchema,
			hooks: {
				afterDelete: afterDeleteHook,
			},
		});

		expect(resource.hooks?.afterDelete).toBe(afterDeleteHook);
	});

	it("should accept legacy onCreate hook", () => {
		const onCreateHook = vi.fn();

		const resource = createResource({
			name: "product",
			schema: testSchema,
			hooks: {
				onCreate: onCreateHook,
			},
		});

		expect(resource.hooks?.onCreate).toBe(onCreateHook);
	});

	it("should accept multiple hooks", () => {
		const beforeCreateHook = vi.fn();
		const afterCreateHook = vi.fn();
		const beforeUpdateHook = vi.fn();

		const resource = createResource({
			name: "product",
			schema: testSchema,
			hooks: {
				beforeCreate: beforeCreateHook,
				afterCreate: afterCreateHook,
				beforeUpdate: beforeUpdateHook,
			},
		});

		expect(resource.hooks?.beforeCreate).toBe(beforeCreateHook);
		expect(resource.hooks?.afterCreate).toBe(afterCreateHook);
		expect(resource.hooks?.beforeUpdate).toBe(beforeUpdateHook);
	});

	it("should pass through all config properties", () => {
		const beforeCreateHook = vi.fn();

		const resource = createResource({
			name: "product",
			schema: testSchema,
			tableName: "products",
			hooks: {
				beforeCreate: beforeCreateHook,
			},
			permissions: {
				create: () => true,
			},
		});

		expect(resource.name).toBe("product");
		expect(resource.schema).toBe(testSchema);
		expect(resource.tableName).toBe("products");
		expect(resource.hooks?.beforeCreate).toBe(beforeCreateHook);
		expect(resource.permissions?.create).toBeDefined();
		expect(resource.endpoints).toEqual({
			create: true,
			read: true,
			update: true,
			delete: true,
			list: true,
		});
	});
});
