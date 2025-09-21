import { describe, expect, it, vi, beforeEach } from "vitest";
import { z } from "zod";
import { createCrudClient } from "../index";
import { auditClientPlugin } from "../plugins/audit";
import { cacheClientPlugin } from "../plugins/cache";
import { validationClientPlugin } from "../plugins/validation";

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

const productSchema = z.object({
	id: z.string().optional(),
	name: z.string(),
	price: z.number().optional(),
	description: z.string().optional(),
});

describe("CRUD Client Plugins", () => {
	describe("Audit Plugin", () => {
		it("should create audit plugin with default options", () => {
			const auditPlugin = auditClientPlugin();
			
			expect(auditPlugin.id).toBe("crud-audit-client");
			expect(auditPlugin.name).toBe("CRUD Audit Client");
			expect(auditPlugin.hooks).toBeDefined();
		});

		it("should create disabled audit plugin", () => {
			const auditPlugin = auditClientPlugin({ enabled: false });
			
			expect(auditPlugin.id).toBe("crud-audit-client");
			expect(auditPlugin.hooks).toBeUndefined();
		});

		it("should log operations when enabled", () => {
			const mockOnLog = vi.fn();
			const auditPlugin = auditClientPlugin({ 
				enabled: true,
				onLog: mockOnLog,
				logToConsole: false 
			});

			expect(auditPlugin.hooks?.onRequest).toBeDefined();
			expect(auditPlugin.hooks?.onSuccess).toBeDefined();
			expect(auditPlugin.hooks?.onError).toBeDefined();
		});
	});

	describe("Cache Plugin", () => {
		it("should create cache plugin with default options", () => {
			const cachePlugin = cacheClientPlugin();
			
			expect(cachePlugin.id).toBe("crud-cache-client");
			expect(cachePlugin.name).toBe("CRUD Cache Client");
			expect(cachePlugin.hooks).toBeDefined();
		});

		it("should create disabled cache plugin", () => {
			const cachePlugin = cacheClientPlugin({ enabled: false });
			
			expect(cachePlugin.id).toBe("crud-cache-client");
			expect(cachePlugin.hooks).toBeUndefined();
		});

		it("should provide cache management methods", () => {
			const cachePlugin = cacheClientPlugin({ enabled: true });
			
			expect(typeof (cachePlugin as any).getCache).toBe("function");
			expect(typeof (cachePlugin as any).clearCache).toBe("function");
			expect(typeof (cachePlugin as any).getCacheStats).toBe("function");
			expect(typeof (cachePlugin as any).invalidateResource).toBe("function");
		});
	});

	describe("Validation Plugin", () => {
		it("should create validation plugin with default options", () => {
			const validationPlugin = validationClientPlugin();
			
			expect(validationPlugin.id).toBe("crud-validation-client");
			expect(validationPlugin.name).toBe("CRUD Validation Client");
			expect(validationPlugin.hooks).toBeDefined();
		});

		it("should create disabled validation plugin", () => {
			const validationPlugin = validationClientPlugin({ enabled: false });
			
			expect(validationPlugin.id).toBe("crud-validation-client");
			expect(validationPlugin.hooks).toBeUndefined();
		});

		it("should validate data with schemas", () => {
			const validationPlugin = validationClientPlugin({
				enabled: true,
				schemas: {
					product: {
						create: productSchema,
						update: productSchema.partial(),
					}
				}
			});

			expect(validationPlugin.hooks?.onRequest).toBeDefined();
		});
	});

	describe("Client Integration", () => {
		it("should create client with plugins", () => {
			const client = createCrudClient({
				baseURL: "http://localhost:3000/api",
				plugins: [
					auditClientPlugin({ enabled: true }),
					cacheClientPlugin({ enabled: true }),
					validationClientPlugin({ enabled: true }),
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

		it("should provide CRUD methods with plugins", async () => {
			const client = createCrudClient({
				baseURL: "http://localhost:3000/api",
				plugins: [
					auditClientPlugin({ enabled: true, logToConsole: false }),
				],
			});

			// Test product methods
			expect(typeof client.product.create).toBe("function");
			expect(typeof client.product.read).toBe("function");
			expect(typeof client.product.update).toBe("function");
			expect(typeof client.product.delete).toBe("function");
			expect(typeof client.product.list).toBe("function");
		});

		it("should pass options to plugins correctly", () => {
			const mockOnLog = vi.fn();
			
			const client = createCrudClient({
				baseURL: "http://localhost:3000/api",
				plugins: [
					auditClientPlugin({ 
						enabled: true,
						onLog: mockOnLog,
						operations: ["create", "update"],
						resources: ["product"],
					}),
					cacheClientPlugin({
						enabled: true,
						defaultTTL: 600,
						maxSize: 500,
					}),
					validationClientPlugin({
						enabled: true,
						strict: true,
						globalRules: {
							trimStrings: true,
							validateEmails: true,
						},
					}),
				],
			});

			expect(client).toBeDefined();
		});
	});

	describe("Plugin Configuration", () => {
		it("should handle multiple plugins of same type", () => {
			const client = createCrudClient({
				baseURL: "http://localhost:3000/api",
				plugins: [
					auditClientPlugin({ enabled: true, resources: ["product"] }),
					auditClientPlugin({ enabled: true, resources: ["category"] }),
				],
			});

			expect(client).toBeDefined();
		});

		it("should handle mixed plugin types", () => {
			const client = createCrudClient({
				baseURL: "http://localhost:3000/api",
				plugins: [
					// BetterFetchPlugin
					{
						id: "custom-plugin",
						name: "Custom Plugin",
						hooks: {
							onRequest: (context) => context,
						},
					},
					// CrudClientPlugin
					auditClientPlugin({ enabled: true }),
				],
			});

			expect(client).toBeDefined();
		});
	});
});