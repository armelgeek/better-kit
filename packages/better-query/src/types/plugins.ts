import { Endpoint } from "better-call";
import { ZodSchema } from "zod";
import { FieldAttribute } from "./index";
import { CrudResourceConfig, CrudMiddleware, CrudHookContext } from "./index";

export type LiteralString = string;

/**
 * Plugin schema definition - allows plugins to extend database schemas
 */
export type PluginSchema = {
	[table: string]: {
		fields: {
			[field in string]: FieldAttribute;
		};
		disableMigration?: boolean;
	};
};

/**
 * Plugin hook definitions - lifecycle hooks that plugins can provide
 */
export interface PluginHooks {
	beforeCreate?: (context: CrudHookContext) => Promise<void> | void;
	afterCreate?: (context: CrudHookContext) => Promise<void> | void;
	beforeUpdate?: (context: CrudHookContext) => Promise<void> | void;
	afterUpdate?: (context: CrudHookContext) => Promise<void> | void;
	beforeDelete?: (context: CrudHookContext) => Promise<void> | void;
	afterDelete?: (context: CrudHookContext) => Promise<void> | void;
	beforeList?: (context: CrudHookContext) => Promise<void> | void;
	afterList?: (context: CrudHookContext) => Promise<void> | void;
	beforeRead?: (context: CrudHookContext) => Promise<void> | void;
	afterRead?: (context: CrudHookContext) => Promise<void> | void;
}

/**
 * Core plugin interface - all plugins must implement this
 */
export interface Plugin {
	/** Unique plugin identifier */
	id: LiteralString;
	
	/** Additional endpoints the plugin provides */
	endpoints?: {
		[key: string]: Endpoint<any>;
	};
	
	/** 
	 * Database schema extensions the plugin needs
	 * This will also be used for auto-migration if enabled
	 */
	schema?: PluginSchema;
	
	/**
	 * Resources the plugin wants to register
	 * This allows plugins to add entirely new CRUD resources
	 */
	resources?: CrudResourceConfig[];
	
	/**
	 * Global middleware the plugin wants to apply
	 */
	middleware?: CrudMiddleware[];
	
	/**
	 * Global hooks the plugin provides
	 */
	hooks?: PluginHooks;
	
	/**
	 * Plugin configuration/options
	 */
	options?: Record<string, any>;
	
	/**
	 * Plugin initialization function called when betterCrud is created
	 */
	init?: (context: PluginInitContext) => Promise<void> | void;
	
	/**
	 * Plugin cleanup function
	 */
	destroy?: () => Promise<void> | void;
}

/**
 * Context provided to plugin init function
 */
export interface PluginInitContext {
	/** All resources (including from other plugins) */
	resources: Map<string, CrudResourceConfig>;
	/** Schema registry */
	schemas: Map<string, { fields: Record<string, FieldAttribute> }>;
	/** Relationship registry */
	relationships: Map<string, any>;
	/** Database adapter */
	adapter: any;
	/** Plugin options */
	options: any;
}

/**
 * Plugin factory function type
 */
export type PluginFactory<T = any> = (options?: T) => Plugin;

/**
 * OpenAPI extension interface for plugins
 */
export interface PluginOpenAPI {
	/** Additional OpenAPI paths */
	paths?: Record<string, any>;
	/** Additional OpenAPI components */
	components?: Record<string, any>;
	/** Additional OpenAPI tags */
	tags?: Array<{ name: string; description?: string }>;
}

/**
 * Enhanced plugin interface with OpenAPI support
 */
export interface ExtendedPlugin extends Plugin {
	/** OpenAPI documentation extensions */
	openapi?: PluginOpenAPI;
}