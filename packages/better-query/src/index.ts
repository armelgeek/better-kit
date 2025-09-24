// Main export - the betterQuery factory function
export { betterQuery } from "./query";
export type { BetterQuery, BetterCrud, Adiemus } from "./query";

// Legacy exports for backward compatibility  
export { betterQuery as adiemus } from "./query";
export { betterQuery as betterCrud } from "./query";

// Client
export { createQueryClient } from "./client";
export type { QueryClient, QueryClientOptions } from "./client";

// React Client
export { createReactQueryClient, useQuery, useResource } from "./client";
export type { ReactQueryClient, ReactQueryClientOptions } from "./client";

// Legacy client exports
export { createQueryClient as createCrudClient, createReactQueryClient as createReactCrudClient } from "./client";
export type { QueryClient as CrudClient, QueryClientOptions as CrudClientOptions, ReactQueryClient as ReactCrudClient, ReactQueryClientOptions as ReactCrudClientOptions } from "./client";

// Types
export * from "./types";
export * from "./types/adapter";
export * from "./types/plugins";
export * from "./types/better-auth";

// Plugins
export * from "./plugins";

// Utils
export { createResource, zodSchemaToFields } from "./utils/schema";
export { RelationshipManager } from "./utils/relationships";
export { SchemaMigrationManager, withSchemaVersion, createSchemaMigration } from "./utils/migrations";
export type { SchemaVersion, Migration, SchemaChange } from "./utils/migrations";

// Schema helpers (no predefined schemas, just utilities)
export * from "./schemas";

// Relationship helpers
export * from "./schemas/relationships";

// Endpoints
export { createQueryEndpoints, createQueryEndpoint } from "./endpoints";

// Legacy endpoint exports
export { createQueryEndpoints as createCrudEndpoints, createQueryEndpoint as createCrudEndpoint } from "./endpoints";

// CLI exports (for programmatic use)
export { templateManager } from "./cli/templates";
export type { ProjectConfig } from "./cli/templates";
