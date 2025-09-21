import { CrudClientPlugin, CrudClientPluginFactory } from "./types";

export interface ClientCacheOptions {
	/**
	 * Enable/disable the cache plugin
	 */
	enabled?: boolean;
	
	/**
	 * Default TTL in seconds
	 */
	defaultTTL?: number;
	
	/**
	 * Resource-specific cache settings
	 */
	resources?: Record<string, {
		enabled?: boolean;
		readTTL?: number;
		listTTL?: number;
	}>;
	
	/**
	 * Maximum cache size (number of entries)
	 */
	maxSize?: number;
	
	/**
	 * Custom cache key generator
	 */
	keyGenerator?: (url: string, method: string, body?: any) => string;
}

interface CacheEntry {
	data: any;
	timestamp: number;
	ttl: number;
}

/**
 * Simple in-memory cache for client-side caching
 */
class ClientCache {
	private cache = new Map<string, CacheEntry>();
	private maxSize: number;

	constructor(maxSize = 1000) {
		this.maxSize = maxSize;
	}

	set(key: string, data: any, ttl: number) {
		// Remove oldest entries if cache is full
		if (this.cache.size >= this.maxSize) {
			const oldestKey = this.cache.keys().next().value;
			if (oldestKey) {
				this.cache.delete(oldestKey);
			}
		}

		this.cache.set(key, {
			data,
			timestamp: Date.now(),
			ttl: ttl * 1000, // Convert to milliseconds
		});
	}

	get(key: string): any | null {
		const entry = this.cache.get(key);
		if (!entry) return null;

		// Check if entry has expired
		if (Date.now() - entry.timestamp > entry.ttl) {
			this.cache.delete(key);
			return null;
		}

		return entry.data;
	}

	delete(key: string) {
		this.cache.delete(key);
	}

	clear() {
		this.cache.clear();
	}

	invalidateResource(resource: string) {
		for (const [key] of this.cache) {
			if (key.includes(`/${resource}`)) {
				this.cache.delete(key);
			}
		}
	}

	getStats() {
		return {
			size: this.cache.size,
			maxSize: this.maxSize,
		};
	}
}

/**
 * Client-side cache plugin for CRUD operations
 * Caches GET requests to improve performance
 */
export const cacheClientPlugin: CrudClientPluginFactory<ClientCacheOptions> = (options = {}) => {
	const {
		enabled = true,
		defaultTTL = 300, // 5 minutes
		resources = {},
		maxSize = 1000,
		keyGenerator = (url, method, body) => `${method}:${url}${body ? `:${JSON.stringify(body)}` : ''}`,
	} = options;

	if (!enabled) {
		return {
			id: "crud-cache-client",
			name: "CRUD Cache Client",
			description: "Cache CRUD operations on the client side",
		};
	}

	const cache = new ClientCache(maxSize);

	const extractResourceFromUrl = (url: string | URL): string | null => {
		const urlStr = typeof url === "string" ? url : url.toString();
		const urlPath = new URL(urlStr, "http://localhost").pathname;
		const segments = urlPath.split("/").filter(Boolean);
		return segments.length >= 1 ? (segments[segments.length - 1] || null) : null;
	};

	const shouldCache = (method: string, resource: string): boolean => {
		// Only cache GET requests
		if (method.toUpperCase() !== "GET") return false;

		const resourceConfig = resources[resource];
		if (resourceConfig && resourceConfig.enabled === false) return false;

		return true;
	};

	const getTTL = (resource: string, isListOperation: boolean): number => {
		const resourceConfig = resources[resource];
		if (resourceConfig) {
			return isListOperation ? 
				(resourceConfig.listTTL ?? defaultTTL) : 
				(resourceConfig.readTTL ?? defaultTTL);
		}
		return defaultTTL;
	};

	const invalidateResourceCache = (resource: string) => {
		cache.invalidateResource(resource);
	};

	return {
		id: "crud-cache-client",
		name: "CRUD Cache Client",
		description: "Cache CRUD operations on the client side",
		hooks: {
			onRequest(context) {
				const method = context.method || "GET";
				const resource = extractResourceFromUrl(context.url);
				
				if (!resource || !shouldCache(method, resource)) {
					return context;
				}

				// Check cache for GET requests
				if (method.toUpperCase() === "GET") {
					const urlStr = typeof context.url === "string" ? context.url : context.url.toString();
					const cacheKey = keyGenerator(urlStr, method, context.body);
					const cached = cache.get(cacheKey);
					
					if (cached) {
						// Return cached response
						// Note: This is a simplified approach. In a real implementation,
						// you might want to return a Promise that resolves to the cached data
						(context as any).cachedResponse = cached;
					}
				}

				return context;
			},

			onSuccess(context) {
				const method = context.request.method || "GET";
				const resource = extractResourceFromUrl(context.request.url);
				
				if (!resource) return;

				// Cache successful GET responses
				if (method.toUpperCase() === "GET" && shouldCache(method, resource)) {
					const requestUrl = typeof context.request.url === "string" ? context.request.url : context.request.url.toString();
					const isListOperation = !requestUrl.split("/").pop()?.match(/^[a-zA-Z0-9-_]+$/);
					const ttl = getTTL(resource, isListOperation);
					const cacheKey = keyGenerator(requestUrl, method, context.request.body);
					
					cache.set(cacheKey, context.data, ttl);
				}

				// Invalidate cache for write operations
				if (["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase())) {
					invalidateResourceCache(resource);
				}
			},
		},
		crudOptions: {
			enabled,
		},
		
		// Expose cache management methods
		getCache: () => cache,
		clearCache: () => cache.clear(),
		getCacheStats: () => cache.getStats(),
		invalidateResource: invalidateResourceCache,
	} as CrudClientPlugin & {
		getCache: () => ClientCache;
		clearCache: () => void;
		getCacheStats: () => { size: number; maxSize: number };
		invalidateResource: (resource: string) => void;
	};
};