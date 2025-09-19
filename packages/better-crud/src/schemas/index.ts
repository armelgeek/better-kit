import { z } from "zod";

/**
 * Product schema with common e-commerce fields
 */
export const productSchema = z.object({
	id: z.string().optional(),
	name: z.string().min(1, "Product name is required"),
	description: z.string().optional(),
	price: z.number().min(0, "Price must be positive"),
	categoryId: z.string().optional(),
	tags: z.array(z.string()).default([]),
	status: z.enum(["active", "inactive", "draft"]).default("draft"),
	sku: z.string().optional(),
	stock: z.number().int().min(0).default(0),
	createdAt: z.date().default(() => new Date()),
	updatedAt: z.date().default(() => new Date()),
});

/**
 * Category schema for organizing products
 */
export const categorySchema = z.object({
	id: z.string().optional(),
	name: z.string().min(1, "Category name is required"),
	description: z.string().optional(),
	parentId: z.string().optional(),
	slug: z.string().min(1, "Slug is required"),
	status: z.enum(["active", "inactive"]).default("active"),
	createdAt: z.date().default(() => new Date()),
	updatedAt: z.date().default(() => new Date()),
});

/**
 * Tag schema for labeling content
 */
export const tagSchema = z.object({
	id: z.string().optional(),
	name: z.string().min(1, "Tag name is required"),
	color: z.string().optional(),
	description: z.string().optional(),
	createdAt: z.date().default(() => new Date()),
	updatedAt: z.date().default(() => new Date()),
});

/**
 * Order schema for e-commerce
 */
export const orderSchema = z.object({
	id: z.string().optional(),
	userId: z.string(),
	items: z.array(z.object({
		productId: z.string(),
		quantity: z.number().int().min(1),
		price: z.number().min(0),
	})),
	total: z.number().min(0),
	status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled"]).default("pending"),
	shippingAddress: z.object({
		street: z.string(),
		city: z.string(),
		state: z.string().optional(),
		country: z.string(),
		postalCode: z.string(),
	}),
	createdAt: z.date().default(() => new Date()),
	updatedAt: z.date().default(() => new Date()),
});

/**
 * User schema for basic user management
 */
export const userSchema = z.object({
	id: z.string().optional(),
	email: z.string().email("Valid email is required"),
	name: z.string().min(1, "Name is required"),
	role: z.enum(["user", "admin"]).default("user"),
	status: z.enum(["active", "inactive", "suspended"]).default("active"),
	profile: z.object({
		avatar: z.string().optional(),
		bio: z.string().optional(),
		website: z.string().optional(),
	}).optional(),
	createdAt: z.date().default(() => new Date()),
	updatedAt: z.date().default(() => new Date()),
});

/**
 * Post schema for blog/content management
 */
export const postSchema = z.object({
	id: z.string().optional(),
	title: z.string().min(1, "Title is required"),
	content: z.string().min(1, "Content is required"),
	excerpt: z.string().optional(),
	slug: z.string().min(1, "Slug is required"),
	authorId: z.string(),
	categoryId: z.string().optional(),
	tags: z.array(z.string()).default([]),
	status: z.enum(["draft", "published", "archived"]).default("draft"),
	publishedAt: z.date().optional(),
	createdAt: z.date().default(() => new Date()),
	updatedAt: z.date().default(() => new Date()),
});

// Export types inferred from schemas
export type Product = z.infer<typeof productSchema>;
export type Category = z.infer<typeof categorySchema>;
export type Tag = z.infer<typeof tagSchema>;
export type Order = z.infer<typeof orderSchema>;
export type User = z.infer<typeof userSchema>;
export type Post = z.infer<typeof postSchema>;