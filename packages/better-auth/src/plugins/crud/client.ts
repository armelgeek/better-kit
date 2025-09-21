import { BetterFetchOption } from "@better-fetch/fetch";
import { createClient } from "better-call/client";
import { ZodSchema } from "zod";
import { PluginClientConfig } from "../../types/plugin-client";
import { CrudResourceConfig } from "./types";

/**
 * CRUD client configuration that can be used with the main auth client
 */
export const crudClientConfig: PluginClientConfig = {
	id: "crud",
	methods: {
		// These will be added to the main auth client when the CRUD plugin is used
		crud: {
			// Dynamic resource methods will be added here based on plugin configuration
		}
	},
	options: {
		// Default options for CRUD requests
	}
};

/**
 * Create CRUD client methods for a specific resource
 */
export function createCrudResourceMethods(
	resourceConfig: CrudResourceConfig,
	client: any,
	baseURL?: string
) {
	const resourceName = resourceConfig.name;
	
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
 * Create typed CRUD client methods for all resources in a CRUD plugin configuration
 */
export function createCrudClientMethods(
	resources: CrudResourceConfig[],
	client: any,
	baseURL?: string
): Record<string, any> {
	const methods: Record<string, any> = {};
	
	for (const resource of resources) {
		methods[resource.name] = createCrudResourceMethods(resource, client, baseURL);
	}
	
	return methods;
}

/**
 * Enhanced client options that include plugin configurations
 */
export interface ClientOptionsWithPlugins extends BetterFetchOption {
	/**
	 * Plugin-specific configurations
	 */
	plugins?: {
		crud?: {
			resources?: CrudResourceConfig[];
			basePath?: string;
		};
		[key: string]: any;
	};
}