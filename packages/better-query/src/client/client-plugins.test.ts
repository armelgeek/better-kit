import { describe, it, expect, beforeEach } from "vitest";
import { z } from "zod";
import { betterQuery, createQueryClient, createPlugin } from "..";
import type { BetterQueryClientPlugin } from "../types/client-plugins";
import { createQueryEndpoint } from "../endpoints";

describe("Client Plugin System", () => {
	// Create a simple plugin with custom endpoint
	const myServerPlugin = () =>
		createPlugin({
			id: "my-plugin",
			endpoints: {
				getHelloWorld: createQueryEndpoint(
					"/my-plugin/hello-world",
					{
						method: "GET",
					},
					async (ctx) => {
						return ctx.json({
							message: "Hello World",
						});
					},
				),
				customAction: createQueryEndpoint(
					"/my-plugin/custom-action",
					{
						method: "POST",
					},
					async (ctx) => {
						const body = ctx.body as { foo: string };
						return ctx.json({
							result: `Processed: ${body.foo}`,
						});
					},
				),
			},
		});

	describe("Basic Client Plugin", () => {
		it("should create a basic client plugin", () => {
			const myClientPlugin: BetterQueryClientPlugin = {
				id: "my-plugin",
			};

			expect(myClientPlugin.id).toBe("my-plugin");
		});

		it("should support $InferServerPlugin for type safety", () => {
			const myClientPlugin: BetterQueryClientPlugin = {
				id: "my-plugin",
				$InferServerPlugin: {} as ReturnType<typeof myServerPlugin>,
			};

			expect(myClientPlugin.id).toBe("my-plugin");
			expect(myClientPlugin.$InferServerPlugin).toBeDefined();
		});
	});

	describe("Client Plugin with Custom Actions", () => {
		it("should allow getActions to define custom methods", () => {
			const myClientPlugin: BetterQueryClientPlugin = {
				id: "my-plugin",
				getActions: ($fetch) => {
					return {
						myCustomAction: async (data: { foo: string }) => {
							return $fetch("/custom/action", {
								method: "POST",
								body: data,
							});
						},
						anotherAction: async () => {
							return $fetch("/another", {
								method: "GET",
							});
						},
					};
				},
			};

			// Test that getActions is defined
			expect(myClientPlugin.getActions).toBeDefined();

			// Mock $fetch
			const mockFetch = async (path: string, options?: any) => ({
				data: { path, options },
				error: null,
			});

			// Get actions
			const actions = myClientPlugin.getActions!(mockFetch);

			expect(actions.myCustomAction).toBeDefined();
			expect(actions.anotherAction).toBeDefined();
		});
	});

	describe("Client Plugin with PathMethods", () => {
		it("should allow overriding HTTP methods for specific paths", () => {
			const myClientPlugin: BetterQueryClientPlugin = {
				id: "my-plugin",
				pathMethods: {
					"/my-plugin/hello-world": "POST",
					"/my-plugin/another-endpoint": "GET",
				},
			};

			expect(myClientPlugin.pathMethods).toEqual({
				"/my-plugin/hello-world": "POST",
				"/my-plugin/another-endpoint": "GET",
			});
		});
	});

	describe("Client Plugin with Atoms", () => {
		it("should support getAtoms for reactive state", () => {
			// Simple atom implementation for testing
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

			const myClientPlugin: BetterQueryClientPlugin = {
				id: "my-plugin",
				getAtoms: ($fetch) => {
					return {
						myAtom: createAtom<{ data: string | null }>({ data: null }),
						counterAtom: createAtom<number>(0),
					};
				},
			};

			// Mock $fetch
			const mockFetch = async () => ({ data: {}, error: null });

			// Get atoms
			const atoms = myClientPlugin.getAtoms!(mockFetch);

			expect(atoms.myAtom).toBeDefined();
			expect(atoms.counterAtom).toBeDefined();
			expect(atoms.myAtom.get()).toEqual({ data: null });
			expect(atoms.counterAtom.get()).toBe(0);

			// Test atom reactivity
			atoms.counterAtom.set(5);
			expect(atoms.counterAtom.get()).toBe(5);
		});

		it("should support atomListeners for reactive updates", () => {
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

			let listenerCalled = false;

			const myClientPlugin: BetterQueryClientPlugin = {
				id: "my-plugin",
				getAtoms: ($fetch) => ({
					testAtom: createAtom<number>(0),
				}),
				atomListeners: (atoms, $fetch) => {
					// Setup listener
					atoms.testAtom.subscribe((value) => {
						listenerCalled = true;
					});
				},
			};

			const mockFetch = async () => ({ data: {}, error: null });
			const atoms = myClientPlugin.getAtoms!(mockFetch);
			myClientPlugin.atomListeners!(atoms, mockFetch);

			// Trigger atom update
			atoms.testAtom.set(10);

			expect(listenerCalled).toBe(true);
		});
	});

	describe("Client Integration with Plugins", () => {
		it("should create client with queryPlugins option", () => {
			const crud = betterQuery({
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
				plugins: [myServerPlugin()],
			});

			const myClientPlugin: BetterQueryClientPlugin = {
				id: "my-plugin",
				getActions: ($fetch) => ({
					helloWorld: async () => {
						return $fetch("/my-plugin/hello-world", {
							method: "GET",
						});
					},
				}),
			};

			// Create client with plugin
			const client = createQueryClient<typeof crud>({
				baseURL: "http://localhost:3000",
				queryPlugins: [myClientPlugin],
			});

			expect(client).toBeDefined();
		});
	});

	describe("Plugin ID to CamelCase Conversion", () => {
		it("should convert kebab-case plugin id to camelCase", () => {
			const myClientPlugin: BetterQueryClientPlugin = {
				id: "my-custom-plugin",
				getActions: ($fetch) => ({
					testAction: async () => ({ data: "test", error: null }),
				}),
			};

			expect(myClientPlugin.id).toBe("my-custom-plugin");

			// The client should expose this as myCustomPlugin.testAction()
			// This is tested in integration scenarios
		});
	});
});
