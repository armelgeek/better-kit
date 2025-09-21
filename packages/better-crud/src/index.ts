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

// Pre-defined schemas (basic)
export * from "./schemas";

// Endpoints
export { createCrudEndpoints, createCrudEndpoint } from "./endpoints";

// Relationship examples - export explicitly to avoid conflicts
export {
  productRelationships,
  categoryRelationships,
  reviewRelationships,
  userRelationships,
  tagRelationships,
  orderRelationships,
  postRelationships,
  reviewSchema,
} from "./schemas/relationships";
