import { BetterFetchPlugin } from "@better-fetch/fetch";

/**
 * CRUD-specific client plugin interface extending BetterFetchPlugin
 * This allows for CRUD-specific functionality on the client side
 */
export interface CrudClientPlugin extends BetterFetchPlugin {
	/**
	 * CRUD-specific options for the plugin
	 */
	crudOptions?: {
		/**
		 * Resources this plugin should apply to
		 * If not specified, applies to all resources
		 */
		resources?: string[];
		
		/**
		 * Operations this plugin should intercept
		 * If not specified, applies to all operations
		 */
		operations?: ("create" | "read" | "update" | "delete" | "list")[];
		
		/**
		 * Enable/disable the plugin
		 */
		enabled?: boolean;
	};
}

/**
 * Plugin factory function type for creating CRUD client plugins
 */
export type CrudClientPluginFactory<T = any> = (options?: T) => CrudClientPlugin;

/**
 * Context passed to CRUD client plugin hooks
 */
export interface CrudClientContext {
	/**
	 * The resource name being accessed
	 */
	resource: string;
	
	/**
	 * The operation being performed
	 */
	operation: "create" | "read" | "update" | "delete" | "list";
	
	/**
	 * Additional metadata
	 */
	metadata?: Record<string, any>;
}