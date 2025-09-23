import type { BetterFetch, BetterFetchOption } from "@better-fetch/fetch";
import { QUERY_ERROR_CODES } from "../index";
import type { ReactQueryClientOptions } from "./types";

/**
 * Create a proxy that organizes Query methods by resource for React client
 * This version uses @better-fetch/fetch for true client-side operations
 */
export function createQueryProxy(
	$fetch: BetterFetch,
	options?: ReactQueryClientOptions
) {
	// Create resource proxies
	const resources: Record<string, any> = {};

	const proxy = new Proxy(resources, {
		get(target, resourceName: string) {
			if (resourceName in target) {
				return target[resourceName];
			}
			
			// Handle special properties
			if (resourceName === "$fetch") {
				return $fetch;
			}
			
			if (resourceName === "$ERROR_CODES") {
				return QUERY_ERROR_CODES;
			}
			
			if (resourceName.startsWith('$')) {
				return undefined;
			}

			// Create resource-specific methods
			const resourceMethods = {
				create: async (data: any, requestOptions?: { headers?: Record<string, string> }) => {
					try {
						const response = await $fetch(`/${resourceName}`, {
							method: "POST",
							body: data,
							headers: {
								...options?.headers,
								...requestOptions?.headers,
							},
						});
						return { data: response.data, error: response.error };
					} catch (error: any) {
						return { 
							data: null, 
							error: { 
								message: error.message || "Failed to create", 
								code: error.code || "INTERNAL_ERROR" 
							} 
						};
					}
				},

				read: async (id: string, requestOptions?: { headers?: Record<string, string> }) => {
					try {
						const response = await $fetch(`/${resourceName}/${id}`, {
							method: "GET",
							headers: {
								...options?.headers,
								...requestOptions?.headers,
							},
						});
						return { data: response.data, error: response.error };
					} catch (error: any) {
						return { 
							data: null, 
							error: { 
								message: error.message || "Failed to read", 
								code: error.code || "INTERNAL_ERROR" 
							} 
						};
					}
				},

				update: async (id: string, data: any, requestOptions?: { headers?: Record<string, string> }) => {
					try {
						const response = await $fetch(`/${resourceName}/${id}`, {
							method: "PATCH",
							body: data,
							headers: {
								...options?.headers,
								...requestOptions?.headers,
							},
						});
						return { data: response.data, error: response.error };
					} catch (error: any) {
						return { 
							data: null, 
							error: { 
								message: error.message || "Failed to update", 
								code: error.code || "INTERNAL_ERROR" 
							} 
						};
					}
				},

				delete: async (id: string, requestOptions?: { headers?: Record<string, string> }) => {
					try {
						const response = await $fetch(`/${resourceName}/${id}`, {
							method: "DELETE",
							headers: {
								...options?.headers,
								...requestOptions?.headers,
							},
						});
						return { data: response.data, error: response.error };
					} catch (error: any) {
						return { 
							data: null, 
							error: { 
								message: error.message || "Failed to delete", 
								code: error.code || "INTERNAL_ERROR" 
							} 
						};
					}
				},

				list: async (
					params?: {
						page?: number;
						limit?: number;
						search?: string;
						sortBy?: string;
						sortOrder?: "asc" | "desc";
						include?: string[];
						where?: Record<string, any>;
						filters?: Record<string, any>;
					},
					requestOptions?: { headers?: Record<string, string> }
				) => {
					try {
						const response = await $fetch(`/${resourceName}s`, {
							method: "GET",
							query: params,
							headers: {
								...options?.headers,
								...requestOptions?.headers,
							},
						});
						return { data: response.data, error: response.error };
					} catch (error: any) {
						return { 
							data: null, 
							error: { 
								message: error.message || "Failed to list", 
								code: error.code || "INTERNAL_ERROR" 
							} 
						};
					}
				},
			};

			target[resourceName] = resourceMethods;
			return resourceMethods;
		},
	});

	// Add special properties directly to the proxy
	(proxy as any).$fetch = $fetch;
	(proxy as any).$ERROR_CODES = QUERY_ERROR_CODES;

	return proxy;
}