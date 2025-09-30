"use client";
import { createFetch } from "@better-fetch/fetch";
import type { BetterQuery } from "../../query";
import { inferBaseURL } from "../utils";
import { createQueryProxy } from "./proxy";
import type { ReactQueryClientOptions } from "./types";

/**
 * Create a React-specific Query client that works client-side
 * Similar to better-auth's createAuthClient but for better-query
 */
export function createReactQueryClient<T extends BetterQuery = BetterQuery>(
	options?: ReactQueryClientOptions,
): ReactQueryClient<T> {
	// Create the fetch client using @better-fetch/fetch for client-side operations
	const $fetch = createFetch({
		baseURL: options?.baseURL || inferBaseURL(),
		credentials: "include", // Include cookies for authentication
		method: "GET",
		headers: {
			"Content-Type": "application/json",
			...options?.headers,
		},
		...options?.fetchOptions,
	});

	// Create the proxy that organizes methods by resource
	const proxy = createQueryProxy($fetch, options);

	return proxy as ReactQueryClient<T>;
}

/**
 * Type for the React Query client
 */
export type ReactQueryClient<T extends BetterQuery = BetterQuery> = {
	[K in T["options"]["resources"][number]["name"]]: {
		create: (
			data: any,
			options?: { headers?: Record<string, string> },
		) => Promise<{ data?: any; error?: any }>;
		read: (
			id: string,
			options?: { headers?: Record<string, string> },
		) => Promise<{ data?: any; error?: any }>;
		update: (
			id: string,
			data: any,
			options?: { headers?: Record<string, string> },
		) => Promise<{ data?: any; error?: any }>;
		delete: (
			id: string,
			options?: { headers?: Record<string, string> },
		) => Promise<{ data?: any; error?: any }>;
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
			options?: { headers?: Record<string, string> },
		) => Promise<{ data?: any; error?: any }>;
	};
} & {
	$fetch: ReturnType<typeof createFetch>;
	$ERROR_CODES: typeof import("../index").QUERY_ERROR_CODES;
};

// Legacy alias
export const createReactCrudClient = createReactQueryClient;
export type ReactCrudClient<T extends BetterQuery = BetterQuery> =
	ReactQueryClient<T>;

// Export types
export * from "./types";

// Export hooks
export { useQuery, useResource } from "./hooks";
