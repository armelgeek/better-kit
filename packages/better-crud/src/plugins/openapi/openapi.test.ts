import { describe, it, expect, beforeEach } from "vitest";
import { betterCrud } from "../../crud";
import { openApiPlugin } from "./index";
import { z } from "zod";

describe("OpenAPI Plugin", () => {
	let crud: any;

	beforeEach(() => {
		const userSchema = z.object({
			name: z.string(),
			email: z.string().email(),
			age: z.number().optional(),
		});

		const productSchema = z.object({
			name: z.string(),
			price: z.number(),
			description: z.string().optional(),
		});

		crud = betterCrud({
			database: {
				provider: "sqlite" as const,
				url: ":memory:",
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
			plugins: [openApiPlugin()],
		});
	});

	it("should add OpenAPI endpoints to the CRUD instance", () => {
		expect(crud.api.generateOpenAPISchema).toBeDefined();
		expect(crud.api.openAPIReference).toBeDefined();
	});

	it("should generate valid OpenAPI schema", async () => {
		const response = await crud.api.generateOpenAPISchema({});
		expect(response.status).toBe(200);
		
		const schema = await response.json();
		expect(schema.openapi).toBe("3.1.0");
		expect(schema.info).toBeDefined();
		expect(schema.info.title).toBe("Better CRUD API");
		expect(schema.paths).toBeDefined();
		expect(schema.components).toBeDefined();
		expect(schema.components.schemas).toBeDefined();
	});

	it("should include resource schemas in OpenAPI spec", async () => {
		const response = await crud.api.generateOpenAPISchema({});
		const schema = await response.json();

		// Check that resource schemas are included
		expect(schema.components.schemas.User).toBeDefined();
		expect(schema.components.schemas.Product).toBeDefined();
		expect(schema.components.schemas.UserInput).toBeDefined();
		expect(schema.components.schemas.ProductInput).toBeDefined();
	});

	it("should include CRUD endpoints in OpenAPI spec", async () => {
		const response = await crud.api.generateOpenAPISchema({});
		const schema = await response.json();

		// Check that CRUD endpoints are included
		expect(schema.paths["/user"]).toBeDefined();
		expect(schema.paths["/user"].get).toBeDefined(); // LIST
		expect(schema.paths["/user"].post).toBeDefined(); // CREATE
		expect(schema.paths["/user/{id}"]).toBeDefined();
		expect(schema.paths["/user/{id}"].get).toBeDefined(); // READ
		expect(schema.paths["/user/{id}"].put).toBeDefined(); // UPDATE
		expect(schema.paths["/user/{id}"].delete).toBeDefined(); // DELETE
	});

	it("should generate HTML reference page", async () => {
		const response = await crud.api.openAPIReference({});
		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toBe("text/html");
		
		const html = await response.text();
		expect(html).toContain("<!doctype html>");
		expect(html).toContain("Better CRUD API Reference");
		expect(html).toContain("@scalar/api-reference");
	});

	it("should support custom path for reference", () => {
		const customCrud = betterCrud({
			database: {
				provider: "sqlite" as const,
				url: ":memory:",
			},
			resources: [
				{
					name: "user",
					schema: z.object({ name: z.string() }),
				},
			],
			plugins: [openApiPlugin({ path: "/docs" })],
		});

		expect(customCrud.api.openAPIReference).toBeDefined();
	});

	it("should support disabling reference page", async () => {
		const customCrud = betterCrud({
			database: {
				provider: "sqlite" as const,
				url: ":memory:",
			},
			resources: [
				{
					name: "user",
					schema: z.object({ name: z.string() }),
				},
			],
			plugins: [openApiPlugin({ disableDefaultReference: true })],
		});

		const response = await customCrud.api.openAPIReference({});
		expect(response.status).toBe(404);
	});

	it("should support custom theme", () => {
		const customCrud = betterCrud({
			database: {
				provider: "sqlite" as const,
				url: ":memory:",
			},
			resources: [
				{
					name: "user",
					schema: z.object({ name: z.string() }),
				},
			],
			plugins: [openApiPlugin({ theme: "purple" })],
		});

		expect(customCrud.api.openAPIReference).toBeDefined();
	});

	it("should include plugin endpoints in schema", async () => {
		const response = await crud.api.generateOpenAPISchema({});
		const schema = await response.json();

		// Should include the OpenAPI plugin endpoints
		expect(schema.paths["/openapi/schema"]).toBeDefined();
		expect(schema.paths["/openapi/schema"].get).toBeDefined();
	});

	it("should validate schema structure", async () => {
		const response = await crud.api.generateOpenAPISchema({});
		const schema = await response.json();

		// Basic OpenAPI structure validation
		expect(schema).toHaveProperty("openapi");
		expect(schema).toHaveProperty("info");
		expect(schema).toHaveProperty("paths");
		expect(schema).toHaveProperty("components");
		expect(schema).toHaveProperty("servers");
		expect(schema).toHaveProperty("tags");

		// Check that all required response codes are included
		const userPaths = schema.paths["/user"];
		expect(userPaths.get.responses).toHaveProperty("200");
		expect(userPaths.get.responses).toHaveProperty("400");
		expect(userPaths.get.responses).toHaveProperty("500");

		// Check that request/response schemas reference the correct components
		expect(userPaths.post.requestBody.content["application/json"].schema.$ref).toBe("#/components/schemas/UserInput");
		expect(userPaths.post.responses["201"].content["application/json"].schema.$ref).toBe("#/components/schemas/User");
	});
});