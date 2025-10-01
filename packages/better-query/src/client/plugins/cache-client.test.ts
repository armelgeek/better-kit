import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryCacheStorage, cacheClientPlugin } from "./cache-client";

describe("Client-Side Cache Plugin", () => {
	describe("MemoryCacheStorage", () => {
		let storage: MemoryCacheStorage;

		beforeEach(() => {
			storage = new MemoryCacheStorage();
		});

		it("should store and retrieve cache entries", async () => {
			const key = "test-key";
			const data = { id: "1", name: "Test" };

			await storage.set(key, {
				data,
				timestamp: Date.now(),
				expiresAt: Date.now() + 1000,
			});

			const entry = await storage.get(key);
			expect(entry).toBeDefined();
			expect(entry?.data).toEqual(data);
		});

		it("should return null for expired entries", async () => {
			const key = "test-key";
			const data = { id: "1", name: "Test" };

			await storage.set(key, {
				data,
				timestamp: Date.now(),
				expiresAt: Date.now() - 1000, // Already expired
			});

			const entry = await storage.get(key);
			expect(entry).toBeNull();
		});

		it("should delete cache entries", async () => {
			const key = "test-key";
			const data = { id: "1", name: "Test" };

			await storage.set(key, {
				data,
				timestamp: Date.now(),
				expiresAt: Date.now() + 1000,
			});

			await storage.delete(key);

			const entry = await storage.get(key);
			expect(entry).toBeNull();
		});

		it("should clear all cache entries", async () => {
			await storage.set("key1", {
				data: "value1",
				timestamp: Date.now(),
				expiresAt: Date.now() + 1000,
			});
			await storage.set("key2", {
				data: "value2",
				timestamp: Date.now(),
				expiresAt: Date.now() + 1000,
			});

			await storage.clear();

			const entry1 = await storage.get("key1");
			const entry2 = await storage.get("key2");
			expect(entry1).toBeNull();
			expect(entry2).toBeNull();
		});

		it("should return all keys", async () => {
			await storage.set("key1", {
				data: "value1",
				timestamp: Date.now(),
				expiresAt: Date.now() + 1000,
			});
			await storage.set("key2", {
				data: "value2",
				timestamp: Date.now(),
				expiresAt: Date.now() + 1000,
			});

			const keys = await storage.keys();
			expect(keys).toHaveLength(2);
			expect(keys).toContain("key1");
			expect(keys).toContain("key2");
		});

		it("should get cache statistics", () => {
			const stats = storage.getStats();
			expect(stats).toHaveProperty("size");
			expect(stats).toHaveProperty("keys");
			expect(Array.isArray(stats.keys)).toBe(true);
		});
	});

	describe("cacheClientPlugin", () => {
		it("should create a plugin with default options", () => {
			const plugin = cacheClientPlugin();
			expect(plugin.id).toBe("cache-client");
			expect(plugin.getActions).toBeDefined();
		});

		it("should return empty actions when disabled", () => {
			const plugin = cacheClientPlugin({ enabled: false });
			const mockFetch = vi.fn();
			const actions = plugin.getActions?.(mockFetch);
			expect(actions).toEqual({});
		});

		it("should provide cache management actions", () => {
			const plugin = cacheClientPlugin({ enabled: true });
			const mockFetch = vi.fn();
			const actions = plugin.getActions?.(mockFetch);

			expect(actions?.invalidate).toBeDefined();
			expect(actions?.getStats).toBeDefined();
			expect(actions?.setCache).toBeDefined();
			expect(actions?.getCache).toBeDefined();
			expect(actions?.clearCache).toBeDefined();
		});

		it("should invalidate cache by pattern", async () => {
			const storage = new MemoryCacheStorage();
			const plugin = cacheClientPlugin({ storage });
			const mockFetch = vi.fn();
			const actions = plugin.getActions?.(mockFetch);

			// Add some cache entries
			await storage.set("bq-cache:product:read:1", {
				data: { id: "1" },
				timestamp: Date.now(),
				expiresAt: Date.now() + 1000,
			});
			await storage.set("bq-cache:product:list", {
				data: [],
				timestamp: Date.now(),
				expiresAt: Date.now() + 1000,
			});
			await storage.set("bq-cache:order:read:1", {
				data: { id: "1" },
				timestamp: Date.now(),
				expiresAt: Date.now() + 1000,
			});

			// Invalidate product cache only
			await actions?.invalidate("bq-cache:product:*");

			const keys = await storage.keys();
			expect(keys).toHaveLength(1);
			expect(keys[0]).toBe("bq-cache:order:read:1");
		});

		it("should clear all cache", async () => {
			const storage = new MemoryCacheStorage();
			const plugin = cacheClientPlugin({ storage });
			const mockFetch = vi.fn();
			const actions = plugin.getActions?.(mockFetch);

			await storage.set("key1", {
				data: "value1",
				timestamp: Date.now(),
				expiresAt: Date.now() + 1000,
			});

			await actions?.clearCache();

			const keys = await storage.keys();
			expect(keys).toHaveLength(0);
		});

		it("should get cache stats", async () => {
			const storage = new MemoryCacheStorage();
			const plugin = cacheClientPlugin({ storage });
			const mockFetch = vi.fn();
			const actions = plugin.getActions?.(mockFetch);

			await storage.set("key1", {
				data: "value1",
				timestamp: Date.now(),
				expiresAt: Date.now() + 1000,
			});
			await storage.set("key2", {
				data: "value2",
				timestamp: Date.now(),
				expiresAt: Date.now() + 1000,
			});

			const stats = await actions?.getStats();
			expect(stats?.size).toBe(2);
			expect(stats?.keys).toHaveLength(2);
		});

		it("should manually set and get cache", async () => {
			const storage = new MemoryCacheStorage();
			const plugin = cacheClientPlugin({ storage, defaultTTL: 300 });
			const mockFetch = vi.fn();
			const actions = plugin.getActions?.(mockFetch);

			const testData = { id: "1", name: "Test" };
			await actions?.setCache("test-key", testData, 300);

			const cached = await actions?.getCache("test-key");
			expect(cached?.data).toEqual(testData);
		});

		it("should use custom TTL for resources", () => {
			const plugin = cacheClientPlugin({
				defaultTTL: 300,
				resources: {
					product: {
						enabled: true,
						ttl: 600,
						strategy: "cache-first",
					},
				},
			});

			expect(plugin.id).toBe("cache-client");
		});
	});
});
