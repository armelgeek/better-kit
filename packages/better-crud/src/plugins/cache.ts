import { createCrudEndpoint } from "../endpoints/crud-endpoint";
import { Plugin } from "../types/plugins";
import { CrudHookContext } from "../types";
import { z } from "zod";

/**
 * Simple in-memory cache implementation
 * In a real implementation, you'd use Redis or another cache store
 */
class MemoryCache {
	private cache = new Map<string, { data: any; expires: number }>();

	set(key: string, data: any, ttlSeconds = 300): void {
		const expires = Date.now() + (ttlSeconds * 1000);
		this.cache.set(key, { data, expires });
	}

	get(key: string): any | null {
		const entry = this.cache.get(key);
		if (!entry) return null;
		
		if (Date.now() > entry.expires) {
			this.cache.delete(key);
			return null;
		}
		
		return entry.data;
	}

	delete(key: string): void {
		this.cache.delete(key);
	}

	clear(): void {
		this.cache.clear();
	}

	invalidatePattern(pattern: string): void {
		const regex = new RegExp(pattern.replace(/\*/g, ".*"));
		for (const key of this.cache.keys()) {
			if (regex.test(key)) {
				this.cache.delete(key);
			}
		}
	}

	getStats() {
		return {
			size: this.cache.size,
			keys: Array.from(this.cache.keys()),
		};
	}
}

/**
 * Cache plugin options
 */
export interface CachePluginOptions {
	/** Whether to enable caching */
	enabled?: boolean;
	/** Default TTL in seconds */
	defaultTTL?: number;
	/** Cache configuration per resource */
	resources?: Record<string, {
		/** Enable/disable caching for this resource */
		enabled?: boolean;
		/** TTL for read operations */
		readTTL?: number;
		/** TTL for list operations */
		listTTL?: number;
		/** Cache keys to invalidate on write operations */
		invalidatePatterns?: string[];
	}>;
	/** Custom cache implementation */
	cache?: {
		get: (key: string) => any | Promise<any>;
		set: (key: string, data: any, ttl?: number) => void | Promise<void>;
		delete: (key: string) => void | Promise<void>;
		clear: () => void | Promise<void>;
		invalidatePattern?: (pattern: string) => void | Promise<void>;
	};
}

/**
 * Cache plugin factory
 */
export function cachePlugin(options: CachePluginOptions = {}): Plugin {
	const {
		enabled = true,
		defaultTTL = 300, // 5 minutes
		resources = {},
		cache = new MemoryCache(),
	} = options;

	if (!enabled) {
		return {
			id: "cache",
			endpoints: {},
		};
	}

	const getCacheKey = (resource: string, operation: string, id?: string, query?: any): string => {
		const parts = [resource, operation];
		if (id) parts.push(id);
		if (query) parts.push(JSON.stringify(query));
		return parts.join(":");
	};

	const shouldCache = (resource: string): boolean => {
		const resourceConfig = resources[resource];
		return resourceConfig?.enabled !== false; // Default to enabled
	};

	const getTTL = (resource: string, operation: string): number => {
		const resourceConfig = resources[resource];
		if (operation === "read") {
			return resourceConfig?.readTTL || defaultTTL;
		} else if (operation === "list") {
			return resourceConfig?.listTTL || defaultTTL;
		}
		return defaultTTL;
	};

	const invalidateCache = async (resource: string): Promise<void> => {
		const resourceConfig = resources[resource];
		const patterns = resourceConfig?.invalidatePatterns || [`${resource}:*`];
		
		for (const pattern of patterns) {
			if (cache.invalidatePattern) {
				await cache.invalidatePattern(pattern);
			}
		}
	};

	return {
		id: "cache",
		
		endpoints: {
			getCacheStats: createCrudEndpoint("/cache/stats", {
				method: "GET",
			}, async (ctx) => {
				if ("getStats" in cache && typeof cache.getStats === "function") {
					return ctx.json((cache as any).getStats());
				}
				return ctx.json({ message: "Cache stats not available" });
			}),

			clearCache: createCrudEndpoint("/cache/clear", {
				method: "POST",
				body: z.object({
					resource: z.string().optional(),
					pattern: z.string().optional(),
				}).optional(),
			}, async (ctx) => {
				const { resource, pattern } = ctx.body || {};
				
				if (pattern && cache.invalidatePattern) {
					await cache.invalidatePattern(pattern);
					return ctx.json({ message: `Cleared cache for pattern: ${pattern}` });
				} else if (resource) {
					await invalidateCache(resource);
					return ctx.json({ message: `Cleared cache for resource: ${resource}` });
				} else {
					await cache.clear();
					return ctx.json({ message: "Cleared all cache" });
				}
			}),
		},

		hooks: {
			beforeRead: async (context) => {
				if (!shouldCache(context.resource)) return;
				
				const cacheKey = getCacheKey(context.resource, "read", context.id);
				const cached = await cache.get(cacheKey);
				
				if (cached) {
					// Set cached result in context so endpoint can use it
					(context as any).cachedResult = cached;
				}
			},

			afterRead: async (context) => {
				if (!shouldCache(context.resource) || (context as any).cachedResult) return;
				
				const cacheKey = getCacheKey(context.resource, "read", context.id);
				const ttl = getTTL(context.resource, "read");
				
				if (context.result) {
					await cache.set(cacheKey, context.result, ttl);
				}
			},

			beforeList: async (context) => {
				if (!shouldCache(context.resource)) return;
				
				const cacheKey = getCacheKey(context.resource, "list", undefined, context.data);
				const cached = await cache.get(cacheKey);
				
				if (cached) {
					(context as any).cachedResult = cached;
				}
			},

			afterList: async (context) => {
				if (!shouldCache(context.resource) || (context as any).cachedResult) return;
				
				const cacheKey = getCacheKey(context.resource, "list", undefined, context.data);
				const ttl = getTTL(context.resource, "list");
				
				if (context.result) {
					await cache.set(cacheKey, context.result, ttl);
				}
			},

			afterCreate: async (context) => {
				await invalidateCache(context.resource);
			},

			afterUpdate: async (context) => {
				await invalidateCache(context.resource);
			},

			afterDelete: async (context) => {
				await invalidateCache(context.resource);
			},
		},

		options,
	};
}