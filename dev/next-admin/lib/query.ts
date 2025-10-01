import { betterQuery, createResource } from "better-query";
import { z } from "zod";
import { auth } from "./auth";

// Product schema
export const productSchema = z.object({
	id: z.string().optional(),
	name: z.string().min(1, "Product name is required"),
	description: z.string().optional(),
	price: z.number().min(0, "Price must be positive"),
	status: z.enum(["draft", "active", "inactive"]).default("draft"),
	category: z.string().optional(),
	stock: z.number().min(0).default(0),
	createdAt: z.date().optional(),
	updatedAt: z.date().optional(),
});

// User schema (for viewing user accounts)
export const userSchema = z.object({
	id: z.string().optional(),
	email: z.string().email(),
	name: z.string().optional(),
	role: z.enum(["admin", "user"]).default("user"),
	createdAt: z.date().optional(),
});

// Order schema
export const orderSchema = z.object({
	id: z.string().optional(),
	userId: z.string(),
	productId: z.string(),
	quantity: z.number().min(1),
	total: z.number(),
	status: z
		.enum(["pending", "processing", "completed", "cancelled"])
		.default("pending"),
	createdAt: z.date().optional(),
});

export const query = betterQuery({
	basePath: "/api/query",
	database: {
		provider: "sqlite",
		url: "./admin-data.db",
		autoMigrate: true,
	},
	resources: [
		// Product resource
		createResource({
			name: "product",
			schema: productSchema,
		}),

		// User resource (read-only for viewing)
		createResource({
			name: "user",
			schema: userSchema,
			middlewares: [
				{
					handler: async (context) => {
						const session = await auth.api.getSession({
							headers: context.request.headers,
						});
						if (session) context.user = session.user;
					},
				},
			],
			permissions: {
				create: async () => false, // Users created via auth
				read: async (context) => context.user?.role === "admin",
				update: async (context) => context.user?.role === "admin",
				delete: async () => false, // Can't delete users
				list: async (context) => context.user?.role === "admin",
			},
			endpoints: {
				create: false,
				delete: false,
			},
		}),

		// Order resource
		createResource({
			name: "order_product",
			schema: orderSchema,
			middlewares: [
				{
					handler: async (context) => {
						const session = await auth.api.getSession({
							headers: context.request.headers,
						});
						if (session) context.user = session.user;
					},
				},
			],
			permissions: {
				create: async (context) => !!context.user,
				read: async (context) => {
					if (!context.user) return false;
					if (context.user.role === "admin") return true;
					// Users can only view their own orders
					return context.existingData?.userId === context.user.id;
				},
				update: async (context) => context.user?.role === "admin",
				delete: async (context) => context.user?.role === "admin",
				list: async (context) => !!context.user,
			},
		}),
	],
});
