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

	it("should register OpenAPI plugin correctly", () => {
		expect(crud.context.pluginManager.getPlugin("openapi")).toBeDefined();
	});

	it("should add OpenAPI endpoints to the CRUD instance", () => {
		expect(crud.api.generateOpenAPISchema).toBeDefined();
		expect(crud.api.openAPIReference).toBeDefined();
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
		expect(customCrud.context.pluginManager.getPlugin("openapi")).toBeDefined();
	});

	it("should support custom theme configuration", () => {
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
		expect(customCrud.context.pluginManager.getPlugin("openapi")).toBeDefined();
	});

	it("should support disableDefaultReference option", () => {
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

		expect(customCrud.api.openAPIReference).toBeDefined();
		expect(customCrud.context.pluginManager.getPlugin("openapi")).toBeDefined();
	});

	it("should handle empty plugin options", () => {
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
			plugins: [openApiPlugin()],
		});

		expect(customCrud.api.generateOpenAPISchema).toBeDefined();
		expect(customCrud.api.openAPIReference).toBeDefined();
		expect(customCrud.context.pluginManager.getPlugin("openapi")).toBeDefined();
	});
});