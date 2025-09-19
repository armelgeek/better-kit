import { createRouter } from "better-call";
import {
	KyselyCrudAdapter,
	createKyselyDatabase,
	generateCreateTableSQL,
} from "./adapters/kysely";
import { createCrudEndpoints } from "./endpoints";
import { CrudContext, CrudOptions } from "./types";
import { zodSchemaToFields } from "./utils/schema";

/**
 * Initialize CRUD context similar to better-auth's init function
 */
function initCrud(options: CrudOptions): CrudContext {
	const db = createKyselyDatabase(options.database);
	const adapter = new KyselyCrudAdapter(db);

	return {
		db,
		adapter,
		options,
	};
}

/**
 * Main CRUD factory function - similar to betterAuth()
 */
export function betterCrud<O extends CrudOptions>(options: O) {
	const crudContext = initCrud(options);

	// Generate endpoints for all resources
	const allEndpoints: Record<string, any> = {};
	const schema: Record<string, { fields: Record<string, any> }> = {};

	for (const resourceConfig of options.resources) {
		// Generate CRUD endpoints for this resource
		const resourceEndpoints = createCrudEndpoints(resourceConfig);

		// Add to combined endpoints
		Object.assign(allEndpoints, resourceEndpoints);

		// Generate schema fields from Zod schema
		schema[resourceConfig.name] = {
			fields: zodSchemaToFields(resourceConfig.schema),
		};
	}

	// Apply base path if specified
	let processedEndpoints = allEndpoints;
	if (options.basePath) {
		processedEndpoints = applyBasePath(allEndpoints, options.basePath);
	}

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

	// Create router using better-call
	const { handler, endpoints } = createRouter(api, {
		extraContext: crudContext,
		basePath: options.basePath,
		onError(e) {
			console.error("CRUD Error:", e);
		},
	});

	// Auto-migrate tables if enabled
	if (options.database.autoMigrate) {
		initTables(crudContext, schema).catch(console.error);
	}

	type Endpoint = typeof endpoints;

	return {
		handler,
		api: endpoints as Endpoint,
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
		for (const [resourceName, resourceSchema] of Object.entries(schema)) {
			const tableName = resourceName;
			const fields = resourceSchema.fields;

			// Generate and execute CREATE TABLE SQL
			const createTableSQL = generateCreateTableSQL(
				tableName,
				fields,
				context.options.database.provider,
			);

			// Execute the SQL using Kysely's raw query
			await context.db.schema.raw(createTableSQL).execute();
		}
	} catch (error) {
		console.error("Error initializing tables:", error);
	}
}

export type BetterCrud<
	O extends CrudOptions = CrudOptions,
	Endpoints extends Record<string, any> = Record<string, any>,
> = {
	handler: (request: Request) => Promise<Response>;
	api: Endpoints;
	options: O;
	context: CrudContext;
	schema: Record<string, { fields: Record<string, any> }>;
};
