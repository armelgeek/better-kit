// Main export - the adiemus factory function
export { adiemus } from "./crud";
export type { BetterCrud, Adiemus } from "./crud";

// Client
export { createCrudClient } from "./client";
export type { CrudClient, CrudClientOptions } from "./client";

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
export { createCrudEndpoints, createCrudEndpoint } from "./endpoints";
