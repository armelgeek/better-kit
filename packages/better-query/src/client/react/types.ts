import type { BetterFetchOption } from "@better-fetch/fetch";

/**
 * Options for the React Query client
 */
export interface ReactQueryClientOptions {
	baseURL?: string;
	headers?: Record<string, string>;
	fetchOptions?: BetterFetchOption;
}

// Legacy alias
export type ReactCrudClientOptions = ReactQueryClientOptions;