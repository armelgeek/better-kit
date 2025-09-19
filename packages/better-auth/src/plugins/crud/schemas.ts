import { z } from "zod";

// Base schemas with common fields
export const baseResourceSchema = z.object({
	id: z.string(),
	createdAt: z.date().default(() => new Date()),
	updatedAt: z.date().default(() => new Date()),
});

// Product schema
export const productSchema = baseResourceSchema.extend({
	name: z.string().min(1, "Product name is required"),
	description: z.string().optional(),
	price: z.number().min(0, "Price must be positive"),
	categoryId: z.string().optional(),
	tags: z.array(z.string()).default([]),
	status: z.enum(["active", "inactive", "draft"]).default("draft"),
	sku: z.string().optional(),
	stock: z.number().int().min(0, "Stock must be non-negative").default(0),
});

// Category schema
export const categorySchema = baseResourceSchema.extend({
	name: z.string().min(1, "Category name is required"),
	description: z.string().optional(),
	parentId: z.string().optional(),
	slug: z.string().min(1, "Slug is required"),
	status: z.enum(["active", "inactive"]).default("active"),
});

// Tag schema
export const tagSchema = baseResourceSchema.extend({
	name: z.string().min(1, "Tag name is required"),
	color: z.string().optional(),
	description: z.string().optional(),
});

// Order schema
export const orderSchema = baseResourceSchema.extend({
	userId: z.string(),
	items: z.array(
		z.object({
			productId: z.string(),
			quantity: z.number().int().min(1),
			price: z.number().min(0),
		}),
	),
	total: z.number().min(0),
	status: z
		.enum(["pending", "processing", "shipped", "delivered", "cancelled"])
		.default("pending"),
	shippingAddress: z
		.object({
			street: z.string(),
			city: z.string(),
			state: z.string(),
			zipCode: z.string(),
			country: z.string(),
		})
		.optional(),
});

// Export types
export type Product = z.infer<typeof productSchema>;
export type Category = z.infer<typeof categorySchema>;
export type Tag = z.infer<typeof tagSchema>;
export type Order = z.infer<typeof orderSchema>;

// Schema map for easy access
export const resourceSchemas = {
	product: productSchema,
	category: categorySchema,
	tag: tagSchema,
	order: orderSchema,
} as const;

export type ResourceSchemas = typeof resourceSchemas;
export type ResourceName = keyof ResourceSchemas;
