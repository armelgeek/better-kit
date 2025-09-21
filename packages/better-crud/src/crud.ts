import { createRouter } from "better-call";
import { sql } from "kysely";
import { getCrudAdapter } from "./adapters/utils";
import { createCrudEndpoints } from "./endpoints";
import { CrudContext, CrudOptions } from "./types";
import { zodSchemaToFields } from "./utils/schema";
import { RelationshipManager } from "./utils/relationships";
import { PluginManager, shimPluginContext } from "./plugins/manager";
import { PluginInitContext } from "./types/plugins";
import type { UnionToIntersection } from "type-fest";

/**
 * Initialize CRUD context similar to better-auth's init function
 */
function initCrud(options: CrudOptions): CrudContext {
	const adapter = getCrudAdapter(options);

	// Initialize relationship and schema registries
	const relationships = new Map();
	const schemas = new Map();

	// Initialize plugin manager
	const pluginManager = new PluginManager();

	const context: CrudContext = {
		db: null, // For backward compatibility, we keep this but it's not used with the adapter pattern
		adapter,
		options,
		relationships,
		schemas,
		pluginManager,
	};

	// Create relationship manager and attach to adapter if it's a Kysely adapter
	const relationshipManager = new RelationshipManager(context);
	if ('setRelationshipManager' in adapter) {
		(adapter as any).setRelationshipManager(relationshipManager);
	}

	return context;
}

/**
 * Main CRUD factory function - similar to betterAuth()
 */
export function adiemus<O extends CrudOptions>(options: O) {
	const crudContext = initCrud(options);

	// Register plugins
	if (options.plugins) {
		crudContext.pluginManager!.registerPlugins(options.plugins);
	}

	// Collect all resources (original + plugin resources)
	const allResources = [...options.resources];
	const pluginResources = crudContext.pluginManager!.getPluginResources();
	allResources.push(...pluginResources);

	// Generate endpoints for all resources
	const allEndpoints: Record<string, any> = {};
	const schema: Record<string, { fields: Record<string, any> }> = {};

	for (const resourceConfig of allResources) {
		// Register relationships
		if (resourceConfig.relationships) {
			const relationshipManager = new RelationshipManager(crudContext);
			relationshipManager.registerRelationships(resourceConfig.name, resourceConfig.relationships);
		}

		// Generate CRUD endpoints for this resource
		const resourceEndpoints = createCrudEndpoints(resourceConfig);

		// Add to combined endpoints
		Object.assign(allEndpoints, resourceEndpoints);

		// Generate schema fields from Zod schema and store in context
		const resourceSchema = {
			fields: zodSchemaToFields(resourceConfig.schema),
		};
		schema[resourceConfig.name] = resourceSchema;
		crudContext.schemas.set(resourceConfig.name, resourceSchema);
	}

	// Add plugin endpoints
	const pluginEndpoints = crudContext.pluginManager!.getPluginEndpoints();
	Object.assign(allEndpoints, pluginEndpoints);

	// Add plugin schemas
	const pluginSchemas = crudContext.pluginManager!.getPluginSchemas();
	Object.assign(schema, pluginSchemas);

	// Validate all relationships after all resources are registered
	const relationshipManager = new RelationshipManager(crudContext);
	for (const resourceConfig of allResources) {
		if (resourceConfig.relationships) {
			for (const [relationName, relationConfig] of Object.entries(resourceConfig.relationships)) {
				const errors = relationshipManager.validateRelationship(
					resourceConfig.name,
					relationName,
					relationConfig
				);
				if (errors.length > 0) {
					console.warn(`Relationship validation errors for ${resourceConfig.name}.${relationName}:`, errors);
				}
			}
		}
	}

	// Apply base path if specified
	let processedEndpoints = allEndpoints;
	// Note: basePath should NOT be applied to endpoint paths
	// The router will handle path matching by stripping the basePath

	// Create API with context shimming (following BetterAuth pattern)
	const api: Record<string, any> = {};
	for (const [key, value] of Object.entries(processedEndpoints)) {
		api[key] = (context: any) => {
			return value({
				...context,
				context: {
					...crudContext,
					...context.context,
				},
			});
		};
		api[key].path = value.path;
		api[key].method = value.method;
		api[key].options = value.options;
		api[key].headers = value.headers;
	}

	// Initialize plugins
	const pluginInitContext: PluginInitContext = {
		resources: new Map(allResources.map(r => [r.name, r])),
		schemas: crudContext.schemas,
		relationships: crudContext.relationships,
		adapter: crudContext.adapter,
		options: options,
	};

	// Initialize plugins asynchronously
	crudContext.pluginManager!.initializePlugins(pluginInitContext).catch(console.error);

	// Create router using better-call
	const { handler, endpoints } = createRouter(api, {
		extraContext: crudContext,
		basePath: options.basePath,
		onError(e) {
			console.error("CRUD Error:", e);
		},
	});

	// Auto-migrate tables if enabled
	const shouldAutoMigrate = "autoMigrate" in options.database ? options.database.autoMigrate : false;
	if (shouldAutoMigrate) {
		initTables(crudContext, schema).catch(console.error);
	}

	// Type inference for plugin endpoints
	type PluginEndpoint = UnionToIntersection<
		O["plugins"] extends Array<infer T>
			? T extends { endpoints: infer E }
				? E
				: Record<string, never>
			: Record<string, never>
	>;

	type Endpoint = typeof endpoints;

	return {
		handler,
		api: endpoints as Endpoint & PluginEndpoint,
		options,
		context: crudContext,
		schema,
	};
}

/**
 * Apply base path to all endpoint paths
 */
function applyBasePath(
	endpoints: Record<string, any>,
	basePath: string,
): Record<string, any> {
	const processedEndpoints: Record<string, any> = {};

	for (const [key, endpoint] of Object.entries(endpoints)) {
		processedEndpoints[key] = {
			...endpoint,
			path: `${basePath}${endpoint.path}`,
		};
	}

	return processedEndpoints;
}

/**
 * Initialize database tables for auto-migration
 */
async function initTables(
	context: CrudContext,
	schema: Record<string, { fields: Record<string, any> }>,
) {
	try {
		// Prepare schema data for the adapter
		const schemaData = Object.entries(schema).map(([resourceName, resourceSchema]) => ({
			model: resourceName,
			fields: resourceSchema.fields,
		}));

		// Use adapter's createSchema method if available
		if (context.adapter.createSchema) {
			await context.adapter.createSchema(schemaData);
		} else {
			// Fallback for adapters that don't support createSchema
			console.warn("Adapter does not support createSchema method. Auto-migration skipped.");
		}
	} catch (error) {
		console.error("Error initializing tables:", error);
	}
}

export type BetterCrud<
	O extends CrudOptions = CrudOptions,
	Endpoints extends Record<string, any> = Record<string, any>,
	PluginEndpoints extends Record<string, any> = UnionToIntersection<
		O["plugins"] extends Array<infer T>
			? T extends { endpoints: infer E }
				? E
				: Record<string, never>
			: Record<string, never>
	>,
> = {
	handler: (request: Request) => Promise<Response>;
	api: Endpoints & PluginEndpoints;
	options: O;
	context: CrudContext;
	schema: Record<string, { fields: Record<string, any> }>;
};

// Alias for the new package name
export type Adiemus<
	O extends CrudOptions = CrudOptions,
	Endpoints extends Record<string, any> = Record<string, any>,
	PluginEndpoints extends Record<string, any> = UnionToIntersection<
		O["plugins"] extends Array<infer T>
			? T extends { endpoints: infer E }
				? E
				: Record<string, never>
			: Record<string, never>
	>,
> = BetterCrud<O, Endpoints, PluginEndpoints>;
