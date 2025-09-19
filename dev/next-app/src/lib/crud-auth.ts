import { betterAuth } from "better-auth";
import { betterCrud } from "../../../../packages/better-crud/src/crud";
import { categorySchema, createResource, productSchema } from "../../../../packages/better-crud/src/";

export const auth = betterAuth({
	database: {
		provider: "sqlite",
		url: "data.db",
	},
	secret: process.env.BETTER_AUTH_SECRET ?? "secret",
	emailAndPassword: {
		enabled: true,
	},
});

export const crud = betterCrud({
	database: {
		provider: "sqlite",
		url: "data.db",
		autoMigrate: true,
	},
	resources: [
		createResource({
			name: "product",
			schema: productSchema,
			permissions: {
				create: async (context) => !!context.user,
				read: async () => true,
				update: async (context) => !!context.user,
				delete: async (context) => !!context.user,
				list: async () => true,
			},
		}),
		createResource({
			name: "category",
			schema: categorySchema,
		}),
	],
});

export type Auth = typeof auth;
export type Crud = typeof crud;
