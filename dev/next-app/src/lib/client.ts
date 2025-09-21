import { createReactAuthClient } from "better-auth/react";
import { createCrudClient } from "../../../packages/better-auth/src/plugins/crud/standalone-client";
import type { authMinimal as auth } from "./auth-minimal";

// Main auth client with plugin configuration
export const authClient = createReactAuthClient<typeof auth>({
	baseURL: "http://localhost:3000/api/auth",
	pluginConfigs: {
		crud: {
			baseURL: "http://localhost:3000/api/auth",
			resources: [
				// Configuration for client-side type inference
				// This should match the server-side configuration
			],
		},
	},
});

// Standalone CRUD client (alternative approach)
export const crudClient = createCrudClient({
	baseURL: "http://localhost:3000/api/auth",
});

export const client = authClient;
