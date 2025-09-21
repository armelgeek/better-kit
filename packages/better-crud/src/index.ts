// Main export - the betterCrud factory function
export { betterCrud } from "./crud";
export type { BetterCrud } from "./crud";

// Client
export { createCrudClient } from "./client";
export type { CrudClient, CrudClientOptions } from "./client";

// Types
export * from "./types";
export * from "./types/adapter";

// Utils
export { createResource, zodSchemaToFields } from "./utils/schema";
export { RelationshipManager } from "./utils/relationships";

// Pre-defined schemas (basic)
export * from "./schemas";

// Endpoints
export { createCrudEndpoints } from "./endpoints";

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
