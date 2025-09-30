// Core plugin infrastructure
export { PluginManager, shimPluginContext, createPlugin, defaultPluginManager } from "./manager";

// Plugin types
export type { 
	Plugin, 
	PluginFactory, 
	PluginHooks, 
	PluginInitContext, 
	PluginSchema, 
	PluginOpenAPI,
	ExtendedPlugin,
} from "../types/plugins";

// Built-in plugins
export { auditPlugin } from "./audit";
export type { AuditPluginOptions } from "./audit";
export type { AuditEvent as PluginAuditEvent } from "./audit";

export { validationPlugin, ValidationError } from "./validation";
export type { ValidationPluginOptions } from "./validation";

export { cachePlugin } from "./cache";
export type { CachePluginOptions } from "./cache";

export { openApiPlugin } from "./openapi";
export type { OpenAPIOptions } from "./openapi";

// Plugin utilities
export { createCrudEndpoint } from "../endpoints/crud-endpoint";