import { beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";
import {
	adiemus,
	auditPlugin,
	cachePlugin,
	createPlugin,
	uploadPlugin,
	validationPlugin,
} from "../index";

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

		crudInstance = adiemus({
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
		expect(
			crudInstance.context.pluginManager.getPlugin("test-plugin"),
		).toBeDefined();
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

		crudInstance = adiemus({
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

		crudInstance = adiemus({
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

		crudInstance = adiemus({
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

		expect(
			crudInstance.context.pluginManager.getPlugin("validation"),
		).toBeDefined();
	});

	it("should support cache plugin", () => {
		const cache = cachePlugin({
			enabled: true,
			defaultTTL: 300,
		});

		crudInstance = adiemus({
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

	it("should support upload plugin", () => {
		const upload = uploadPlugin({
			enabled: true,
			uploadDir: "./test-uploads",
		});

		crudInstance = adiemus({
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
			plugins: [upload],
		});

		expect(
			crudInstance.context.pluginManager.getPlugin("upload"),
		).toBeDefined();
		expect(crudInstance.api.uploadFile).toBeDefined();
		expect(crudInstance.api.getFile).toBeDefined();
		expect(crudInstance.api.downloadFile).toBeDefined();
		expect(crudInstance.api.deleteFile).toBeDefined();
		expect(crudInstance.api.listFiles).toBeDefined();
	});

	it("should support multiple plugins together", () => {
		const plugins = [
			auditPlugin({ enabled: true }),
			validationPlugin({ strict: true }),
			cachePlugin({ enabled: true }),
			uploadPlugin({ enabled: true, uploadDir: "./test-uploads" }),
		];

		crudInstance = adiemus({
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

		expect(crudInstance.context.pluginManager.getPlugins()).toHaveLength(4);
		expect(crudInstance.context.pluginManager.getPlugin("audit")).toBeDefined();
		expect(
			crudInstance.context.pluginManager.getPlugin("validation"),
		).toBeDefined();
		expect(crudInstance.context.pluginManager.getPlugin("cache")).toBeDefined();
		expect(
			crudInstance.context.pluginManager.getPlugin("upload"),
		).toBeDefined();
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

		crudInstance = adiemus({
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
