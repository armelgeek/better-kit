import { describe, it, expect, vi } from "vitest";
import { createResource } from "./utils/schema";
import { z } from "zod";

// Schemas from the user's example
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

const categorySchema = z.object({
	id: z.string().optional(),
	name: z.string(),
	slug: z.string().optional(),
});

const orderSchema = z.object({
	id: z.string().optional(),
	userId: z.string().optional(),
	items: z.array(z.object({
		price: z.number(),
		quantity: z.number(),
	})),
	subtotal: z.number().optional(),
	tax: z.number().default(0),
	shipping: z.number().default(0),
	discount: z.number().default(0),
	total: z.number().optional(),
});

describe("User Example Integration Test", () => {
	it("should work with the exact user example structure", () => {
		// Product resource - demonstrates full CRUD with complex permissions
		const productResource = createResource({
			name: "product",
			schema: productSchema,
			permissions: {
				// Allow anyone to read products
				read: async () => true,
				list: async () => true,
				// Require authentication for modifications
				create: async (context) => {
					// Check if user is authenticated
					return !!context.user;
				},
				update: async (context) => {
					// Allow updates by authenticated users
					// In real app, you might check if user owns the product or is admin
					return !!context.user;
				},
				delete: async (context) => {
					// Only allow deletion by authenticated users
					// In real app, you might require admin role
					return !!context.user;
				},
			},
			// Demonstrate hooks for business logic
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
			// Enable specific endpoints (all are enabled by default)
			endpoints: {
				create: true,
				read: true,
				update: true,
				delete: true,
				list: true,
			},
		});

		// Category resource - demonstrates hierarchical data
		const categoryResource = createResource({
			name: "category",
			schema: categorySchema,
			permissions: {
				read: async () => true,
				list: async () => true,
				create: async (context) => !!context.user,
				update: async (context) => !!context.user,
				delete: async (context) => !!context.user,
			},
			hooks: {
				beforeCreate: async (context) => {
					// Generate slug from name
					if (!context.data.slug && context.data.name) {
						context.data.slug = context.data.name
							.toLowerCase()
							.replace(/[^a-z0-9]+/g, '-')
							.replace(/(^-|-$)/g, '');
					}
				},
			},
		});

		// Order resource - demonstrates complex business logic
		const orderResource = createResource({
			name: "order",
			schema: orderSchema,
			permissions: {
				read: async (context) => {
					// Users can only read their own orders
					return !!context.user && (
						context.user.role === "admin" || 
						context.existingData?.userId === context.user.id
					);
				},
				list: async (context) => {
					// Users can only list their own orders, admins can see all
					return !!context.user;
				},
				create: async (context) => !!context.user,
				update: async (context) => {
					// Only allow order updates by admin or order owner
					return !!context.user && (
						context.user.role === "admin" || 
						context.existingData?.userId === context.user.id
					);
				},
				delete: async (context) => {
					// Only admins can delete orders
					return !!context.user && context.user.role === "admin";
				},
			},
			hooks: {
				beforeCreate: async (context) => {
					// Set userId from authenticated user
					if (context.user) {
						context.data.userId = context.user.id;
					}
					
					// Calculate totals
					const subtotal = context.data.items.reduce((sum: number, item: any) => 
						sum + (item.price * item.quantity), 0
					);
					context.data.subtotal = subtotal;
					context.data.total = subtotal + context.data.tax + context.data.shipping - context.data.discount;
				},
				beforeUpdate: async (context) => {
					// Prevent changing userId after creation
					if (context.data.userId && context.existingData?.userId !== context.data.userId) {
						throw new Error("Cannot change order owner");
					}
					
					// Recalculate totals if items changed
					if (context.data.items) {
						const subtotal = context.data.items.reduce((sum: number, item: any) => 
							sum + (item.price * item.quantity), 0
						);
						context.data.subtotal = subtotal;
						context.data.total = subtotal + (context.data.tax || 0) + 
							(context.data.shipping || 0) - (context.data.discount || 0);
					}
				},
			},
		});

		// Verify all resources were created correctly
		expect(productResource.name).toBe("product");
		expect(productResource.hooks?.beforeCreate).toBeDefined();
		expect(productResource.hooks?.beforeUpdate).toBeDefined();
		expect(productResource.hooks?.afterCreate).toBeDefined();

		expect(categoryResource.name).toBe("category");
		expect(categoryResource.hooks?.beforeCreate).toBeDefined();

		expect(orderResource.name).toBe("order");
		expect(orderResource.hooks?.beforeCreate).toBeDefined();
		expect(orderResource.hooks?.beforeUpdate).toBeDefined();
	});

	it("should execute product beforeCreate hook correctly", async () => {
		const productResource = createResource({
			name: "product",
			schema: productSchema,
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
			},
		});

		const mockContext = {
			user: { id: "user123" },
			resource: "product",
			operation: "create" as const,
			data: { 
				name: "Awesome Product With Spaces!",
				price: 99.99 
			},
			adapter: {} as any,
		};

		await productResource.hooks?.beforeCreate?.(mockContext);

		// Verify the hook logic worked
		expect((mockContext.data as any).seo?.slug).toBe("awesome-product-with-spaces");
		expect((mockContext.data as any).status).toBe("draft");
	});

	it("should execute order beforeCreate hook correctly", async () => {
		const orderResource = createResource({
			name: "order",
			schema: orderSchema,
			hooks: {
				beforeCreate: async (context) => {
					// Set userId from authenticated user
					if (context.user) {
						context.data.userId = context.user.id;
					}
					
					// Calculate totals
					const subtotal = context.data.items.reduce((sum: number, item: any) => 
						sum + (item.price * item.quantity), 0
					);
					context.data.subtotal = subtotal;
					context.data.total = subtotal + context.data.tax + context.data.shipping - context.data.discount;
				},
			},
		});

		const mockContext = {
			user: { id: "user123" },
			resource: "order",
			operation: "create" as const,
			data: { 
				items: [
					{ price: 10.00, quantity: 2 },
					{ price: 15.00, quantity: 1 }
				],
				tax: 5.00,
				shipping: 3.00,
				discount: 2.00
			},
			adapter: {} as any,
		};

		await orderResource.hooks?.beforeCreate?.(mockContext);

		// Verify the hook logic worked
		expect((mockContext.data as any).userId).toBe("user123");
		expect((mockContext.data as any).subtotal).toBe(35.00); // (10*2) + (15*1)
		expect((mockContext.data as any).total).toBe(41.00); // 35 + 5 + 3 - 2
	});
});