import { BetterFetchOption } from "@better-fetch/fetch";
import { createClient } from "better-call/client";
import { BetterCrud } from "../crud";
import { CrudResourceConfig } from "../types";

export interface CrudClientOptions extends BetterFetchOption {
	baseURL?: string;
}

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
) {
	type API = T["api"];

	const client = createClient<API>({
		...options,
		baseURL: options?.baseURL || inferBaseURL(),
	});

	return createCrudProxy(client);
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
 * Type helper to infer resource names from CRUD configuration
 */
type InferResourceNames<T extends readonly CrudResourceConfig[]> = {
	[K in T[number]["name"]]: {
		create: (data: any, options?: BetterFetchOption) => Promise<any>;
		read: (id: string, options?: BetterFetchOption) => Promise<any>;
		update: (
			id: string,
			data: any,
			options?: BetterFetchOption,
		) => Promise<any>;
		delete: (id: string, options?: BetterFetchOption) => Promise<any>;
		list: (
			params?: {
				page?: number;
				limit?: number;
				search?: string;
				sortBy?: string;
				sortOrder?: "asc" | "desc";
			},
			options?: BetterFetchOption,
		) => Promise<any>;
	};
};

export type CrudClient<T extends BetterCrud = BetterCrud> = InferResourceNames<
	T["options"]["resources"]
>;
