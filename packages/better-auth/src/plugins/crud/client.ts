import { BetterFetchOption } from "@better-fetch/fetch";
import { ZodSchema, z } from "zod";
import { BetterAuth } from "../../auth";
import { ClientOptions } from "../../client/base";
import { CrudResourceConfig } from "./types";

/**
 * Infer CRUD client methods for a resource
 */
export type InferCrudResourceMethods<T extends CrudResourceConfig> = {
	create: (
		data: T["schema"] extends ZodSchema ? z.input<T["schema"]> : any,
		options?: BetterFetchOption,
	) => Promise<{ data: T["schema"] extends ZodSchema ? z.output<T["schema"]> : any }>;
	read: (
		id: string,
		options?: BetterFetchOption,
	) => Promise<{ data: T["schema"] extends ZodSchema ? z.output<T["schema"]> : any }>;
	update: (
		id: string,
		data: T["schema"] extends ZodSchema ? Partial<z.input<T["schema"]>> : any,
		options?: BetterFetchOption,
	) => Promise<{ data: T["schema"] extends ZodSchema ? z.output<T["schema"]> : any }>;
	delete: (
		id: string,
		options?: BetterFetchOption,
	) => Promise<{ data: { success: boolean } }>;
	list: (options?: {
		page?: number;
		limit?: number;
		search?: string;
		sortBy?: string;
		sortOrder?: "asc" | "desc";
	}) => Promise<{
		data: {
			items: T["schema"] extends ZodSchema ? z.output<T["schema"]>[] : any[];
			pagination: {
				page: number;
				limit: number;
				total: number;
				totalPages: number;
			};
		};
	}>;
};

/**
 * Infer CRUD client from auth instance with CRUD plugin
 */
export type InferCrudClient<Auth> = Auth extends {
	options: {
		plugins: Array<infer P>;
	};
}
	? P extends {
			id: "crud";
		} & infer CrudPlugin
		? CrudPlugin extends {
				resources: infer R;
			}
			? R extends Array<CrudResourceConfig>
				? {
						[K in R[number]["name"]]: InferCrudResourceMethods<
							Extract<R[number], { name: K }>
						>;
					}
				: {}
			: CrudPlugin extends (...args: any[]) => {
					resources: infer R;
				}
			? R extends Array<CrudResourceConfig>
				? {
						[K in R[number]["name"]]: InferCrudResourceMethods<
							Extract<R[number], { name: K }>
						>;
					}
				: {}
			: {}
		: {}
	: {};

/**
 * Extract CRUD resources from plugins type 
 */
type ExtractCrudResources<Auth> = Auth extends {
	options: {
		plugins: Array<infer P>;
	};
}
	? P extends {
			id: "crud";
		} & infer CrudPlugin
		? CrudPlugin extends {
				resources: infer R;
			}
			? R extends Array<CrudResourceConfig>
				? R
				: never
			: never
		: never
	: never;

/**
 * Create CRUD client methods for a specific resource
 */
export function createCrudResourceMethods<T extends CrudResourceConfig>(
	resourceConfig: T,
	client: any,
): InferCrudResourceMethods<T> {
	const { name, endpoints = {} } = resourceConfig;

	// Default all endpoints to true if not specified
	const enabledEndpoints = {
		create: true,
		read: true,
		update: true,
		delete: true,
		list: true,
		...endpoints,
	};

	const methods: any = {};

	if (enabledEndpoints.create) {
		methods.create = async (data: any, options?: BetterFetchOption) => {
			return client(`create${capitalize(name)}`, {
				body: data,
				...options,
			});
		};
	}

	if (enabledEndpoints.read) {
		methods.read = async (id: string, options?: BetterFetchOption) => {
			return client(`get${capitalize(name)}`, {
				params: { id },
				...options,
			});
		};
	}

	if (enabledEndpoints.update) {
		methods.update = async (
			id: string,
			data: any,
			options?: BetterFetchOption,
		) => {
			return client(`update${capitalize(name)}`, {
				params: { id },
				body: data,
				...options,
			});
		};
	}

	if (enabledEndpoints.delete) {
		methods.delete = async (id: string, options?: BetterFetchOption) => {
			return client(`delete${capitalize(name)}`, {
				params: { id },
				...options,
			});
		};
	}

	if (enabledEndpoints.list) {
		methods.list = async (options?: {
			page?: number;
			limit?: number;
			search?: string;
			sortBy?: string;
			sortOrder?: "asc" | "desc";
		}) => {
			return client(`list${capitalize(name)}s`, {
				query: options,
			});
		};
	}

	return methods;
}

/**
 * Create CRUD client extensions for a specific auth instance
 */
export function createAuthClientWithCrud<Auth extends BetterAuth = BetterAuth>(
	authInstance: Auth,
	options?: ClientOptions,
) {
	// This will be implemented in the main client file to avoid circular imports
	throw new Error("This function should be imported from 'better-auth/client'");
}

/**
 * Extract CRUD plugin from auth instance
 */
export function extractCrudPlugin(authInstance: any) {
	if (!authInstance?.options?.plugins) return null;

	for (const plugin of authInstance.options.plugins) {
		if (plugin.id === "crud") {
			return plugin;
		}
	}

	return null;
}

/**
 * Helper function to capitalize first letter
 */
function capitalize(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1);
}