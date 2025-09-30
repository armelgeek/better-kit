import type { BetterFetchOption, BetterFetchPlugin } from "@better-fetch/fetch";
import type { Plugin } from "./plugins";

/**
 * Atom type for reactive state management
 * Using a generic type to avoid hard dependency on nanostores
 */
export interface Atom<T> {
	get(): T;
	set(value: T): void;
	subscribe(listener: (value: T) => void): () => void;
}

/**
 * Client plugin interface for better-query
 * Allows plugins to extend client functionality with custom methods, atoms, and endpoint configurations
 */
export interface BetterQueryClientPlugin {
	/** Unique plugin identifier - must match server plugin id */
	id: string;

	/**
	 * Infer server plugin type for endpoint type safety
	 * Usage: $InferServerPlugin: {} as ReturnType<typeof myServerPlugin>
	 */
	$InferServerPlugin?: Plugin;

	/**
	 * Custom actions/methods to add to the client
	 * @param $fetch - The fetch function from better-fetch
	 * @returns Object with custom methods
	 */
	getActions?: ($fetch: any) => Record<string, (...args: any[]) => Promise<any>>;

	/**
	 * Nanostores atoms for reactive state management
	 * @param $fetch - The fetch function from better-fetch
	 * @returns Object with nanostore atoms
	 */
	getAtoms?: ($fetch: any) => Record<string, Atom<any>>;

	/**
	 * Override HTTP methods for inferred endpoint paths
	 * By default, endpoints without body use GET, with body use POST
	 * Key: endpoint path (e.g., "/my-plugin/hello-world")
	 * Value: HTTP method ("GET" | "POST")
	 */
	pathMethods?: Record<string, "GET" | "POST">;

	/**
	 * Better-fetch plugins to apply to plugin requests
	 */
	fetchPlugins?: BetterFetchPlugin[];

	/**
	 * Atom state listeners for reactive updates
	 * @param atoms - The atoms returned from getAtoms
	 * @param $fetch - The fetch function from better-fetch
	 */
	atomListeners?: (atoms: Record<string, Atom<any>>, $fetch: any) => void;
}

/**
 * Extract inferred endpoints from a server plugin
 */
export type InferPluginEndpoints<T extends Plugin> = T extends {
	endpoints: infer E;
}
	? E
	: never;

/**
 * Convert kebab-case path to camelCase object path
 * Example: "/my-plugin/hello-world" -> "myPlugin.helloWorld"
 */
export type PathToCamelCase<T extends string> = T extends `/${infer First}/${infer Rest}`
	? `${CamelCase<First>}.${PathToCamelCase<`/${Rest}`>}`
	: T extends `/${infer Single}`
		? CamelCase<Single>
		: never;

type CamelCase<S extends string> = S extends `${infer P1}-${infer P2}${infer P3}`
	? `${Lowercase<P1>}${Uppercase<P2>}${CamelCase<P3>}`
	: Lowercase<S>;

/**
 * Infer client methods from plugin endpoints
 */
export type InferClientMethods<T extends BetterQueryClientPlugin> =
	T["getActions"] extends (...args: any[]) => infer R ? R : {};

/**
 * Infer client atoms from plugin
 */
export type InferClientAtoms<T extends BetterQueryClientPlugin> = T["getAtoms"] extends (
	...args: any[]
) => infer R
	? R
	: {};
