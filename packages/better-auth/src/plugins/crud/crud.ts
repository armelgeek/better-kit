import { CrudOptions, CrudPlugin, CrudResourceConfig } from "./types";
import { createCrudEndpoints } from "./endpoints";
import { FieldAttribute } from "../../db/field";
import { shimContext } from "../../utils/shim";

/**
 * Creates a CRUD plugin that automatically generates endpoints for multiple resources
 */
export function crud(options: CrudOptions): CrudPlugin {
	const { resources, basePath = "", requireAuth = false } = options;
	
	// Generate endpoints for all resources
	const allEndpoints: Record<string, any> = {};
	const schema: Record<string, { fields: Record<string, FieldAttribute> }> = {};

	for (const resourceConfig of resources) {
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
	const processedEndpoints = basePath 
		? applyBasePath(allEndpoints, basePath)
		: allEndpoints;

	// Apply context shimming (following BetterAuth pattern)
	const api = shimContext(processedEndpoints, {
		crudOptions: options,
	});

	return {
		id: "crud",
		endpoints: api,
		schema,
	};
}

/**
 * Helper function to convert Zod schema to database field attributes
 */
function zodSchemaToFields(zodSchema: any): Record<string, FieldAttribute> {
	const fields: Record<string, FieldAttribute> = {};
	
	// This is a simplified implementation
	// In a real scenario, you'd need more sophisticated Zod schema introspection
	const shape = zodSchema._def?.shape || {};
	
	for (const [fieldName, fieldDef] of Object.entries(shape as any)) {
		fields[fieldName] = inferFieldAttribute(fieldDef);
	}
	
	return fields;
}

/**
 * Infer field attributes from Zod field definition
 */
function inferFieldAttribute(fieldDef: any): FieldAttribute {
	// Extract the base type
	let typeName = fieldDef._def?.typeName;
	
	// Handle ZodOptional and ZodDefault wrappers
	if (typeName === "ZodOptional" || typeName === "ZodDefault") {
		fieldDef = fieldDef._def.innerType;
		typeName = fieldDef._def?.typeName;
	}

	// Map Zod types to field attributes
	switch (typeName) {
		case "ZodString":
			return { type: "string", required: !fieldDef.isOptional() };
		case "ZodNumber":
			return { type: "number", required: !fieldDef.isOptional() };
		case "ZodBoolean":
			return { type: "boolean", required: !fieldDef.isOptional() };
		case "ZodDate":
			return { type: "date", required: !fieldDef.isOptional() };
		case "ZodArray":
			return { type: "string", required: !fieldDef.isOptional() }; // JSON string for arrays
		case "ZodObject":
			return { type: "string", required: !fieldDef.isOptional() }; // JSON string for objects
		case "ZodEnum":
			return { type: "string", required: !fieldDef.isOptional() };
		default:
			return { type: "string", required: false };
	}
}

/**
 * Apply base path to all endpoint paths
 */
function applyBasePath(endpoints: Record<string, any>, basePath: string): Record<string, any> {
	const processedEndpoints: Record<string, any> = {};
	
	for (const [key, endpoint] of Object.entries(endpoints)) {
		if (endpoint && typeof endpoint === 'object' && endpoint.path) {
			processedEndpoints[key] = {
				...endpoint,
				path: `${basePath}${endpoint.path}`,
			};
		} else {
			processedEndpoints[key] = endpoint;
		}
	}
	
	return processedEndpoints;
}

/**
 * Create a simple resource configuration
 */
export function createResource(config: CrudResourceConfig): CrudResourceConfig {
	return {
		endpoints: {
			create: true,
			read: true,
			update: true,
			delete: true,
			list: true,
		},
		...config,
	};
}