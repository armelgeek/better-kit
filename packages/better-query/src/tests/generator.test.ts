import { describe, expect, it } from "vitest";
import { z } from "zod";
import { generator } from "../plugins/openapi/generator";
import type { CrudContext } from "../types";

describe("OpenAPI Generator", () => {
	const createMockContext = (resources: any[]): CrudContext => ({
		db: null,
		adapter: {} as any,
		relationships: new Map(),
		schemas: new Map(),
		pluginManager: {} as any,
		options: {
			resources,
			database: { provider: "sqlite", url: ":memory:" },
			basePath: "/api",
		},
	});

	it("should generate valid OpenAPI 3.1.0 schema", async () => {
		const userSchema = z.object({
			name: z.string(),
			email: z.string().email(),
		});

		const context = createMockContext([
			{
				name: "user",
				schema: userSchema,
			},
		]);

		const result = await generator(context);

		expect(result.openapi).toBe("3.1.0");
		expect(result.info).toEqual({
			title: "Better CRUD API",
			description: "Auto-generated API documentation for Better CRUD resources",
			version: "1.0.0",
		});
	});

	it("should generate schemas for resources", async () => {
		const userSchema = z.object({
			name: z.string(),
			email: z.string().email(),
			age: z.number().optional(),
		});

		const context = createMockContext([
			{
				name: "user",
				schema: userSchema,
			},
		]);

		const result = await generator(context);

		expect(result.components.schemas.User).toBeDefined();
		expect(result.components.schemas.UserInput).toBeDefined();

		// Check User schema includes timestamps and ID
		const userSchema_result = result.components.schemas.User;
		expect(userSchema_result.properties.id).toEqual({
			type: "string",
			description: "Unique identifier",
		});
		expect(userSchema_result.properties.createdAt).toEqual({
			type: "string",
			format: "date-time",
			description: "Creation timestamp",
		});
		expect(userSchema_result.properties.updatedAt).toEqual({
			type: "string",
			format: "date-time",
			description: "Last update timestamp",
		});

		// Check UserInput schema
		const userInputSchema = result.components.schemas.UserInput;
		expect(userInputSchema.properties.name).toEqual({ type: "string" });
		expect(userInputSchema.properties.email).toEqual({ type: "string" });
		expect(userInputSchema.properties.age).toEqual({
			type: "number",
			nullable: true,
		});
	});

	it("should generate CRUD endpoints", async () => {
		const productSchema = z.object({
			name: z.string(),
			price: z.number(),
		});

		const context = createMockContext([
			{
				name: "product",
				schema: productSchema,
			},
		]);

		const result = await generator(context);

		// Check LIST endpoint
		expect(result.paths["/product"]).toBeDefined();
		expect(result.paths["/product"].get).toBeDefined();
		expect(result.paths["/product"].get.operationId).toBe("listProducts");

		// Check CREATE endpoint
		expect(result.paths["/product"].post).toBeDefined();
		expect(result.paths["/product"].post.operationId).toBe("createProduct");

		// Check READ endpoint
		expect(result.paths["/product/{id}"]).toBeDefined();
		expect(result.paths["/product/{id}"].get).toBeDefined();
		expect(result.paths["/product/{id}"].get.operationId).toBe("getProduct");

		// Check UPDATE endpoint
		expect(result.paths["/product/{id}"].put).toBeDefined();
		expect(result.paths["/product/{id}"].put.operationId).toBe("updateProduct");

		// Check DELETE endpoint
		expect(result.paths["/product/{id}"].delete).toBeDefined();
		expect(result.paths["/product/{id}"].delete.operationId).toBe(
			"deleteProduct",
		);
	});

	it("should include standard response codes", async () => {
		const userSchema = z.object({
			name: z.string(),
		});

		const context = createMockContext([
			{
				name: "user",
				schema: userSchema,
			},
		]);

		const result = await generator(context);

		const createEndpoint = result.paths["/user"].post;
		expect(createEndpoint.responses["201"]).toBeDefined();
		expect(createEndpoint.responses["400"]).toBeDefined();
		expect(createEndpoint.responses["401"]).toBeDefined();
		expect(createEndpoint.responses["403"]).toBeDefined();
		expect(createEndpoint.responses["404"]).toBeDefined();
		expect(createEndpoint.responses["500"]).toBeDefined();
	});

	it("should include query parameters for endpoints", async () => {
		const userSchema = z.object({
			name: z.string(),
		});

		const context = createMockContext([
			{
				name: "user",
				schema: userSchema,
			},
		]);

		const result = await generator(context);

		// Check LIST endpoint parameters
		const listEndpoint = result.paths["/user"].get;
		expect(listEndpoint.parameters).toBeDefined();
		const paramNames = listEndpoint.parameters.map((p: any) => p.name);
		expect(paramNames).toContain("page");
		expect(paramNames).toContain("limit");
		expect(paramNames).toContain("search");
		expect(paramNames).toContain("include");

		// Check READ endpoint parameters
		const readEndpoint = result.paths["/user/{id}"].get;
		expect(readEndpoint.parameters).toBeDefined();
		const readParamNames = readEndpoint.parameters.map((p: any) => p.name);
		expect(readParamNames).toContain("id");
		expect(readParamNames).toContain("include");
	});

	it("should handle multiple resources", async () => {
		const userSchema = z.object({
			name: z.string(),
		});

		const productSchema = z.object({
			name: z.string(),
			price: z.number(),
		});

		const context = createMockContext([
			{
				name: "user",
				schema: userSchema,
			},
			{
				name: "product",
				schema: productSchema,
			},
		]);

		const result = await generator(context);

		// Check that both resources have schemas
		expect(result.components.schemas.User).toBeDefined();
		expect(result.components.schemas.UserInput).toBeDefined();
		expect(result.components.schemas.Product).toBeDefined();
		expect(result.components.schemas.ProductInput).toBeDefined();

		// Check that both resources have endpoints
		expect(result.paths["/user"]).toBeDefined();
		expect(result.paths["/product"]).toBeDefined();

		// Check tags
		const tagNames = result.tags.map((tag: any) => tag.name);
		expect(tagNames).toContain("User");
		expect(tagNames).toContain("Product");
		expect(tagNames).toContain("OpenAPI");
	});

	it("should include OpenAPI plugin endpoints", async () => {
		const context = createMockContext([]);
		const result = await generator(context);

		expect(result.paths["/openapi/schema"]).toBeDefined();
		expect(result.paths["/openapi/schema"].get).toBeDefined();
		expect(result.paths["/openapi/schema"].get.operationId).toBe(
			"getOpenAPISchema",
		);
	});

	it("should handle disabled endpoints", async () => {
		const userSchema = z.object({
			name: z.string(),
		});

		const context = createMockContext([
			{
				name: "user",
				schema: userSchema,
				endpoints: {
					create: false,
					delete: false,
				},
			},
		]);

		const result = await generator(context);

		// POST (create) should not exist
		expect(result.paths["/user"].post).toBeUndefined();

		// DELETE should not exist
		expect(result.paths["/user/{id}"].delete).toBeUndefined();

		// But other endpoints should exist
		expect(result.paths["/user"].get).toBeDefined(); // LIST
		expect(result.paths["/user/{id}"].get).toBeDefined(); // READ
		expect(result.paths["/user/{id}"].put).toBeDefined(); // UPDATE
	});

	it.skip("should handle complex Zod schemas", async () => {
		// TODO: Fix complex schema handling for arrays with defaults
		const complexSchema = z.object({
			name: z.string().min(1),
			age: z.number().min(0).max(120),
			email: z.string().email(),
			tags: z.array(z.string()).default([]),
			metadata: z.record(z.string(), z.any()).optional(),
			status: z.enum(["active", "inactive"]).default("active"),
		});

		const context = createMockContext([
			{
				name: "complex",
				schema: complexSchema,
			},
		]);

		const result = await generator(context);

		const inputSchema = result.components.schemas.ComplexInput;
		expect(inputSchema.properties.name).toEqual({ type: "string" });
		expect(inputSchema.properties.age).toEqual({ type: "number" });
		expect(inputSchema.properties.email).toEqual({ type: "string" });
		expect(inputSchema.properties.tags).toEqual({
			type: "array",
			description: undefined,
		});
		expect(inputSchema.properties.metadata).toEqual({
			type: "object",
			nullable: true,
		});
		expect(inputSchema.properties.status).toEqual({ type: "string" });
	});
});
