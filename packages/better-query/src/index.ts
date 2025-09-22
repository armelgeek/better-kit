// Main export - the betterQuery factory function
export { betterQuery } from "./query";
export type { BetterQuery, BetterCrud, Adiemus } from "./query";

// Legacy exports for backward compatibility  
export { betterQuery as adiemus } from "./query";
export { betterQuery as betterCrud } from "./query";

// Client
export { createQueryClient } from "./client";
export type { QueryClient, QueryClientOptions } from "./client";

// Legacy client exports
export { createQueryClient as createCrudClient } from "./client";
export type { QueryClient as CrudClient, QueryClientOptions as CrudClientOptions } from "./client";

// Types
export * from "./types";
export * from "./types/adapter";
export * from "./types/plugins";

// Plugins
export * from "./plugins";

// Utils
export { createResource, zodSchemaToFields } from "./utils/schema";
export { RelationshipManager } from "./utils/relationships";

// Schema helpers (no predefined schemas, just utilities)
export * from "./schemas";

// Relationship helpers
export * from "./schemas/relationships";

// Endpoints
export { createQueryEndpoints, createQueryEndpoint } from "./endpoints";

// Legacy endpoint exports
export { createQueryEndpoints as createCrudEndpoints, createQueryEndpoint as createCrudEndpoint } from "./endpoints";
