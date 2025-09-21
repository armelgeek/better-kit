import { describe, it, expect, beforeEach } from "vitest";
import { z } from "zod";
import { betterCrud, auditPlugin, validationPlugin, cachePlugin, createPlugin } from "../src/index";

describe("Plugin System", () => {
	let crudInstance: any;

	beforeEach(() => {
		// Reset for each test
	});

	it("should register and initialize plugins", async () => {
		const testPlugin = createPlugin({
			id: "test-plugin",
			endpoints: {},
			init: async (context) => {
				expect(context.adapter).toBeDefined();
				expect(context.resources).toBeDefined();
			},
		});

		crudInstance = betterCrud({
			database: {
				provider: "sqlite",
				url: ":memory:",
			},
			resources: [
				{
					name: "user",
					schema: z.object({
						id: z.string(),
						name: z.string(),
						email: z.string(),
					}),
				},
			],
			plugins: [testPlugin],
		});

		expect(crudInstance.context.pluginManager).toBeDefined();
		expect(crudInstance.context.pluginManager.getPlugin("test-plugin")).toBeDefined();
	});

	it("should merge plugin endpoints with CRUD endpoints", () => {
		const pluginWithEndpoints = createPlugin({
			id: "endpoint-plugin",
			endpoints: {
				testEndpoint: {
					path: "/test",
					method: "GET",
					handler: async (ctx: any) => ctx.json({ message: "test" }),
					options: {},
				},
			},
		});

		crudInstance = betterCrud({
			database: {
				provider: "sqlite",
				url: ":memory:",
			},
			resources: [
				{
					name: "user",
					schema: z.object({
						id: z.string(),
						name: z.string(),
					}),
				},
			],
			plugins: [pluginWithEndpoints],
		});

		// Check that plugin endpoints are merged
		expect(crudInstance.api.testEndpoint).toBeDefined();
	});

	it("should support audit plugin", () => {
		const audit = auditPlugin({
			enabled: true,
			operations: ["create", "update", "delete"],
		});

		crudInstance = betterCrud({
			database: {
				provider: "sqlite",
				url: ":memory:",
			},
			resources: [
				{
					name: "user",
					schema: z.object({
						id: z.string(),
						name: z.string(),
					}),
				},
			],
			plugins: [audit],
		});

		expect(crudInstance.context.pluginManager.getPlugin("audit")).toBeDefined();
		expect(crudInstance.api.getAuditLogs).toBeDefined();
	});

	it("should support validation plugin", () => {
		const validation = validationPlugin({
			strict: true,
			globalRules: {
				trimStrings: true,
				validateEmails: true,
			},
		});

		crudInstance = betterCrud({
			database: {
				provider: "sqlite",
				url: ":memory:",
			},
			resources: [
				{
					name: "user",
					schema: z.object({
						id: z.string(),
						name: z.string(),
						email: z.string(),
					}),
				},
			],
			plugins: [validation],
		});

		expect(crudInstance.context.pluginManager.getPlugin("validation")).toBeDefined();
	});

	it("should support cache plugin", () => {
		const cache = cachePlugin({
			enabled: true,
			defaultTTL: 300,
		});

		crudInstance = betterCrud({
			database: {
				provider: "sqlite",
				url: ":memory:",
			},
			resources: [
				{
					name: "user",
					schema: z.object({
						id: z.string(),
						name: z.string(),
					}),
				},
			],
			plugins: [cache],
		});

		expect(crudInstance.context.pluginManager.getPlugin("cache")).toBeDefined();
		expect(crudInstance.api.getCacheStats).toBeDefined();
		expect(crudInstance.api.clearCache).toBeDefined();
	});

	it("should support multiple plugins together", () => {
		const plugins = [
			auditPlugin({ enabled: true }),
			validationPlugin({ strict: true }),
			cachePlugin({ enabled: true }),
		];

		crudInstance = betterCrud({
			database: {
				provider: "sqlite",
				url: ":memory:",
			},
			resources: [
				{
					name: "user",
					schema: z.object({
						id: z.string(),
						name: z.string(),
					}),
				},
			],
			plugins,
		});

		expect(crudInstance.context.pluginManager.getPlugins()).toHaveLength(3);
		expect(crudInstance.context.pluginManager.getPlugin("audit")).toBeDefined();
		expect(crudInstance.context.pluginManager.getPlugin("validation")).toBeDefined();
		expect(crudInstance.context.pluginManager.getPlugin("cache")).toBeDefined();
	});

	it("should allow plugins to add resources", () => {
		const resourcePlugin = createPlugin({
			id: "resource-plugin",
			resources: [
				{
					name: "log",
					schema: z.object({
						id: z.string(),
						message: z.string(),
						level: z.enum(["info", "warn", "error"]),
					}),
				},
			],
		});

		crudInstance = betterCrud({
			database: {
				provider: "sqlite",
				url: ":memory:",
			},
			resources: [
				{
					name: "user",
					schema: z.object({
						id: z.string(),
						name: z.string(),
					}),
				},
			],
			plugins: [resourcePlugin],
		});

		// Plugin resources should create endpoints
		expect(crudInstance.api.createLog).toBeDefined();
		expect(crudInstance.api.getLog).toBeDefined();
		expect(crudInstance.api.updateLog).toBeDefined();
		expect(crudInstance.api.deleteLog).toBeDefined();
		expect(crudInstance.api.listLogs).toBeDefined();
	});
});