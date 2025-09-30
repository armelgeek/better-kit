import { createRouter } from "better-call";
import { sql } from "kysely";
import type { UnionToIntersection } from "type-fest";
import { getQueryAdapter } from "./adapters/utils";
import { createQueryEndpoints } from "./endpoints";
import { PluginManager, shimPluginContext } from "./plugins/manager";
import { QueryContext, QueryOptions } from "./types";
import { PluginInitContext } from "./types/plugins";
import { RelationshipManager } from "./utils/relationships";
import { zodSchemaToFields } from "./utils/schema";

/**
 * Initialize Query context similar to better-auth's init function
 */
function initQuery(options: QueryOptions): QueryContext {
	const adapter = getQueryAdapter(options);

	// Initialize relationship and schema registries
	const relationships = new Map();
	const schemas = new Map();

	// Initialize plugin manager
	const pluginManager = new PluginManager();

	const context: QueryContext = {
		db: null, // For backward compatibility, we keep this but it's not used with the adapter pattern
		adapter,
		options,
		relationships,
		schemas,
		pluginManager,
	};

	// Create relationship manager and attach to adapter if it's a Kysely adapter
	const relationshipManager = new RelationshipManager(context);
	if ("setRelationshipManager" in adapter) {
		(adapter as any).setRelationshipManager(relationshipManager);
	}

	return context;
}

/**
 * Main Query factory function - similar to betterAuth()
 */
export function betterQuery<O extends QueryOptions>(options: O) {
	const queryContext = initQuery(options);

	// Register plugins
	if (options.plugins) {
		queryContext.pluginManager!.registerPlugins(options.plugins);
	}

	// Collect all resources (original + plugin resources)
	const allResources = [...options.resources];
	const pluginResources = queryContext.pluginManager!.getPluginResources();
	allResources.push(...pluginResources);

	// Generate endpoints for all resources
	const allEndpoints: Record<string, any> = {};
	const schema: Record<string, { fields: Record<string, any> }> = {};

	for (const resourceConfig of allResources) {
		// Register relationships
		if (resourceConfig.relationships) {
			const relationshipManager = new RelationshipManager(queryContext);
			relationshipManager.registerRelationships(
				resourceConfig.name,
				resourceConfig.relationships,
			);
		}

		// Generate Query endpoints for this resource
		const resourceEndpoints = createQueryEndpoints(resourceConfig);

		// Add to combined endpoints
		Object.assign(allEndpoints, resourceEndpoints);

		// Generate schema fields from Zod schema and store in context
		const resourceSchema = {
			fields: zodSchemaToFields(resourceConfig.schema),
		};
		schema[resourceConfig.name] = resourceSchema;
		queryContext.schemas.set(resourceConfig.name, resourceSchema);
	}

	// Add plugin endpoints
	const pluginEndpoints = queryContext.pluginManager!.getPluginEndpoints();
	Object.assign(allEndpoints, pluginEndpoints);

	// Add plugin schemas
	const pluginSchemas = queryContext.pluginManager!.getPluginSchemas();
	Object.assign(schema, pluginSchemas);

	// Validate all relationships after all resources are registered
	const relationshipManager = new RelationshipManager(queryContext);
	for (const resourceConfig of allResources) {
		if (resourceConfig.relationships) {
			for (const [relationName, relationConfig] of Object.entries(
				resourceConfig.relationships,
			)) {
				const errors = relationshipManager.validateRelationship(
					resourceConfig.name,
					relationName,
					relationConfig,
				);
				if (errors.length > 0) {
					console.warn(
						`Relationship validation errors for ${resourceConfig.name}.${relationName}:`,
						errors,
					);
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
					...queryContext,
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
		resources: new Map(allResources.map((r) => [r.name, r])),
		schemas: queryContext.schemas,
		relationships: queryContext.relationships,
		adapter: queryContext.adapter,
		options: options,
	};

	// Initialize plugins asynchronously
	queryContext
		.pluginManager!.initializePlugins(pluginInitContext)
		.catch(console.error);

	// Create router using better-call
	const { handler, endpoints } = createRouter(api, {
		extraContext: queryContext,
		basePath: options.basePath,
		onError(e) {
			console.error("Query Error:", e);
		},
	});

	// Auto-migrate tables if enabled
	const shouldAutoMigrate =
		"autoMigrate" in options.database ? options.database.autoMigrate : false;
	if (shouldAutoMigrate) {
		initTables(queryContext, schema).catch(console.error);
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
		context: queryContext,
		schema,
		// Custom operations support
		customOperation: async (operationName: string, params: any) => {
			if (!queryContext.adapter.executeCustomOperation) {
				throw new Error(`Adapter does not support custom operations`);
			}
			return await queryContext.adapter.executeCustomOperation(
				operationName,
				params,
				queryContext,
			);
		},
		// Get available custom operations
		getCustomOperations: () => {
			return queryContext.adapter.customOperations || {};
		},
		// Check if custom operation exists
		hasCustomOperation: (operationName: string) => {
			return !!(
				queryContext.adapter.customOperations &&
				queryContext.adapter.customOperations[operationName]
			);
		},
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
	context: QueryContext,
	schema: Record<string, { fields: Record<string, any> }>,
) {
	try {
		// Prepare schema data for the adapter
		const schemaData = Object.entries(schema).map(
			([resourceName, resourceSchema]) => ({
				model: resourceName,
				fields: resourceSchema.fields,
			}),
		);

		// Use adapter's createSchema method if available
		if (context.adapter.createSchema) {
			await context.adapter.createSchema(schemaData);
		} else {
			// Fallback for adapters that don't support createSchema
			console.warn(
				"Adapter does not support createSchema method. Auto-migration skipped.",
			);
		}
	} catch (error) {
		console.error("Error initializing tables:", error);
	}
}

export type BetterQuery<
	O extends QueryOptions = QueryOptions,
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
	context: QueryContext;
	schema: Record<string, { fields: Record<string, any> }>;
	/** Execute a custom operation defined in the adapter */
	customOperation: (operationName: string, params: any) => Promise<any>;
	/** Get all available custom operations from the adapter */
	getCustomOperations: () => Record<
		string,
		(params: any, context?: any) => Promise<any>
	>;
	/** Check if a custom operation exists */
	hasCustomOperation: (operationName: string) => boolean;
};

// Legacy alias for backward compatibility
export type BetterCrud<
	O extends QueryOptions = QueryOptions,
	Endpoints extends Record<string, any> = Record<string, any>,
	PluginEndpoints extends Record<string, any> = UnionToIntersection<
		O["plugins"] extends Array<infer T>
			? T extends { endpoints: infer E }
				? E
				: Record<string, never>
			: Record<string, never>
	>,
> = BetterQuery<O, Endpoints, PluginEndpoints>;

// Legacy alias for the old package name
export type Adiemus<
	O extends QueryOptions = QueryOptions,
	Endpoints extends Record<string, any> = Record<string, any>,
	PluginEndpoints extends Record<string, any> = UnionToIntersection<
		O["plugins"] extends Array<infer T>
			? T extends { endpoints: infer E }
				? E
				: Record<string, never>
			: Record<string, never>
	>,
> = BetterQuery<O, Endpoints, PluginEndpoints>;
