import type { BetterQuery } from "better-query";
import type { AdminConfig, AdminContext, AdminResourceConfig } from "../types";

/**
 * Initialize Better Admin
 * Creates an admin panel configuration that wraps a Better Query instance
 */
export function betterAdmin<T extends BetterQuery = BetterQuery>(options: {
	/** Better Query instance */
	query: T;
	/** Admin resources configuration */
	resources: AdminResourceConfig[];
	/** Admin configuration */
	config?: AdminConfig;
}) {
	const { query, resources, config = {} } = options;

	// Create resource map
	const resourceMap = new Map<string, AdminResourceConfig>();
	for (const resource of resources) {
		resourceMap.set(resource.name, resource);
	}

	// Default configuration
	const defaultConfig: AdminConfig = {
		basePath: "/admin",
		title: "Admin Panel",
		theme: {
			defaultMode: "system",
			enableModeToggle: true,
		},
		navigation: {
			position: "left",
			collapsible: true,
			defaultCollapsed: false,
		},
		dashboard: {
			enabled: true,
		},
		...config,
	};

	// Create admin context
	const adminContext: AdminContext = {
		config: defaultConfig,
		resources: resourceMap,
		query,
	};

	/**
	 * Get a serializable version of the admin configuration
	 * This can be exposed to the client for UI generation
	 */
	const getSerializableConfig = () => {
		const serializableResources = Array.from(resourceMap.entries()).map(
			([name, resource]) => {
				// Remove non-serializable properties (functions, components)
				const {
					hooks,
					permissions,
					schema,
					endpoints,
					middlewares,
					customEndpoints,
					scopes,
					...serializableResource
				} = resource;

				// Keep only serializable field metadata
				const fieldMetadata = resource.fieldMetadata
					? Object.fromEntries(
							Object.entries(resource.fieldMetadata).map(([key, meta]) => {
								const { renderInput, renderDisplay, formatter, ...rest } = meta;
								return [key, rest];
							}),
						)
					: undefined;

				return [
					name,
					{
						...serializableResource,
						fieldMetadata,
					},
				];
			},
		);

		return {
			resources: new Map(serializableResources as any),
			config: defaultConfig,
		};
	};

	return {
		/** Admin context */
		context: adminContext,

		/** Get resource configuration */
		getResource: (name: string) => resourceMap.get(name),

		/** Get all resources */
		getResources: () => Array.from(resourceMap.values()),

		/** Get resources for menu */
		getMenuResources: () =>
			Array.from(resourceMap.values())
				.filter((r) => r.showInMenu !== false)
				.sort((a, b) => (a.menuOrder || 0) - (b.menuOrder || 0)),

		/** Get resource labels */
		getResourceLabel: (name: string, plural = false) => {
			const resource = resourceMap.get(name);
			if (!resource) return name;
			if (plural && resource.labelPlural) return resource.labelPlural;
			if (resource.label) return resource.label;
			// Capitalize first letter
			return name.charAt(0).toUpperCase() + name.slice(1);
		},

		/** Get resource route path */
		getResourcePath: (name: string) => {
			const resource = resourceMap.get(name);
			const basePath = defaultConfig.basePath || "/admin";
			const routePath = resource?.routePath || name;
			return `${basePath}/${routePath}`;
		},

		/** Check if operation is allowed */
		canPerform: async (
			resourceName: string,
			operation: "list" | "show" | "create" | "edit" | "delete",
			context: { user?: any; id?: string; data?: any },
		): Promise<boolean> => {
			const resource = resourceMap.get(resourceName);
			if (!resource) return false;

			// Check if endpoint is enabled
			if (resource.endpoints) {
				const endpointMap = {
					list: resource.endpoints.list,
					show: resource.endpoints.read,
					create: resource.endpoints.create,
					edit: resource.endpoints.update,
					delete: resource.endpoints.delete,
				};
				if (endpointMap[operation] === false) return false;
			}

			// Check permissions
			if (resource.permissions) {
				const permissionMap = {
					list: resource.permissions.list,
					show: resource.permissions.read,
					create: resource.permissions.create,
					edit: resource.permissions.update,
					delete: resource.permissions.delete,
				};
				const permissionFn = permissionMap[operation];
				if (permissionFn) {
					const permissionContext = {
						user: context.user,
						resource: resourceName,
						operation:
							operation === "show" ? ("read" as const) : (operation as any),
						data: context.data,
						id: context.id,
						request: null as any,
						adapter: null as any,
					};
					const allowed = await permissionFn(permissionContext);
					if (!allowed) return false;
				}
			}

			return true;
		},

		/** Get serializable configuration for client-side use */
		getSerializableConfig,

		/** Admin configuration */
		config: defaultConfig,
	};
}

/**
 * Helper to create admin resource from Query resource
 */
export function createAdminResource(
	config: AdminResourceConfig,
): AdminResourceConfig {
	return {
		// Default to showing in menu
		showInMenu: true,
		// Default menu order
		menuOrder: 0,
		...config,
	};
}
