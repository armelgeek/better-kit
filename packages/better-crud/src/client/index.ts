import { BetterFetchOption } from "@better-fetch/fetch";
import { createClient } from "better-call/client";
import { BetterCrud } from "../crud";
import { CrudResourceConfig } from "../types";
import { ZodSchema, z } from "zod";

export interface CrudClientOptions extends BetterFetchOption {
	baseURL?: string;
}

/**
 * Error codes object similar to better-auth
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
 * Create a typed CRUD client from a CRUD instance
 */
export function createCrudClient<T extends BetterCrud = BetterCrud>(
	options?: CrudClientOptions,
): CrudClient<T> {
	type API = T["api"];

	const client = createClient<API>({
		...options,
		baseURL: options?.baseURL || inferBaseURL(),
	});

	const proxy = createCrudProxy(client);
	
	// Add error codes to the client (similar to better-auth pattern)
	(proxy as any).$ERROR_CODES = CRUD_ERROR_CODES;
	
	return proxy as CrudClient<T>;
}

/**
 * Create a proxy that organizes CRUD methods by resource
 */
function createCrudProxy(client: any) {
	// Create resource proxies
	const resources: Record<string, any> = {};

	return new Proxy(resources, {
		get(target, resourceName: string) {
			if (resourceName in target) {
				return target[resourceName];
			}
			
			// Handle special properties (like $ERROR_CODES)
			if (resourceName.startsWith('$')) {
				return undefined;
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

/**
 * Capitalize first letter of a string
 */
function capitalize(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Type helper to infer resource names and schemas from CRUD configuration
 */
type InferResourceNames<T extends readonly CrudResourceConfig[]> = {
	[K in T[number]["name"]]: T[number] & { name: K };
};

type GetResourceByName<
	T extends readonly CrudResourceConfig[],
	K extends string
> = Extract<T[number], { name: K }>;

type SchemaInput<T extends ZodSchema> = T extends ZodSchema<infer U> ? U : never;
type SchemaOutput<T extends ZodSchema> = T extends ZodSchema<any, any, infer U> ? U : never;

/**
 * Infer typed CRUD methods for a resource with proper schema typing
 */
type InferCrudMethods<
	TResources extends readonly CrudResourceConfig[],
	TResourceName extends string
> = {
	create: (
		data: SchemaInput<GetResourceByName<TResources, TResourceName>["schema"]>,
		options?: BetterFetchOption
	) => Promise<{
		data?: SchemaOutput<GetResourceByName<TResources, TResourceName>["schema"]>;
		error?: { code?: CrudErrorCode; message: string; details?: any };
	}>;
	
	read: (
		id: string,
		options?: BetterFetchOption
	) => Promise<{
		data?: SchemaOutput<GetResourceByName<TResources, TResourceName>["schema"]>;
		error?: { code?: CrudErrorCode; message: string; details?: any };
	}>;
	
	update: (
		id: string,
		data: Partial<SchemaInput<GetResourceByName<TResources, TResourceName>["schema"]>>,
		options?: BetterFetchOption
	) => Promise<{
		data?: SchemaOutput<GetResourceByName<TResources, TResourceName>["schema"]>;
		error?: { code?: CrudErrorCode; message: string; details?: any };
	}>;
	
	delete: (
		id: string,
		options?: BetterFetchOption
	) => Promise<{
		data?: { success: boolean };
		error?: { code?: CrudErrorCode; message: string; details?: any };
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
		options?: BetterFetchOption
	) => Promise<{
		data?: {
			items: SchemaOutput<GetResourceByName<TResources, TResourceName>["schema"]>[];
			pagination: {
				page: number;
				limit: number;
				total: number;
				totalPages: number;
				hasNext: boolean;
				hasPrev: boolean;
			};
		};
		error?: { code?: CrudErrorCode; message: string; details?: any };
	}>;
};

/**
 * Main client type that infers all resources from CRUD configuration
 */
export type CrudClient<T extends BetterCrud = BetterCrud> = {
	[K in T["options"]["resources"][number]["name"]]: InferCrudMethods<
		T["options"]["resources"],
		K
	>;
} & {
	$ERROR_CODES: typeof CRUD_ERROR_CODES;
};
