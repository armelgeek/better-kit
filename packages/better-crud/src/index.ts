// Main export - the betterCrud factory function
export { betterCrud } from "./crud";
export type { BetterCrud } from "./crud";

// Client
export { createCrudClient } from "./client";
export type { CrudClient, CrudClientOptions } from "./client";

// Types
export * from "./types";

// Utils
export { createResource, zodSchemaToFields } from "./utils/schema";

// Pre-defined schemas
export * from "./schemas";

// Endpoints
export { createCrudEndpoints } from "./endpoints";
