import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createCrudClient } from "../index";

// Mock better-call/client
vi.mock("better-call/client", () => ({
	createClient: vi.fn(() => {
		return vi.fn((endpoint: string, options?: any) => {
			return Promise.resolve({
				data: { id: "test-id", name: "test-product" },
				error: null,
				status: 200,
			});
		});
	}),
}));

// Mock environment
vi.stubEnv("NODE_ENV", "test");

describe("CRUD Client Plugins Integration", () => {
	it("should create client with plugins parameter", () => {
		const client = createCrudClient({
			baseURL: "http://localhost:3000/api",
			plugins: [
				{
					id: "test-plugin",
					name: "Test Plugin",
					hooks: {
						onRequest: (context) => context,
					},
				},
			],
		});

		expect(client).toBeDefined();
		expect(typeof client).toBe("object");
	});

	it("should create client without plugins", () => {
		const client = createCrudClient({
			baseURL: "http://localhost:3000/api",
		});

		expect(client).toBeDefined();
		expect(typeof client).toBe("object");
	});

	it("should provide CRUD methods", async () => {
		const client = createCrudClient({
			baseURL: "http://localhost:3000/api",
			plugins: [],
		});

		// Test product methods exist
		expect(typeof client.product.create).toBe("function");
		expect(typeof client.product.read).toBe("function");
		expect(typeof client.product.update).toBe("function");
		expect(typeof client.product.delete).toBe("function");
		expect(typeof client.product.list).toBe("function");
	});

	it("should support mixed plugin types", () => {
		const client = createCrudClient({
			baseURL: "http://localhost:3000/api",
			plugins: [
				// Standard BetterFetchPlugin
				{
					id: "fetch-plugin",
					name: "Fetch Plugin",
					hooks: {
						onRequest: (context) => context,
					},
				},
				// CRUD-specific plugin with crudOptions
				{
					id: "crud-plugin",
					name: "CRUD Plugin",
					hooks: {
						onSuccess: (context) => console.log("Success"),
					},
					crudOptions: {
						enabled: true,
						resources: ["product"],
						operations: ["create", "update"],
					},
				},
			],
		});

		expect(client).toBeDefined();
		expect(typeof client.product.create).toBe("function");
	});

	it("should have error codes available", () => {
		const client = createCrudClient({
			baseURL: "http://localhost:3000/api",
		});

		expect(client.$ERROR_CODES).toBeDefined();
		expect(client.$ERROR_CODES.VALIDATION_FAILED).toBe("VALIDATION_FAILED");
		expect(client.$ERROR_CODES.NOT_FOUND).toBe("NOT_FOUND");
	});
});