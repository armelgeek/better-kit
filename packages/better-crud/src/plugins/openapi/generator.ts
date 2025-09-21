import type { CrudContext } from "../../types";
import { ZodSchema, ZodObject, ZodType, ZodOptional } from "zod";

export interface OpenAPIPath {
	get?: {
		tags?: string[];
		operationId?: string;
		description?: string;
		security?: [{ bearerAuth: string[] }];
		parameters?: Array<{
			name: string;
			in: "query" | "path" | "header";
			schema: {
				type?: "string" | "number" | "boolean" | "array" | "object";
				format?: string;
			};
			required?: boolean;
		}>;
		responses?: {
			[key in string]: {
				description?: string;
				content: {
					"application/json": {
						schema: any;
					};
				};
			};
		};
	};
	post?: {
		tags?: string[];
		operationId?: string;
		description?: string;
		security?: [{ bearerAuth: string[] }];
		parameters?: Array<{
			name: string;
			in: "query" | "path" | "header";
			schema: {
				type?: "string" | "number" | "boolean" | "array" | "object";
			};
			required?: boolean;
		}>;
		requestBody?: {
			content: {
				"application/json": {
					schema: any;
				};
			};
		};
		responses?: {
			[key in string]: {
				description?: string;
				content: {
					"application/json": {
						schema: any;
					};
				};
			};
		};
	};
	put?: {
		tags?: string[];
		operationId?: string;
		description?: string;
		security?: [{ bearerAuth: string[] }];
		parameters?: Array<{
			name: string;
			in: "query" | "path" | "header";
			schema: {
				type?: "string" | "number" | "boolean" | "array" | "object";
			};
			required?: boolean;
		}>;
		requestBody?: {
			content: {
				"application/json": {
					schema: any;
				};
			};
		};
		responses?: {
			[key in string]: {
				description?: string;
				content: {
					"application/json": {
						schema: any;
					};
				};
			};
		};
	};
	delete?: {
		tags?: string[];
		operationId?: string;
		description?: string;
		security?: [{ bearerAuth: string[] }];
		parameters?: Array<{
			name: string;
			in: "query" | "path" | "header";
			schema: {
				type?: "string" | "number" | "boolean" | "array" | "object";
			};
			required?: boolean;
		}>;
		responses?: {
			[key in string]: {
				description?: string;
				content: {
					"application/json": {
						schema: any;
					};
				};
			};
		};
	};
}

type AllowedType = "string" | "number" | "boolean" | "array" | "object";

function processZodType(zodType: ZodType<any>): any {
	// Handle optional types
	if (zodType instanceof ZodOptional) {
		const innerType = (zodType as any)._def.innerType;
		const innerSchema = processZodType(innerType);
		return {
			...innerSchema,
			nullable: true,
		};
	}

	// Handle object types
	if (zodType instanceof ZodObject) {
		const shape = (zodType as any).shape;
		if (shape) {
			const properties: Record<string, any> = {};
			const required: string[] = [];
			Object.entries(shape).forEach(([key, value]) => {
				if (value instanceof ZodType) {
					properties[key] = processZodType(value as ZodType<any>);
					if (!(value instanceof ZodOptional)) {
						required.push(key);
					}
				}
			});
			return {
				type: "object",
				properties,
				...(required.length > 0 ? { required } : {}),
				description: (zodType as any).description,
			};
		}
	}

	// For primitive types, get the type from ZodType
	const type = getTypeFromZodType(zodType);
	return {
		type,
		description: (zodType as any).description,
	};
}

function getTypeFromZodType(zodType: ZodType<any>): AllowedType {
	const typeName = (zodType as any)._def?.typeName;
	
	switch (typeName) {
		case "ZodString":
			return "string";
		case "ZodNumber":
			return "number";
		case "ZodBoolean":
			return "boolean";
		case "ZodArray":
			return "array";
		case "ZodObject":
			return "object";
		case "ZodRecord":
			return "object";
		case "ZodEnum":
			return "string";
		case "ZodUnion":
			return "string"; // Default for unions
		case "ZodLiteral":
			return "string";
		default:
			return "string";
	}
}

function getStandardResponses(): any {
	return {
		"400": {
			description: "Bad Request - Invalid parameters or request body",
			content: {
				"application/json": {
					schema: {
						type: "object" as const,
						properties: {
							error: { type: "string" as const },
							message: { type: "string" as const },
						},
						required: ["error", "message"],
					},
				},
			},
		},
		"401": {
			description: "Unauthorized - Authentication required",
			content: {
				"application/json": {
					schema: {
						type: "object" as const,
						properties: {
							error: { type: "string" as const },
							message: { type: "string" as const },
						},
						required: ["error", "message"],
					},
				},
			},
		},
		"403": {
			description: "Forbidden - Insufficient permissions",
			content: {
				"application/json": {
					schema: {
						type: "object" as const,
						properties: {
							error: { type: "string" as const },
							message: { type: "string" as const },
						},
						required: ["error", "message"],
					},
				},
			},
		},
		"404": {
			description: "Not Found - Resource not found",
			content: {
				"application/json": {
					schema: {
						type: "object" as const,
						properties: {
							error: { type: "string" as const },
							message: { type: "string" as const },
						},
						required: ["error", "message"],
					},
				},
			},
		},
		"500": {
			description: "Internal Server Error",
			content: {
				"application/json": {
					schema: {
						type: "object" as const,
						properties: {
							error: { type: "string" as const },
							message: { type: "string" as const },
						},
						required: ["error", "message"],
					},
				},
			},
		},
	};
}

function generateResourceSchema(resourceName: string, schema: ZodSchema): any {
	const processedSchema = processZodType(schema);
	return {
		type: "object",
		properties: {
			id: { type: "string", description: "Unique identifier" },
			...processedSchema.properties,
			createdAt: { type: "string", format: "date-time", description: "Creation timestamp" },
			updatedAt: { type: "string", format: "date-time", description: "Last update timestamp" },
		},
		required: ["id", ...(processedSchema.required || [])],
	};
}

function generatePaginatedResponse(resourceSchema: any): any {
	return {
		type: "object",
		properties: {
			data: {
				type: "array",
				items: resourceSchema,
			},
			pagination: {
				type: "object",
				properties: {
					page: { type: "number", description: "Current page number" },
					limit: { type: "number", description: "Items per page" },
					total: { type: "number", description: "Total number of items" },
					totalPages: { type: "number", description: "Total number of pages" },
				},
				required: ["page", "limit", "total", "totalPages"],
			},
		},
		required: ["data", "pagination"],
	};
}

export async function generator(context: CrudContext): Promise<any> {
	const { options } = context;
	const paths: Record<string, OpenAPIPath> = {};
	const components: Record<string, any> = {
		schemas: {},
	};

	// Generate schemas and paths for each resource
	for (const resource of options.resources) {
		const resourceName = resource.name;
		const capitalizedName = resourceName.charAt(0).toUpperCase() + resourceName.slice(1);
		
		// Generate schema for the resource
		const resourceSchema = generateResourceSchema(resourceName, resource.schema);
		components.schemas[capitalizedName] = resourceSchema;

		// Generate paginated list response schema
		components.schemas[`${capitalizedName}List`] = generatePaginatedResponse({
			$ref: `#/components/schemas/${capitalizedName}`,
		});

		// Generate input schema for create/update operations
		const inputSchema = processZodType(resource.schema);
		components.schemas[`${capitalizedName}Input`] = {
			type: "object",
			properties: inputSchema.properties,
			required: inputSchema.required,
		};

		// Generate CRUD endpoints
		const basePath = `/${resourceName}`;
		const itemPath = `/${resourceName}/{id}`;

		// LIST endpoint
		if (resource.endpoints?.list !== false) {
			paths[basePath] = {
				get: {
					tags: [capitalizedName],
					operationId: `list${capitalizedName}s`,
					description: `List all ${resourceName} items with pagination`,
					parameters: [
						{
							name: "page",
							in: "query",
							schema: { type: "number" },
						},
						{
							name: "limit",
							in: "query",
							schema: { type: "number" },
						},
						{
							name: "search",
							in: "query",
							schema: { type: "string" },
						},
						{
							name: "include",
							in: "query",
							schema: { type: "string" },
						},
					],
					responses: {
						"200": {
							description: `List of ${resourceName} items`,
							content: {
								"application/json": {
									schema: {
										$ref: `#/components/schemas/${capitalizedName}List`,
									},
								},
							},
						},
						...getStandardResponses(),
					},
				},
			};
		}

		// CREATE endpoint
		if (resource.endpoints?.create !== false) {
			paths[basePath] = {
				...paths[basePath],
				post: {
					tags: [capitalizedName],
					operationId: `create${capitalizedName}`,
					description: `Create a new ${resourceName}`,
					requestBody: {
						content: {
							"application/json": {
								schema: {
									$ref: `#/components/schemas/${capitalizedName}Input`,
								},
							},
						},
					},
					responses: {
						"201": {
							description: `Created ${resourceName}`,
							content: {
								"application/json": {
									schema: {
										$ref: `#/components/schemas/${capitalizedName}`,
									},
								},
							},
						},
						...getStandardResponses(),
					},
				},
			};
		}

		// READ endpoint
		if (resource.endpoints?.read !== false) {
			paths[itemPath] = {
				get: {
					tags: [capitalizedName],
					operationId: `get${capitalizedName}`,
					description: `Get a ${resourceName} by ID`,
					parameters: [
						{
							name: "id",
							in: "path",
							schema: { type: "string" },
							required: true,
						},
						{
							name: "include",
							in: "query",
							schema: { type: "string" },
						},
					],
					responses: {
						"200": {
							description: `${capitalizedName} details`,
							content: {
								"application/json": {
									schema: {
										$ref: `#/components/schemas/${capitalizedName}`,
									},
								},
							},
						},
						...getStandardResponses(),
					},
				},
			};
		}

		// UPDATE endpoint
		if (resource.endpoints?.update !== false) {
			paths[itemPath] = {
				...paths[itemPath],
				put: {
					tags: [capitalizedName],
					operationId: `update${capitalizedName}`,
					description: `Update a ${resourceName}`,
					parameters: [
						{
							name: "id",
							in: "path",
							schema: { type: "string" },
							required: true,
						},
					],
					requestBody: {
						content: {
							"application/json": {
								schema: {
									$ref: `#/components/schemas/${capitalizedName}Input`,
								},
							},
						},
					},
					responses: {
						"200": {
							description: `Updated ${resourceName}`,
							content: {
								"application/json": {
									schema: {
										$ref: `#/components/schemas/${capitalizedName}`,
									},
								},
							},
						},
						...getStandardResponses(),
					},
				},
			};
		}

		// DELETE endpoint
		if (resource.endpoints?.delete !== false) {
			paths[itemPath] = {
				...paths[itemPath],
				delete: {
					tags: [capitalizedName],
					operationId: `delete${capitalizedName}`,
					description: `Delete a ${resourceName}`,
					parameters: [
						{
							name: "id",
							in: "path",
							schema: { type: "string" },
							required: true,
						},
					],
					responses: {
						"200": {
							description: `${capitalizedName} deleted successfully`,
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: { type: "boolean" },
											message: { type: "string" },
										},
									},
								},
							},
						},
						...getStandardResponses(),
					},
				},
			};
		}
	}

	// Add OpenAPI plugin endpoints
	paths["/openapi/schema"] = {
		get: {
			tags: ["OpenAPI"],
			operationId: "getOpenAPISchema",
			description: "Get the OpenAPI schema for this CRUD API",
			responses: {
				"200": {
					description: "OpenAPI schema",
					content: {
						"application/json": {
							schema: {
								type: "object",
							},
						},
					},
				},
			},
		},
	};

	const basePath = options.basePath || "/api";
	
	return {
		openapi: "3.1.0",
		info: {
			title: "Better CRUD API",
			description: "Auto-generated API documentation for Better CRUD resources",
			version: "1.0.0",
		},
		servers: [
			{
				url: basePath,
				description: "Better CRUD API Server",
			},
		],
		components,
		paths,
		tags: [
			...options.resources.map((resource) => ({
				name: resource.name.charAt(0).toUpperCase() + resource.name.slice(1),
				description: `Operations for ${resource.name} resource`,
			})),
			{
				name: "OpenAPI",
				description: "OpenAPI specification endpoints",
			},
		],
	};
}