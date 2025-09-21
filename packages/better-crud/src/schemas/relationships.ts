import { z } from "zod";
import { RelationshipConfig } from "../types";

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
 * Product relationships
 */
export const productRelationships: Record<string, RelationshipConfig> = {
	category: {
		type: "belongsTo",
		target: "category",
		foreignKey: "categoryId",
		targetKey: "id",
	},
	reviews: {
		type: "hasMany",
		target: "review",
		foreignKey: "productId",
		targetKey: "id",
	},
	tags: {
		type: "belongsToMany",
		target: "tag",
		through: "product_tags",
		sourceKey: "productId",
		targetForeignKey: "tagId",
	},
};

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
 * Category relationships
 */
export const categoryRelationships: Record<string, RelationshipConfig> = {
	parent: {
		type: "belongsTo",
		target: "category",
		foreignKey: "parentId",
		targetKey: "id",
	},
	children: {
		type: "hasMany",
		target: "category",
		foreignKey: "parentId",
		targetKey: "id",
	},
	products: {
		type: "hasMany",
		target: "product",
		foreignKey: "categoryId",
		targetKey: "id",
	},
};

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
 * Tag relationships
 */
export const tagRelationships: Record<string, RelationshipConfig> = {
	products: {
		type: "belongsToMany",
		target: "product",
		through: "product_tags",
		sourceKey: "tagId",
		targetForeignKey: "productId",
	},
};

/**
 * Review schema for product reviews
 */
export const reviewSchema = z.object({
	id: z.string().optional(),
	productId: z.string(),
	userId: z.string(),
	rating: z.number().int().min(1).max(5),
	title: z.string().min(1, "Review title is required"),
	content: z.string().min(1, "Review content is required"),
	status: z.enum(["pending", "approved", "rejected"]).default("pending"),
	createdAt: z.date().default(() => new Date()),
	updatedAt: z.date().default(() => new Date()),
});

/**
 * Review relationships
 */
export const reviewRelationships: Record<string, RelationshipConfig> = {
	product: {
		type: "belongsTo",
		target: "product",
		foreignKey: "productId",
		targetKey: "id",
	},
	user: {
		type: "belongsTo",
		target: "user",
		foreignKey: "userId",
		targetKey: "id",
	},
};

/**
 * Order schema for e-commerce
 */
export const orderSchema = z.object({
	id: z.string().optional(),
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
 * Order relationships
 */
export const orderRelationships: Record<string, RelationshipConfig> = {
	user: {
		type: "belongsTo",
		target: "user",
		foreignKey: "userId",
		targetKey: "id",
	},
};

/**
 * User schema for basic user management
 */
export const userSchema = z.object({
	id: z.string().optional(),
	email: z.string().email("Valid email is required"),
	name: z.string().min(1, "Name is required"),
	role: z.enum(["user", "admin"]).default("user"),
	status: z.enum(["active", "inactive", "suspended"]).default("active"),
	profile: z
		.object({
			avatar: z.string().optional(),
			bio: z.string().optional(),
			website: z.string().optional(),
		})
		.optional(),
	createdAt: z.date().default(() => new Date()),
	updatedAt: z.date().default(() => new Date()),
});

/**
 * User relationships
 */
export const userRelationships: Record<string, RelationshipConfig> = {
	orders: {
		type: "hasMany",
		target: "order",
		foreignKey: "userId",
		targetKey: "id",
	},
	reviews: {
		type: "hasMany",
		target: "review",
		foreignKey: "userId",
		targetKey: "id",
	},
	posts: {
		type: "hasMany",
		target: "post",
		foreignKey: "authorId",
		targetKey: "id",
	},
};

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

/**
 * Post relationships
 */
export const postRelationships: Record<string, RelationshipConfig> = {
	author: {
		type: "belongsTo",
		target: "user",
		foreignKey: "authorId",
		targetKey: "id",
	},
	category: {
		type: "belongsTo",
		target: "category",
		foreignKey: "categoryId",
		targetKey: "id",
	},
};

// Export types inferred from schemas
export type Product = z.infer<typeof productSchema>;
export type Category = z.infer<typeof categorySchema>;
export type Tag = z.infer<typeof tagSchema>;
export type Review = z.infer<typeof reviewSchema>;
export type Order = z.infer<typeof orderSchema>;
export type User = z.infer<typeof userSchema>;
export type Post = z.infer<typeof postSchema>;