import type { QueryClient } from "better-query";
import type { AdminListParams, AdminListResponse } from "../types";

/**
 * Admin client that wraps Better Query client with admin-specific methods
 */
export function createAdminClient<T extends QueryClient = QueryClient>(
	queryClient: T,
) {
	return {
		/** Original query client */
		query: queryClient,

		/**
		 * Generic list operation with admin formatting
		 */
		list: async <TData = any>(
			resource: string,
			params?: AdminListParams,
		): Promise<AdminListResponse<TData>> => {
			const {
				page = 1,
				perPage = 10,
				sortBy,
				sortOrder = "asc",
				search,
				filters = {},
			} = params || {};

			// Build query params
			const queryParams: any = {
				page,
				limit: perPage,
				...(sortBy && { sortBy, sortOrder }),
				...(search && { search }),
				...filters,
			};

			// Call the query client
			const result = await (queryClient as any)[resource].list(queryParams);

			if (result.error) {
				throw new Error(result.error.message || "Failed to fetch list");
			}

			// Format response
			const data = result.data || [];
			const total = result.total || data.length;
			const totalPages = Math.ceil(total / perPage);

			return {
				data,
				total,
				page,
				perPage,
				totalPages,
			};
		},

		/**
		 * Get a single resource by ID
		 */
		get: async <TData = any>(
			resource: string,
			id: string,
		): Promise<TData | null> => {
			const result = await (queryClient as any)[resource].read(id);
			if (result.error) {
				throw new Error(result.error.message || "Failed to fetch resource");
			}
			return result.data;
		},

		/**
		 * Create a new resource
		 */
		create: async <TData = any>(
			resource: string,
			data: any,
		): Promise<TData> => {
			const result = await (queryClient as any)[resource].create(data);
			if (result.error) {
				throw new Error(result.error.message || "Failed to create resource");
			}
			return result.data;
		},

		/**
		 * Update a resource
		 */
		update: async <TData = any>(
			resource: string,
			id: string,
			data: any,
		): Promise<TData> => {
			const result = await (queryClient as any)[resource].update(id, data);
			if (result.error) {
				throw new Error(result.error.message || "Failed to update resource");
			}
			return result.data;
		},

		/**
		 * Delete a resource
		 */
		delete: async (resource: string, id: string): Promise<void> => {
			const result = await (queryClient as any)[resource].delete(id);
			if (result.error) {
				throw new Error(result.error.message || "Failed to delete resource");
			}
		},

		/**
		 * Bulk delete resources
		 */
		bulkDelete: async (resource: string, ids: string[]): Promise<void> => {
			const promises = ids.map((id) =>
				(queryClient as any)[resource].delete(id),
			);
			const results = await Promise.all(promises);

			const errors = results.filter((r) => r.error);
			if (errors.length > 0) {
				throw new Error(
					`Failed to delete ${errors.length} resource(s): ${errors.map((e) => e.error.message).join(", ")}`,
				);
			}
		},
	};
}

export type AdminClient = ReturnType<typeof createAdminClient>;
