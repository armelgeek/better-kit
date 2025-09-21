import { describe, expect, test } from "vitest";
import { betterAuth } from "../../auth";
import { createAuthClientWithCrud } from "../../client";
import { createResource, crud, productSchema, categorySchema } from "./index";

describe("CRUD Client Integration", () => {
	test("should create complete auth client with CRUD functionality", () => {
		// Setup auth with CRUD plugin
		const auth = betterAuth({
			database: {
				provider: "sqlite",
				url: ":memory:",
			},
			secret: "test-secret",
			emailAndPassword: {
				enabled: true,
			},
			plugins: [
				crud({
					resources: [
						createResource({
							name: "product",
							schema: productSchema,
							permissions: {
								create: async (user) => !!user,
								read: async () => true,
								update: async (user) => !!user,
								delete: async (user) => !!user,
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

		// Create client with CRUD support
		const client = createAuthClientWithCrud(auth, {
			baseURL: "http://localhost:3000/api/auth",
		});

		// Verify auth functionality exists
		expect(client.$session).toBeDefined();
		expect(client.signInCredential).toBeDefined();

		// Verify CRUD functionality exists for product resource
		expect(client.product).toBeDefined();
		expect(client.product.create).toBeDefined();
		expect(client.product.read).toBeDefined();
		expect(client.product.update).toBeDefined();
		expect(client.product.delete).toBeDefined();
		expect(client.product.list).toBeDefined();

		// Verify CRUD functionality exists for category resource
		expect(client.category).toBeDefined();
		expect(client.category.create).toBeDefined();
		expect(client.category.read).toBeDefined();
		expect(client.category.update).toBeDefined();
		expect(client.category.delete).toBeDefined();
		expect(client.category.list).toBeDefined();

		// Verify methods are callable (they will fail at runtime without a server, but should be functions)
		expect(typeof client.product.create).toBe("function");
		expect(typeof client.product.read).toBe("function");
		expect(typeof client.product.update).toBe("function");
		expect(typeof client.product.delete).toBe("function");
		expect(typeof client.product.list).toBe("function");
	});

	test("should work with auth instance without CRUD plugin", () => {
		// Setup auth without CRUD plugin
		const auth = betterAuth({
			database: {
				provider: "sqlite",
				url: ":memory:",
			},
			secret: "test-secret",
			emailAndPassword: {
				enabled: true,
			},
		});

		// Create client - should fallback to normal auth client
		const client = createAuthClientWithCrud(auth, {
			baseURL: "http://localhost:3000/api/auth",
		});

		// Verify auth functionality exists
		expect(client.$session).toBeDefined();
		expect(client.signInCredential).toBeDefined();

		// Verify CRUD functionality doesn't exist
		expect((client as any).product).toBeUndefined();
		expect((client as any).category).toBeUndefined();
	});

	test("should handle endpoints configuration", () => {
		// Setup auth with CRUD plugin with custom endpoints config
		const auth = betterAuth({
			database: {
				provider: "sqlite",
				url: ":memory:",
			},
			secret: "test-secret",
			plugins: [
				crud({
					resources: [
						createResource({
							name: "product",
							schema: productSchema,
							endpoints: {
								create: true,
								read: true,
								update: false,
								delete: false,
								list: true,
							},
						}),
					],
				}),
			],
		});

		const client = createAuthClientWithCrud(auth, {
			baseURL: "http://localhost:3000/api/auth",
		});

		// All methods should still be available on the client
		// (endpoint filtering happens at the server level)
		expect(client.product.create).toBeDefined();
		expect(client.product.read).toBeDefined();
		expect(client.product.update).toBeDefined();
		expect(client.product.delete).toBeDefined();
		expect(client.product.list).toBeDefined();
	});
});