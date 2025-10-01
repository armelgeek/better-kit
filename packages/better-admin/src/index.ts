// Main exports
export { betterAdmin, createAdminResource } from "./core";
export type { AdminContext } from "./core";

// Types
export * from "./types";

// Client (non-React)
export { createAdminClient } from "./client";
export type { AdminClient } from "./client";

// Utilities
export { generateFormFields, getResourceFormFields } from "./utils";

// UI components are exported separately to avoid mixing server and client code
// Import from 'better-admin/ui' for UI components
// Import from 'better-admin/react' for React hooks

// Re-export Better Query types that are commonly used
export type {
	QueryResourceConfig,
	QueryPermissionContext,
	QueryHookContext,
} from "better-query";
