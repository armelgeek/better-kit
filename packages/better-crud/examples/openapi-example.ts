import { betterCrud, openApiPlugin } from "better-crud";
import { z } from "zod";

// Define schemas for your resources
const userSchema = z.object({
	name: z.string().min(1, "Name is required"),
	email: z.string().email("Valid email is required"),
	age: z.number().min(0).optional(),
	role: z.enum(["user", "admin"]).default("user"),
});

const productSchema = z.object({
	name: z.string().min(1, "Product name is required"),
	description: z.string().optional(),
	price: z.number().min(0, "Price must be positive"),
	categoryId: z.string().optional(),
	tags: z.array(z.string()).default([]),
	status: z.enum(["active", "inactive", "draft"]).default("draft"),
	stock: z.number().int().min(0).default(0),
});

// Create CRUD instance with OpenAPI plugin
export const crud = betterCrud({
	database: {
		provider: "sqlite",
		url: "database.db",
	},
	resources: [
		{
			name: "user",
			schema: userSchema,
		},
		{
			name: "product",
			schema: productSchema,
		},
	],
	plugins: [
		// Add OpenAPI plugin with default settings
		openApiPlugin(),
		
		// Or with custom configuration:
		// openApiPlugin({
		//   path: "/docs",
		//   theme: "purple",
		//   disableDefaultReference: false,
		// }),
	],
});

// The OpenAPI plugin adds two endpoints:
// 1. GET /openapi/schema - Returns the OpenAPI JSON schema
// 2. GET /reference - Interactive API documentation (Scalar UI)

// Example usage:
export async function demonstrateOpenAPI() {
	console.log("OpenAPI endpoints available:");
	console.log("- GET /openapi/schema - OpenAPI JSON schema");
	console.log("- GET /reference - Interactive API documentation");
	
	// You can programmatically access the schema
	const schema = await crud.api.generateOpenAPISchema({});
	console.log("Generated OpenAPI schema info:", {
		version: schema.openapi,
		title: schema.info.title,
		pathCount: Object.keys(schema.paths).length,
		schemaCount: Object.keys(schema.components.schemas).length,
	});
}

export type CrudInstance = typeof crud;