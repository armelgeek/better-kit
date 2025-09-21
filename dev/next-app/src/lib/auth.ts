import { betterAuth } from "better-auth";
import { categorySchema, createResource, crud, organization, productSchema } from "better-auth/plugins";
import { github } from "better-auth/provider";

export const auth = betterAuth({
	basePath: "/api/auth",
	providers: [
		github({
			clientId: process.env.GITHUB_CLIENT_ID as string,
			clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
		}),
	],
	database: {
		provider: "sqlite",
		url: "./prisma/db.sqlite",
	},
	secret: "better-auth-secret.1234567890",
	emailAndPassword: {
		enabled: true,
	},
	plugins: [
		organization(),
		crud({
			resources: [
				createResource({
					name: "product",
					schema: productSchema,
					permissions: {
						create: async () => true,
						read: async () => true,
						update: async () => true,
						delete: async () => true,
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
