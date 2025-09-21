import { BetterFetchOption } from "@better-fetch/fetch";
import { createClient } from "better-call/client";
import { CrudResourceConfig } from "./types";

/**
 * Error codes for CRUD operations (similar to better-auth pattern)
 */
export const CRUD_ERROR_CODES = {
	VALIDATION_FAILED: "VALIDATION_FAILED",
	FORBIDDEN: "FORBIDDEN", 
	NOT_FOUND: "NOT_FOUND",
	RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
	INTERNAL_ERROR: "INTERNAL_ERROR",
	UNAUTHORIZED: "UNAUTHORIZED",
	CONFLICT: "CONFLICT",
	HOOK_EXECUTION_FAILED: "HOOK_EXECUTION_FAILED",
} as const;

export type CrudErrorCode = keyof typeof CRUD_ERROR_CODES;

/**
 * Client options for CRUD plugin
 */
export interface CrudClientOptions extends BetterFetchOption {
	baseURL?: string;
	/**
	 * Resources configuration for client-side operations
	 */
	resources?: CrudResourceConfig[];
}

/**
 * Infer base URL from environment variables (similar to better-auth pattern)
 */
function inferCrudBaseURL() {
	const url =
		process.env.CRUD_URL ||
		process.env.NEXT_PUBLIC_CRUD_URL ||
		process.env.AUTH_URL ||
		process.env.NEXT_PUBLIC_AUTH_URL ||
		process.env.VERCEL_URL ||
		process.env.NEXT_PUBLIC_VERCEL_URL;

	if (url) {
		return url;
	}

	if (
		!url &&
		(process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test")
	) {
		return "http://localhost:3000";
	}

	throw new Error(
		"Could not infer baseURL from environment variables. Please pass it as an option to the createCrudClient function.",
	);
}

/**
 * Create a standalone CRUD client that can be used independently or with the auth client
 */
export function createCrudClient<TResources extends readonly CrudResourceConfig[] = []>(
	options?: CrudClientOptions,
) {
	const client = createClient<any>({
		...options,
		baseURL: options?.baseURL || inferCrudBaseURL(),
	});

	// Create resource-specific methods
	const resourceMethods: Record<string, any> = {};
	
	if (options?.resources) {
		for (const resource of options.resources) {
			resourceMethods[resource.name] = createResourceMethods(resource.name, client);
		}
	}

	// Create a proxy to handle dynamic resource access
	const proxy = new Proxy(resourceMethods, {
		get(target, resourceName: string) {
			if (resourceName in target) {
				return target[resourceName];
			}
			
			// Handle special properties
			if (resourceName.startsWith('$') || resourceName === 'then' || resourceName === 'valueOf') {
				return undefined;
			}

			// Create methods for new resources dynamically
			const methods = createResourceMethods(resourceName, client);
			target[resourceName] = methods;
			return methods;
		},
	});

	// Add error codes to the client
	(proxy as any).$ERROR_CODES = CRUD_ERROR_CODES;
	
	return proxy as CrudClient<TResources>;
}

/**
 * Create CRUD methods for a specific resource
 */
function createResourceMethods(resourceName: string, client: any) {
	return {
		create: async (data: any, options?: BetterFetchOption) => {
			return client(`/${resourceName}`, {
				method: "POST",
				body: data,
				...options,
			});
		},

		read: async (id: string, options?: BetterFetchOption) => {
			return client(`/${resourceName}/${id}`, {
				method: "GET",
				...options,
			});
		},

		update: async (id: string, data: any, options?: BetterFetchOption) => {
			return client(`/${resourceName}/${id}`, {
				method: "PATCH", 
				body: data,
				...options,
			});
		},

		delete: async (id: string, options?: BetterFetchOption) => {
			return client(`/${resourceName}/${id}`, {
				method: "DELETE",
				...options,
			});
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
			options?: BetterFetchOption,
		) => {
			return client(`/${resourceName}s`, {
				method: "GET",
				query: params,
				...options,
			});
		},
	};
}

/**
 * Type helper to infer resource names from configuration
 */
type GetResourceByName<
	TResources extends readonly CrudResourceConfig[],
	TName extends string
> = Extract<TResources[number], { name: TName }>;

/**
 * Type for CRUD client with typed resource methods
 */
export type CrudClient<TResources extends readonly CrudResourceConfig[] = []> = {
	[K in TResources[number]["name"]]: {
		create: (data: any, options?: BetterFetchOption) => Promise<any>;
		read: (id: string, options?: BetterFetchOption) => Promise<any>;
		update: (id: string, data: any, options?: BetterFetchOption) => Promise<any>;
		delete: (id: string, options?: BetterFetchOption) => Promise<any>;
		list: (params?: {
			page?: number;
			limit?: number;
			search?: string;
			sortBy?: string;
			sortOrder?: "asc" | "desc";
			include?: string[];
			where?: Record<string, any>;
			filters?: Record<string, any>;
		}, options?: BetterFetchOption) => Promise<any>;
	};
} & {
	$ERROR_CODES: typeof CRUD_ERROR_CODES;
};