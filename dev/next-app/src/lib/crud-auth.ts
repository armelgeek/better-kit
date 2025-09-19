import { betterAuth } from "better-auth";
import { crud, createResource, productSchema, categorySchema } from "better-auth/plugins";

export const auth = betterAuth({
	database: {
		provider: "sqlite",
		url: "data.db",
	},
	secret: process.env.BETTER_AUTH_SECRET ?? "secret",
	plugins: [
		crud({
			resources: [
				createResource({
					name: "product",
					schema: productSchema,
					permissions: {
						create: async (user) => !!user,
						read: async () => true,
						update: async (user) => !!user,
						delete: async (user) => !!user,
						list: async () => true,
					},
				}),
				createResource({
					name: "category",
					schema: categorySchema,
				}),
			],
		}),
	],
});

export type Auth = typeof auth;