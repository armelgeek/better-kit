import { describe, it, expect, vi } from "vitest";
import { createResource } from "./utils/schema";
import { z } from "zod";

// Simple product schema for testing
const productSchema = z.object({
	id: z.string().optional(),
	name: z.string(),
	price: z.number(),
	status: z.string().optional(),
	seo: z.object({
		slug: z.string().optional(),
	}).optional(),
	createdAt: z.date().optional(),
	updatedAt: z.date().optional(),
});

describe("User Example - CRUD Resource Hooks Integration", () => {
	it("should create resource with beforeCreate hook like in user example", () => {
		const resource = createResource({
			name: "product",
			schema: productSchema,
			permissions: {
				read: async () => true,
				list: async () => true,
				create: async (context) => {
					return !!context.user;
				},
				update: async (context) => {
					return !!context.user;
				},
				delete: async (context) => {
					return !!context.user;
				},
			},
			hooks: {
				beforeCreate: async (context) => {
					// Generate slug from name if not provided
					if (!context.data.seo?.slug && context.data.name) {
						const slug = context.data.name
							.toLowerCase()
							.replace(/[^a-z0-9]+/g, '-')
							.replace(/(^-|-$)/g, '');
						context.data.seo = { ...context.data.seo, slug };
					}
					
					// Set default status if not provided
					if (!context.data.status) {
						context.data.status = "draft";
					}
				},
				beforeUpdate: async (context) => {
					// Always update the updatedAt field
					context.data.updatedAt = new Date();
					
					// Update slug if name changed
					if (context.data.name && context.existingData?.name !== context.data.name) {
						const slug = context.data.name
							.toLowerCase()
							.replace(/[^a-z0-9]+/g, '-')
							.replace(/(^-|-$)/g, '');
						context.data.seo = { ...context.data.seo, slug };
					}
				},
				afterCreate: async (context) => {
					console.log(`Product created: ${context.result.name} (ID: ${context.result.id})`);
				},
			},
			endpoints: {
				create: true,
				read: true,
				update: true,
				delete: true,
				list: true,
			},
		});

		// Verify the resource was created correctly
		expect(resource.name).toBe("product");
		expect(resource.schema).toBe(productSchema);
		expect(resource.hooks?.beforeCreate).toBeDefined();
		expect(resource.hooks?.beforeUpdate).toBeDefined();
		expect(resource.hooks?.afterCreate).toBeDefined();
		expect(resource.permissions?.create).toBeDefined();
		expect(resource.permissions?.read).toBeDefined();
		expect(resource.endpoints).toEqual({
			create: true,
			read: true,
			update: true,
			delete: true,
			list: true,
		});
	});

	it("should support beforeCreate hook that modifies data", async () => {
		const beforeCreateHook = vi.fn(async (context) => {
			// Generate slug from name if not provided
			if (!context.data.seo?.slug && context.data.name) {
				const slug = context.data.name
					.toLowerCase()
					.replace(/[^a-z0-9]+/g, '-')
					.replace(/(^-|-$)/g, '');
				context.data.seo = { ...context.data.seo, slug };
			}
			
			// Set default status if not provided
			if (!context.data.status) {
				context.data.status = "draft";
			}
		});

		const resource = createResource({
			name: "product",
			schema: productSchema,
			hooks: {
				beforeCreate: beforeCreateHook,
			},
		});

		// Simulate hook execution
		const mockContext = {
			user: { id: "user123" },
			resource: "product",
			operation: "create" as const,
			data: { 
				name: "Test Product With Spaces",
				price: 99.99 
			},
			adapter: {} as any,
		};

		await resource.hooks?.beforeCreate?.(mockContext);

		// Verify the hook was called and modified the data
		expect(beforeCreateHook).toHaveBeenCalledWith(mockContext);
		expect(mockContext.data.seo?.slug).toBe("test-product-with-spaces");
		expect(mockContext.data.status).toBe("draft");
	});

	it("should support beforeUpdate hook that modifies data", async () => {
		const beforeUpdateHook = vi.fn(async (context) => {
			// Always update the updatedAt field
			context.data.updatedAt = new Date();
			
			// Update slug if name changed
			if (context.data.name && context.existingData?.name !== context.data.name) {
				const slug = context.data.name
					.toLowerCase()
					.replace(/[^a-z0-9]+/g, '-')
					.replace(/(^-|-$)/g, '');
				context.data.seo = { ...context.data.seo, slug };
			}
		});

		const resource = createResource({
			name: "product",
			schema: productSchema,
			hooks: {
				beforeUpdate: beforeUpdateHook,
			},
		});

		// Simulate hook execution
		const mockContext = {
			user: { id: "user123" },
			resource: "product",
			operation: "update" as const,
			data: { 
				name: "Updated Product Name",
				price: 149.99 
			},
			existingData: {
				name: "Old Product Name",
				price: 99.99,
			},
			adapter: {} as any,
		};

		await resource.hooks?.beforeUpdate?.(mockContext);

		// Verify the hook was called and modified the data
		expect(beforeUpdateHook).toHaveBeenCalledWith(mockContext);
		expect(mockContext.data.updatedAt).toBeInstanceOf(Date);
		expect(mockContext.data.seo?.slug).toBe("updated-product-name");
	});

	it("should support afterCreate hook for side effects", async () => {
		const afterCreateHook = vi.fn(async (context) => {
			console.log(`Product created: ${context.result.name} (ID: ${context.result.id})`);
		});

		const resource = createResource({
			name: "product",
			schema: productSchema,
			hooks: {
				afterCreate: afterCreateHook,
			},
		});

		// Simulate hook execution
		const mockContext = {
			user: { id: "user123" },
			resource: "product",
			operation: "create" as const,
			result: { 
				id: "prod123",
				name: "New Product",
				price: 99.99 
			},
			adapter: {} as any,
		};

		await resource.hooks?.afterCreate?.(mockContext);

		// Verify the hook was called
		expect(afterCreateHook).toHaveBeenCalledWith(mockContext);
	});
});