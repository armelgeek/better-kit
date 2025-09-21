import { BetterFetchOption } from "@better-fetch/fetch";
import { Plugin } from "./plugins";
import { BetterAuth } from "../auth";

/**
 * Plugin client configuration interface
 * Allows plugins to extend the main auth client with additional methods and configuration
 */
export interface PluginClientConfig {
	/**
	 * Additional client methods that the plugin provides
	 */
	methods?: Record<string, (...args: any[]) => any>;
	
	/**
	 * Plugin-specific client options
	 */
	options?: BetterFetchOption;
	
	/**
	 * Plugin identifier for namespacing
	 */
	id: string;
}

/**
 * Enhanced plugin interface that includes client configuration
 */
export interface PluginWithClient extends Plugin {
	/**
	 * Client configuration for this plugin
	 * This allows the plugin to extend the main auth client
	 */
	client?: PluginClientConfig;
}

/**
 * Type helper to extract client configuration from plugins
 */
export type InferPluginClients<T extends readonly Plugin[]> = {
	[K in T[number] as K extends PluginWithClient 
		? K["client"] extends PluginClientConfig 
			? K["client"]["id"] 
			: never 
		: never]: K extends PluginWithClient 
			? K["client"] extends PluginClientConfig 
				? K["client"]["methods"] 
				: never 
			: never;
};

/**
 * Type helper to merge plugin clients with main auth client
 */
export type WithPluginClients<
	Auth extends BetterAuth,
	Plugins extends readonly Plugin[] = []
> = Auth & InferPluginClients<Plugins>;