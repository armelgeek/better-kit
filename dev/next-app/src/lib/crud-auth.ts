import { betterAuth } from "better-auth";
import {
	categorySchema,
	createQueryClient,
	createResource,
	productSchema,
} from "../../../../packages/better-query/src/";
import { betterQuery } from "../../../../packages/better-query/src/query";

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

export const query = betterQuery({
	basePath: "/api/query",
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

export const queryClient = createQueryClient<typeof query>({
	baseURL: "http://localhost:3000/api/query",
});

export type Auth = typeof auth;
export type Query = typeof query;

// Legacy aliases for backward compatibility
export const crud = query;
export const crudClient = queryClient;
export type Crud = typeof query;
