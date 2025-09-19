import { betterAuth } from "better-auth";
import {
	categorySchema,
	createResource,
	crud,
	productSchema,
	tagSchema,
} from "better-auth/plugins";

// Example usage of the CRUD plugin
export const auth = betterAuth({
	database: {
		provider: "sqlite",
		url: ":memory:",
	},
	plugins: [
		crud({
			resources: [
				createResource({
					name: "product",
					schema: productSchema,
					permissions: {
						create: async (user) => !!user, // Only authenticated users can create
						read: async () => true, // Anyone can read
						update: async (user, id) => !!user, // Only authenticated users can update
						delete: async (user, id) => !!user, // Only authenticated users can delete
						list: async () => true, // Anyone can list
					},
				}),
				createResource({
					name: "category",
					schema: categorySchema,
				}),
				createResource({
					name: "tag",
					schema: tagSchema,
				}),
			],
		}),
	],
});

export type Auth = typeof auth;
