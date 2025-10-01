import type { BetterQueryClientPlugin } from "../../types/client-plugins";

/**
 * Cache strategies for client-side caching
 */
export type CacheStrategy =
	| "cache-first" // Check cache first, fallback to network
	| "network-first" // Check network first, fallback to cache
	| "cache-only" // Only use cache, throw error if not cached
	| "network-only" // Always fetch from network, update cache
	| "stale-while-revalidate" // Return cache immediately, fetch in background
	| "no-cache"; // Disable caching completely

/**
 * Cache entry metadata
 */
interface CacheEntry<T = any> {
	data: T;
	timestamp: number;
	expiresAt: number;
}

/**
 * Cache storage interface
 */
interface CacheStorage {
	get<T = any>(key: string): Promise<CacheEntry<T> | null>;
	set<T = any>(key: string, entry: CacheEntry<T>): Promise<void>;
	delete(key: string): Promise<void>;
	clear(): Promise<void>;
	keys(): Promise<string[]>;
}

/**
 * In-memory cache storage implementation
 */
class MemoryCacheStorage implements CacheStorage {
	private cache = new Map<string, CacheEntry>();

	async get<T = any>(key: string): Promise<CacheEntry<T> | null> {
		const entry = this.cache.get(key);
		if (!entry) return null;

		// Check if entry has expired
		if (Date.now() > entry.expiresAt) {
			this.cache.delete(key);
			return null;
		}

		return entry as CacheEntry<T>;
	}

	async set<T = any>(key: string, entry: CacheEntry<T>): Promise<void> {
		this.cache.set(key, entry);
	}

	async delete(key: string): Promise<void> {
		this.cache.delete(key);
	}

	async clear(): Promise<void> {
		this.cache.clear();
	}

	async keys(): Promise<string[]> {
		return Array.from(this.cache.keys());
	}

	getStats() {
		return {
			size: this.cache.size,
			keys: Array.from(this.cache.keys()),
		};
	}
}

/**
 * Client-side cache plugin options
 */
export interface CacheClientPluginOptions {
	/** Whether to enable caching */
	enabled?: boolean;
	/** Default TTL in seconds */
	defaultTTL?: number;
	/** Default cache strategy */
	defaultStrategy?: CacheStrategy;
	/** Custom cache storage implementation */
	storage?: CacheStorage;
	/** Cache key prefix */
	keyPrefix?: string;
	/** Resource-specific cache configuration */
	resources?: Record<
		string,
		{
			enabled?: boolean;
			ttl?: number;
			strategy?: CacheStrategy;
		}
	>;
}

/**
 * Client-side cache plugin
 */
export function cacheClientPlugin(
	options: CacheClientPluginOptions = {},
): BetterQueryClientPlugin {
	const {
		enabled = true,
		defaultTTL = 300, // 5 minutes
		defaultStrategy = "cache-first",
		storage = new MemoryCacheStorage(),
		keyPrefix = "bq-cache",
		resources = {},
	} = options;

	if (!enabled) {
		return {
			id: "cache-client",
			getActions: () => ({}),
		};
	}

	return {
		id: "cache-client",

		getActions: ($fetch: any) => ({
			/**
			 * Invalidate cache for a specific resource or pattern
			 */
			invalidate: async (pattern?: string) => {
				if (!pattern) {
					await storage.clear();
					return { success: true };
				}

				const keys = await storage.keys();
				const regex = new RegExp(pattern.replace(/\*/g, ".*"));
				for (const key of keys) {
					if (regex.test(key)) {
						await storage.delete(key);
					}
				}
				return { success: true };
			},

			/**
			 * Get cache statistics
			 */
			getStats: async () => {
				const keys = await storage.keys();
				return {
					size: keys.length,
					keys,
				};
			},

			/**
			 * Manually set cache entry
			 */
			setCache: async <T = any>(
				key: string,
				data: T,
				ttl: number = defaultTTL,
			) => {
				await storage.set(key, {
					data,
					timestamp: Date.now(),
					expiresAt: Date.now() + ttl * 1000,
				});
				return { success: true };
			},

			/**
			 * Manually get cache entry
			 */
			getCache: async <T = any>(key: string) => {
				const entry = await storage.get<T>(key);
				return entry ? { data: entry.data } : { data: null };
			},

			/**
			 * Clear all cache
			 */
			clearCache: async () => {
				await storage.clear();
				return { success: true };
			},
		}),
	};
}

export type { CacheStorage, CacheEntry };
export { MemoryCacheStorage };
