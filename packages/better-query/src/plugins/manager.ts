import { CrudContext, CrudHookContext } from "../types";
import { Plugin, PluginHooks, PluginInitContext } from "../types/plugins";

/**
 * Plugin manager handles plugin registration, initialization, and lifecycle
 */
export class PluginManager {
	private plugins: Map<string, Plugin> = new Map();
	private globalHooks: PluginHooks = {};
	private initialized = false;

	/**
	 * Register a plugin
	 */
	registerPlugin(plugin: Plugin): void {
		if (this.plugins.has(plugin.id)) {
			throw new Error(`Plugin with id '${plugin.id}' is already registered`);
		}

		this.plugins.set(plugin.id, plugin);

		// Merge global hooks
		if (plugin.hooks) {
			this.mergeHooks(plugin.hooks);
		}
	}

	/**
	 * Register multiple plugins
	 */
	registerPlugins(plugins: Plugin[]): void {
		for (const plugin of plugins) {
			this.registerPlugin(plugin);
		}
	}

	/**
	 * Initialize all plugins
	 */
	async initializePlugins(context: PluginInitContext): Promise<void> {
		if (this.initialized) {
			return;
		}

		for (const [id, plugin] of this.plugins) {
			try {
				if (plugin.init) {
					await plugin.init(context);
				}
			} catch (error) {
				console.error(`Failed to initialize plugin '${id}':`, error);
				throw error;
			}
		}

		this.initialized = true;
	}

	/**
	 * Get all registered plugins
	 */
	getPlugins(): Plugin[] {
		return Array.from(this.plugins.values());
	}

	/**
	 * Get plugin by id
	 */
	getPlugin(id: string): Plugin | undefined {
		return this.plugins.get(id);
	}

	/**
	 * Get all plugin endpoints merged together
	 */
	getPluginEndpoints(): Record<string, any> {
		const endpoints: Record<string, any> = {};

		for (const plugin of this.plugins.values()) {
			if (plugin.endpoints) {
				Object.assign(endpoints, plugin.endpoints);
			}
		}

		return endpoints;
	}

	/**
	 * Get all plugin schemas merged together
	 */
	getPluginSchemas(): Record<string, any> {
		const schemas: Record<string, any> = {};

		for (const plugin of this.plugins.values()) {
			if (plugin.schema) {
				Object.assign(schemas, plugin.schema);
			}
		}

		return schemas;
	}

	/**
	 * Get all plugin resources
	 */
	getPluginResources() {
		const resources: any[] = [];

		for (const plugin of this.plugins.values()) {
			if (plugin.resources) {
				resources.push(...plugin.resources);
			}
		}

		return resources;
	}

	/**
	 * Get all plugin middleware
	 */
	getPluginMiddleware() {
		const middleware: any[] = [];

		for (const plugin of this.plugins.values()) {
			if (plugin.middleware) {
				middleware.push(...plugin.middleware);
			}
		}

		return middleware;
	}

	/**
	 * Execute a lifecycle hook
	 */
	async executeHook(
		hookName: keyof PluginHooks,
		context: CrudHookContext,
	): Promise<void> {
		const hook = this.globalHooks[hookName];
		if (hook) {
			try {
				await hook(context);
			} catch (error) {
				console.error(`Error executing ${hookName} hook:`, error);
				throw error;
			}
		}
	}

	/**
	 * Cleanup all plugins
	 */
	async destroy(): Promise<void> {
		for (const [id, plugin] of this.plugins) {
			try {
				if (plugin.destroy) {
					await plugin.destroy();
				}
			} catch (error) {
				console.error(`Failed to destroy plugin '${id}':`, error);
			}
		}

		this.plugins.clear();
		this.globalHooks = {};
		this.initialized = false;
	}

	/**
	 * Merge plugin hooks with global hooks
	 */
	private mergeHooks(pluginHooks: PluginHooks): void {
		for (const [hookName, hookFn] of Object.entries(pluginHooks)) {
			const existingHook = this.globalHooks[hookName as keyof PluginHooks];

			if (existingHook && hookFn) {
				// Chain hooks - execute existing first, then new
				const combinedHook = async (context: CrudHookContext) => {
					await existingHook(context);
					await hookFn(context);
				};
				(this.globalHooks as any)[hookName] = combinedHook;
			} else if (hookFn) {
				(this.globalHooks as any)[hookName] = hookFn;
			}
		}
	}
}

/**
 * Apply context shimming to plugin endpoints following better-auth pattern
 */
export function shimPluginContext<T extends Record<string, any>>(
	endpoints: T,
	context: Record<string, any>,
): T {
	const shimmedEndpoints: Record<string, any> = {};

	for (const [key, endpoint] of Object.entries(endpoints)) {
		shimmedEndpoints[key] = (ctx: Record<string, any>) => {
			return endpoint({
				...ctx,
				context: {
					...context,
					...ctx.context,
				},
			});
		};

		// Preserve endpoint metadata
		shimmedEndpoints[key].path = endpoint.path;
		shimmedEndpoints[key].method = endpoint.method;
		shimmedEndpoints[key].options = endpoint.options;
		shimmedEndpoints[key].headers = endpoint.headers;
	}

	return shimmedEndpoints as T;
}

/**
 * Create a simple plugin
 */
export function createPlugin(plugin: Plugin): Plugin {
	return plugin;
}

/**
 * Default plugin manager instance
 */
export const defaultPluginManager = new PluginManager();
