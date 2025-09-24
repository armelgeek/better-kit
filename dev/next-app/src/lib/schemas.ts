import { z } from "zod";
import { withId } from "../../../../packages/better-query/src/schemas";

// Product Schema - demonstrates a complete e-commerce product
export const productSchema = withId({
	name: z.string().min(1, "Product name is required"),
	description: z.string().optional(),
	price: z.number().positive("Price must be positive"),
	originalPrice: z.number().positive().optional(),
	status: z.enum(["active", "inactive", "draft"]).default("draft"),
	categoryId: z.string().optional(),
	createdBy: z.string().optional(), // User who created the product
	tags: z.array(z.string()).default([]),
	images: z.array(z.string()).default([]),
	inventory: z.object({
		quantity: z.number().min(0).default(0),
		lowStockThreshold: z.number().min(0).default(10),
		trackQuantity: z.boolean().default(true),
	}).default({
		quantity: 0,
		lowStockThreshold: 10,
		trackQuantity: true,
	}),
	profile: z.object({
		featured: z.boolean().default(false),
		category: z.string().optional(),
		weight: z.number().optional(),
		dimensions: z.object({
			length: z.number().optional(),
			width: z.number().optional(),
			height: z.number().optional(),
		}).optional(),
	}).default({
		featured: false,
	}),
	seo: z.object({
		metaTitle: z.string().optional(),
		metaDescription: z.string().optional(),
		slug: z.string().optional(),
	}).optional(),
});

// Category Schema - demonstrates hierarchical categories
export const categorySchema = withId({
	name: z.string().min(1, "Category name is required"),
	description: z.string().optional(),
	slug: z.string().optional(),
	parentId: z.string().optional(),
	status: z.enum(["active", "inactive"]).default("active"),
	sortOrder: z.number().default(0),
	metadata: z.object({
		color: z.string().optional(),
		icon: z.string().optional(),
		featured: z.boolean().default(false),
	}).default({
		featured: false,
	}),
});

// Order Schema - demonstrates complex relationships
export const orderSchema = withId({
	userId: z.string(),
	status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled"]).default("pending"),
	total: z.number().positive(),
	subtotal: z.number().positive(),
	tax: z.number().min(0).default(0),
	shipping: z.number().min(0).default(0),
	discount: z.number().min(0).default(0),
	currency: z.string().default("USD"),
	shippingAddress: z.object({
		street: z.string(),
		city: z.string(),
		state: z.string(),
		zip: z.string(),
		country: z.string(),
	}),
	billingAddress: z.object({
		street: z.string(),
		city: z.string(),
		state: z.string(),
		zip: z.string(),
		country: z.string(),
	}),
	items: z.array(z.object({
		productId: z.string(),
		quantity: z.number().positive(),
		price: z.number().positive(),
		name: z.string(),
	})),
	notes: z.string().optional(),
	fulfillmentDate: z.date().optional(),
});

// Review Schema - demonstrates user-generated content
export const reviewSchema = withId({
	productId: z.string(),
	userId: z.string(),
	rating: z.number().min(1).max(5),
	title: z.string().optional(),
	content: z.string().min(10, "Review must be at least 10 characters"),
	verified: z.boolean().default(false),
	helpful: z.number().default(0),
	status: z.enum(["pending", "approved", "rejected"]).default("pending"),
});

// User Profile Schema - extends basic user with profile data
export const userProfileSchema = withId({
	userId: z.string(),
	firstName: z.string().optional(),
	lastName: z.string().optional(),
	phone: z.string().optional(),
	dateOfBirth: z.date().optional(),
	preferences: z.object({
		newsletter: z.boolean().default(false),
		notifications: z.boolean().default(true),
		theme: z.enum(["light", "dark", "auto"]).default("auto"),
		language: z.string().default("en"),
	}).default({
		newsletter: false,
		notifications: true,
		theme: "auto",
		language: "en",
	}),
	addresses: z.array(z.object({
		id: z.string().optional(),
		type: z.enum(["home", "work", "billing", "shipping"]),
		street: z.string(),
		city: z.string(),
		state: z.string(),
		zip: z.string(),
		country: z.string(),
		isDefault: z.boolean().default(false),
	})).default([]),
	avatar: z.string().optional(),
	bio: z.string().optional(),
});

// Export type inference helpers
export type Product = z.infer<typeof productSchema>;
export type Category = z.infer<typeof categorySchema>;
export type Order = z.infer<typeof orderSchema>;
export type Review = z.infer<typeof reviewSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;

// Export input types (without optional fields like id, createdAt, updatedAt)
export type ProductInput = z.input<typeof productSchema>;
export type CategoryInput = z.input<typeof categorySchema>;
export type OrderInput = z.input<typeof orderSchema>;
export type ReviewInput = z.input<typeof reviewSchema>;
export type UserProfileInput = z.input<typeof userProfileSchema>;