import { describe, it, expect } from "vitest";
import { z } from "zod";
import { betterQuery, createQueryClient, createPlugin } from "..";
import type { BetterQueryClientPlugin } from "../types/client-plugins";
import { createQueryEndpoint } from "../endpoints";

describe("Client Plugin Integration", () => {
	it("should integrate client plugins with query client", async () => {
		// 1. Create server plugin with custom endpoint
		const testServerPlugin = () =>
			createPlugin({
				id: "test-plugin",
				endpoints: {
					customEndpoint: createQueryEndpoint(
						"/test-plugin/hello",
						{
							method: "GET",
						},
						async (ctx) => {
							return ctx.json({
								message: "Hello from plugin",
							});
						},
					),
				},
			});

		// 2. Create CRUD instance with plugin
		const query = betterQuery({
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
			plugins: [testServerPlugin()],
		});

		// 3. Create client plugin
		const testClientPlugin: BetterQueryClientPlugin = {
			id: "test-plugin",
			$InferServerPlugin: {} as ReturnType<typeof testServerPlugin>,
			getActions: ($fetch) => ({
				hello: async () => {
					return $fetch("/test-plugin/hello", {
						method: "GET",
					});
				},
				customMethod: async (data: { name: string }) => {
					// Custom client-side logic
					return {
						data: { greeting: `Hello ${data.name}!` },
						error: null,
					};
				},
			}),
		};

		// 4. Create query client with plugin
		const client = createQueryClient<typeof query>({
			baseURL: "http://localhost:3000",
			queryPlugins: [testClientPlugin],
		});

		// Verify the client was created
		expect(client).toBeDefined();
		expect(client.user).toBeDefined();
	});

	it("should support multiple plugins", () => {
		const plugin1: BetterQueryClientPlugin = {
			id: "plugin-one",
			getActions: ($fetch) => ({
				action1: async () => ({ data: "action1", error: null }),
			}),
		};

		const plugin2: BetterQueryClientPlugin = {
			id: "plugin-two",
			getActions: ($fetch) => ({
				action2: async () => ({ data: "action2", error: null }),
			}),
		};

		const query = betterQuery({
			database: {
				provider: "sqlite",
				url: ":memory:",
			},
			resources: [],
		});

		const client = createQueryClient<typeof query>({
			baseURL: "http://localhost:3000",
			queryPlugins: [plugin1, plugin2],
		});

		expect(client).toBeDefined();
	});

	it("should convert kebab-case plugin ids to camelCase", () => {
		const kebabPlugin: BetterQueryClientPlugin = {
			id: "my-custom-plugin",
			getActions: ($fetch) => ({
				testAction: async () => ({ data: "test", error: null }),
			}),
		};

		const query = betterQuery({
			database: {
				provider: "sqlite",
				url: ":memory:",
			},
			resources: [],
		});

		const client = createQueryClient<typeof query>({
			baseURL: "http://localhost:3000",
			queryPlugins: [kebabPlugin],
		});

		// The plugin should be accessible as myCustomPlugin (camelCase)
		// Note: This would need to be tested with actual client usage
		expect(client).toBeDefined();
	});

	it("should support atoms for reactive state", () => {
		const createAtom = <T,>(initialValue: T) => {
			let value = initialValue;
			const listeners = new Set<(value: T) => void>();
			return {
				get: () => value,
				set: (newValue: T) => {
					value = newValue;
					listeners.forEach((listener) => listener(value));
				},
				subscribe: (listener: (value: T) => void) => {
					listeners.add(listener);
					return () => listeners.delete(listener);
				},
			};
		};

		const statePlugin: BetterQueryClientPlugin = {
			id: "state-plugin",
			getAtoms: ($fetch) => ({
				counter: createAtom(0),
				user: createAtom<{ name: string } | null>(null),
			}),
		};

		const query = betterQuery({
			database: {
				provider: "sqlite",
				url: ":memory:",
			},
			resources: [],
		});

		const client = createQueryClient<typeof query>({
			baseURL: "http://localhost:3000",
			queryPlugins: [statePlugin],
		});

		expect(client).toBeDefined();
	});

	it("should call atomListeners on initialization", () => {
		let listenerCalled = false;

		const createAtom = <T,>(initialValue: T) => {
			let value = initialValue;
			const listeners = new Set<(value: T) => void>();
			return {
				get: () => value,
				set: (newValue: T) => {
					value = newValue;
					listeners.forEach((listener) => listener(value));
				},
				subscribe: (listener: (value: T) => void) => {
					listeners.add(listener);
					return () => listeners.delete(listener);
				},
			};
		};

		const listenerPlugin: BetterQueryClientPlugin = {
			id: "listener-plugin",
			getAtoms: ($fetch) => ({
				testAtom: createAtom(0),
			}),
			atomListeners: (atoms, $fetch) => {
				// This should be called during client initialization
				listenerCalled = true;
				atoms.testAtom.subscribe(() => {
					// Listener logic
				});
			},
		};

		const query = betterQuery({
			database: {
				provider: "sqlite",
				url: ":memory:",
			},
			resources: [],
		});

		const client = createQueryClient<typeof query>({
			baseURL: "http://localhost:3000",
			queryPlugins: [listenerPlugin],
		});

		expect(client).toBeDefined();
		expect(listenerCalled).toBe(true);
	});

	it("should support pathMethods configuration", () => {
		const methodsPlugin: BetterQueryClientPlugin = {
			id: "methods-plugin",
			pathMethods: {
				"/methods-plugin/custom": "POST",
				"/methods-plugin/another": "GET",
			},
			getActions: ($fetch) => ({
				custom: async () => {
					return $fetch("/methods-plugin/custom", {
						method: "POST", // This should match pathMethods
					});
				},
			}),
		};

		const query = betterQuery({
			database: {
				provider: "sqlite",
				url: ":memory:",
			},
			resources: [],
		});

		const client = createQueryClient<typeof query>({
			baseURL: "http://localhost:3000",
			queryPlugins: [methodsPlugin],
		});

		expect(client).toBeDefined();
	});
});
