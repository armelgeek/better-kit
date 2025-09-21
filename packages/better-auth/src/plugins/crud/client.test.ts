import { describe, expect, test } from "vitest";
import { extractCrudPlugin } from "./client";
import { createResource, crud, productSchema } from "./index";

describe("CRUD Client", () => {
	test("should extract CRUD plugin configuration", () => {
		const crudPlugin = crud({
			resources: [
				createResource({
					name: "product",
					schema: productSchema,
				}),
			],
		});

		// Mock auth instance with plugin
		const mockAuth = {
			options: {
				plugins: [crudPlugin],
			},
		};

		const extractedPlugin = extractCrudPlugin(mockAuth);
		
		expect(extractedPlugin).toBeDefined();
		expect(extractedPlugin.resources).toBeDefined();
		expect(extractedPlugin.resources.length).toBe(1);
		expect(extractedPlugin.resources[0].name).toBe("product");
	});

	test("should return null when no CRUD plugin is present", () => {
		const mockAuth = {
			options: {
				plugins: [],
			},
		};

		const extractedPlugin = extractCrudPlugin(mockAuth);
		
		expect(extractedPlugin).toBeNull();
	});

	test("should return null when auth has no plugins", () => {
		const mockAuth = {
			options: {},
		};

		const extractedPlugin = extractCrudPlugin(mockAuth);
		
		expect(extractedPlugin).toBeNull();
	});
});