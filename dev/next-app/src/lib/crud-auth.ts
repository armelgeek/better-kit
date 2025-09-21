import { betterAuth } from "better-auth";
import { betterCrud } from "../../../../packages/better-crud/src/crud";
import { categorySchema, createCrudClient, createResource, productSchema } from "../../../../packages/better-crud/src/";

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
	basePath: "/api/crud", 
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
				create: async (context) => true,
				read: async () => true,
				update: async (context) => true,
				delete: async (context) => true,
				list: async () => true,
			},
		}),
		createResource({
			name: "category",
			schema: categorySchema,
		}),
	],
});

export const crudClient = createCrudClient<typeof crud>({
	baseURL: "http://localhost:3000/api/crud",
});

export type Auth = typeof auth;
export type Crud = typeof crud;
