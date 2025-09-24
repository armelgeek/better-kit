import { createReactQueryClient } from "../../../../packages/better-query/src/client/react";
import type { query } from "./crud-auth";

// Create React client for client-side operations
export const reactQueryClient = createReactQueryClient<typeof query>({
	baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/query",
	headers: {
		"Content-Type": "application/json",
	},
});

// Export type for use in components
export type ReactQueryClient = typeof reactQueryClient;