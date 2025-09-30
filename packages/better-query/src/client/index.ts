import { BetterFetchOption } from "@better-fetch/fetch";
import { createClient } from "better-call/client";
import { ZodSchema, z } from "zod";
import { BetterQuery } from "../query";
import { QueryResourceConfig } from "../types";
import { BetterQueryClientPlugin } from "../types/client-plugins";

export interface QueryClientOptions extends BetterFetchOption {
	baseURL?: string;
	/**
	 * Query client plugins to extend functionality
	 * Note: Different from fetchPlugins which are better-fetch plugins
	 */
	queryPlugins?: BetterQueryClientPlugin[];
}

// Legacy alias
export type CrudClientOptions = QueryClientOptions;

/**
 * Error codes object similar to better-auth
 */
export const QUERY_ERROR_CODES = {
	VALIDATION_FAILED: "VALIDATION_FAILED",
	FORBIDDEN: "FORBIDDEN",
	NOT_FOUND: "NOT_FOUND",
	RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
	INTERNAL_ERROR: "INTERNAL_ERROR",
	UNAUTHORIZED: "UNAUTHORIZED",
	CONFLICT: "CONFLICT",
	HOOK_EXECUTION_FAILED: "HOOK_EXECUTION_FAILED",
} as const;

// Legacy alias
export const CRUD_ERROR_CODES = QUERY_ERROR_CODES;

export type QueryErrorCode = keyof typeof QUERY_ERROR_CODES;

// Legacy alias
export type CrudErrorCode = QueryErrorCode;

/**
 * Infer base URL from environment variables (similar to better-auth pattern)
 */
function inferBaseURL() {
	const url =
		process.env.CRUD_URL ||
		process.env.NEXT_PUBLIC_CRUD_URL ||
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
 * Create a typed Query client from a Query instance
 */
export function createQueryClient<T extends BetterQuery = BetterQuery>(
	options?: QueryClientOptions,
): QueryClient<T> {
	type API = T["api"];

	// Only pass compatible options to createClient to avoid type conflicts
	const { onRequest, onResponse, onError, queryPlugins, ...rest } =
		options || {};

	const client = createClient<API>({
		...rest,
		baseURL: rest.baseURL || inferBaseURL(),
	} as any);

	const proxy = createQueryProxy(client, queryPlugins);

	(proxy as any).$ERROR_CODES = QUERY_ERROR_CODES;

	return proxy as QueryClient<T>;
}

// Legacy alias
export const createCrudClient = createQueryClient;

/**
 * Create a proxy that organizes Query methods by resource and plugins
 */
function createQueryProxy(client: any, plugins?: BetterQueryClientPlugin[]) {
	// Create resource proxies
	const resources: Record<string, any> = {};

	// Process plugins and add their actions
	const pluginActions: Record<string, any> = {};
	const pluginAtoms: Record<string, any> = {};

	if (plugins) {
		for (const plugin of plugins) {
			// Add custom actions from plugin
			if (plugin.getActions) {
				const actions = plugin.getActions(client);
				// Organize actions by plugin id (convert to camelCase)
				const pluginKey = kebabToCamelCase(plugin.id);
				pluginActions[pluginKey] = actions;
			}

			// Add atoms from plugin
			if (plugin.getAtoms) {
				const atoms = plugin.getAtoms(client);
				const pluginKey = kebabToCamelCase(plugin.id);
				pluginAtoms[pluginKey] = atoms;
			}

			// Setup atom listeners
			if (plugin.atomListeners && plugin.getAtoms) {
				const atoms = plugin.getAtoms(client);
				plugin.atomListeners(atoms, client);
			}
		}
	}

	return new Proxy(resources, {
		get(target, resourceName: string) {
			if (resourceName in target) {
				return target[resourceName];
			}

			// Handle special properties (like $ERROR_CODES)
			if (resourceName.startsWith("$")) {
				return undefined;
			}

			// Check if this is a plugin action
			if (pluginActions[resourceName]) {
				return pluginActions[resourceName];
			}

			// Check if this is a plugin atom
			if (pluginAtoms[resourceName]) {
				return pluginAtoms[resourceName];
			}

			// Create resource-specific methods
			const resourceMethods = {
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

			target[resourceName] = resourceMethods;
			return resourceMethods;
		},
	});
}

// Legacy alias
const createCrudProxy = createQueryProxy;

/**
 * Capitalize first letter of a string
 */
function capitalize(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Convert kebab-case to camelCase
 */
function kebabToCamelCase(str: string): string {
	return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Type helper to infer resource names and schemas from CRUD configuration
 */
type InferResourceNames<T extends readonly QueryResourceConfig[]> = {
	[K in T[number]["name"]]: T[number] & { name: K };
};

type GetResourceByName<
	T extends readonly QueryResourceConfig[],
	K extends string,
> = Extract<T[number], { name: K }>;

type SchemaInput<T extends ZodSchema> = T extends ZodSchema<infer U>
	? U
	: never;
type SchemaOutput<T extends ZodSchema> = T extends ZodSchema<any, any, infer U>
	? U
	: never;

/**
 * Infer typed Query methods for a resource with proper schema typing
 */
type InferQueryMethods<
	TResources extends readonly QueryResourceConfig[],
	TResourceName extends string,
> = {
	create: (
		data: SchemaInput<GetResourceByName<TResources, TResourceName>["schema"]>,
		options?: BetterFetchOption,
	) => Promise<{
		data?: SchemaOutput<GetResourceByName<TResources, TResourceName>["schema"]>;
		error?: { code?: QueryErrorCode; message: string; details?: any };
	}>;

	read: (
		id: string,
		options?: BetterFetchOption,
	) => Promise<{
		data?: SchemaOutput<GetResourceByName<TResources, TResourceName>["schema"]>;
		error?: { code?: QueryErrorCode; message: string; details?: any };
	}>;

	update: (
		id: string,
		data: Partial<
			SchemaInput<GetResourceByName<TResources, TResourceName>["schema"]>
		>,
		options?: BetterFetchOption,
	) => Promise<{
		data?: SchemaOutput<GetResourceByName<TResources, TResourceName>["schema"]>;
		error?: { code?: QueryErrorCode; message: string; details?: any };
	}>;

	delete: (
		id: string,
		options?: BetterFetchOption,
	) => Promise<{
		data?: { success: boolean };
		error?: { code?: QueryErrorCode; message: string; details?: any };
	}>;

	list: (
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
	) => Promise<{
		data?: {
			items: SchemaOutput<
				GetResourceByName<TResources, TResourceName>["schema"]
			>[];
			pagination: {
				page: number;
				limit: number;
				total: number;
				totalPages: number;
				hasNext: boolean;
				hasPrev: boolean;
			};
		};
		error?: { code?: QueryErrorCode; message: string; details?: any };
	}>;
};

// Legacy alias
type InferCrudMethods<
	TResources extends readonly QueryResourceConfig[],
	TResourceName extends string,
> = InferQueryMethods<TResources, TResourceName>;

/**
 * Main client type that infers all resources from Query configuration
 */
export type QueryClient<T extends BetterQuery = BetterQuery> = {
	[K in T["options"]["resources"][number]["name"]]: InferQueryMethods<
		T["options"]["resources"],
		K
	>;
} & {
	$ERROR_CODES: typeof QUERY_ERROR_CODES;
};

// Legacy alias
export type CrudClient<T extends BetterQuery = BetterQuery> = QueryClient<T>;

// Client exports are in src/client/react/index.ts to avoid mixing server and client code

// Note: React exports are intentionally separated to avoid bundling React hooks
// in server-side code. Import from 'better-query/react' instead.

// Export client plugin types
export type {
	BetterQueryClientPlugin,
	InferPluginEndpoints,
	InferClientMethods,
	InferClientAtoms,
} from "../types/client-plugins";
