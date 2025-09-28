import { createEndpointCreator, createMiddleware } from "better-call";
import { ZodObject, z, ZodSchema, ZodTypeAny } from "zod";
import {
	QueryContext,
	QueryPermissionContext,
	QueryResourceConfig,
	PaginationResult,
	IncludeOptions,
	QueryHookContext,
	QueryParams,
} from "../types";
import { convertToQueryWhere, convertToQueryOrderBy } from "../adapters/utils";
import { capitalize, generateId } from "../utils/schema";
import { 
	sanitizeFields, 
	hasRequiredScopes, 
	extractSecurityContext, 
	checkEnhancedPermissions,
	rateLimiter,
	validateAndSanitizeInput 
} from "../utils/security";
import { HookExecutor, AuditLogger } from "../utils/hooks";
import { SearchBuilder, FilterBuilder } from "../utils/search";

/**
 * Create a flexible version of a Zod schema that allows string input for date fields
 * This enables hooks to transform date strings before final validation
 */
function createFlexibleSchema(schema: ZodSchema, isPartial = false): ZodSchema {
	// If it's a ZodObject, we can inspect and modify its shape
	if (schema instanceof ZodObject) {
		const shape = schema.shape;
		const flexibleShape: Record<string, ZodTypeAny> = {};
		
		for (const [key, fieldSchema] of Object.entries(shape)) {
			const fieldSchemaAny = fieldSchema as any;
			
			// Check if this field is a date or optional date
			if (fieldSchemaAny._def?.typeName === 'ZodDate') {
				// Replace date with union of string or date
				flexibleShape[key] = z.union([z.string(), z.date()]);
			} else if (fieldSchemaAny._def?.typeName === 'ZodOptional' && 
					   fieldSchemaAny._def?.innerType?._def?.typeName === 'ZodDate') {
				// Replace optional date with optional union of string or date
				flexibleShape[key] = z.union([z.string(), z.date()]).optional();
			} else {
				// Keep the original field schema
				flexibleShape[key] = fieldSchemaAny;
			}
		}
		
		const flexibleSchema = z.object(flexibleShape);
		return isPartial ? flexibleSchema.partial() : flexibleSchema;
	}
	
	// For non-object schemas, return as-is (with partial if requested)
	if (isPartial && 'partial' in schema) {
		return (schema as any).partial();
	}
	return schema;
}

/**
 * Create Query-specific middleware that provides context
 */
export const queryContextMiddleware = createMiddleware(async (ctx) => {
	// Extract security context from request
	const securityContext = extractSecurityContext(ctx.request || ctx);
	
	// Add security utilities to context
	const enhancedContext = {
		...({} as QueryContext),
		security: securityContext,
		rateLimiter,
		auditLogger: new AuditLogger(),
	};
	
	return enhancedContext;
});

// Legacy alias
export const crudContextMiddleware = queryContextMiddleware;

/**
 * Create Query endpoint creator with our middleware
 */
export const createQueryEndpoint = createEndpointCreator({
	use: [queryContextMiddleware],
});

// Legacy alias
export const createCrudEndpoint = createQueryEndpoint;

/**
 * Creates Query endpoints for a given resource
 */
export function createQueryEndpoints(resourceConfig: QueryResourceConfig) {
	const {
		name,
		schema,
		tableName,
		endpoints = {},
		permissions = {},
		customEndpoints = {},
	} = resourceConfig;
	const actualTableName = tableName || name;

	// Default all endpoints to enabled
	const enabledEndpoints = {
		create: true,
		read: true,
		update: true,
		delete: true,
		list: true,
		...endpoints,
	};

	const queryEndpoints: Record<string, any> = {};

	// Enhanced helper function to check permissions with scopes and ownership
	const checkPermission = async (
		operation: keyof typeof permissions,
		context: QueryPermissionContext,
		config?: QueryResourceConfig,
	): Promise<boolean> => {
		const permissionFn = permissions[operation];
		const requiredScopes = config?.scopes?.[operation];
		const ownershipConfig = config?.ownership;

		// Check basic permission function first
		if (permissionFn) {
			try {
				const hasBasicPermission = await permissionFn(context);
				if (!hasBasicPermission) return false;
			} catch {
				return false;
			}
		} else if (!config) {
			// If no permission function and no config, default to allow
			return true;
		}

		// Check enhanced permissions (scopes, ownership) if config is provided
		if (config) {
			return await checkEnhancedPermissions(context, requiredScopes, ownershipConfig);
		}

		return true;
	};

	// Helper to extract user from request/context  
	const extractUser = (ctx: any): any => {
		return ctx.user || ctx.context?.user || ctx.request?.user || null;
	};

	// Helper to extract user scopes
	const extractUserScopes = (user: any): string[] => {
		return user?.scopes || user?.roles || [];
	};

	// Helper function to parse include options from query parameters
	const parseIncludeOptions = (query?: any): IncludeOptions | undefined => {
		if (!query) return undefined;

		const include: IncludeOptions = {};

		if (query.include) {
			try {
				// Parse comma-separated include list
				include.include = query.include.split(",").map((s: string) => s.trim());
			} catch {
				// Ignore parsing errors
			}
		}

		if (query.select) {
			try {
				// Parse JSON select object
				include.select = JSON.parse(query.select);
			} catch {
				// Ignore parsing errors
			}
		}

		return Object.keys(include).length > 0 ? include : undefined;
	};

	// CREATE endpoint
	if (enabledEndpoints.create) {
		queryEndpoints[`create${capitalize(name)}`] = createQueryEndpoint(
			`/${name}`,
			{
				method: "POST",
				body: createFlexibleSchema(schema),
				query: z.object({
					include: z.string().optional(),
					select: z.string().optional(),
				}).optional(),
			},
			async (ctx) => {
				console.log('ici');
				const { body, context, query } = ctx;
				const { adapter } = context;
				
				// Extract user and security context
				const user = extractUser(ctx);
				const userScopes = extractUserScopes(user);
				const securityContext = extractSecurityContext(ctx.request || ctx);

				// Execute before hooks FIRST - they can modify data and context
				const hookContext: QueryHookContext = {
					user,
					resource: name,
					operation: "create",
					data: body, // Original body data
					request: ctx,
					adapter: {
						...adapter,
						context: context, // Pass the full CRUD context
					},
				};

				try {
					await HookExecutor.executeBefore(resourceConfig.hooks, hookContext);
				} catch (error) {
					return ctx.json(
						{ error: "Hook execution failed", details: error instanceof Error ? error.message : String(error) },
						{ status: 500 },
					);
				}

				// Use potentially modified data from hooks
				let data = hookContext.data;

				// Rate limiting check
				if (context.security?.rateLimit) {
					const rateLimitKey = `${securityContext.ipAddress || 'unknown'}-create-${name}`;
					const isAllowed = rateLimiter.isAllowed(
						rateLimitKey,
						context.security.rateLimit.windowMs,
						context.security.rateLimit.max
					);
					
					if (!isAllowed) {
						return ctx.json({ error: "Rate limit exceeded" }, { status: 429 });
					}
				}

				// Enhanced validation and sanitization
				const sanitizationRules = resourceConfig.sanitization?.global || [];
				const validation = validateAndSanitizeInput(schema, data, sanitizationRules);
				
				if (!validation.success) {
					return ctx.json(
						{ error: "Validation failed", details: validation.errors },
						{ status: 400 },
					);
				}

				data = validation.data;

				// Apply field-specific sanitization
				if (resourceConfig.sanitization?.fields) {
					data = sanitizeFields(data, resourceConfig.sanitization.fields);
				}

				// Check permissions with enhanced context
				const permissionContext: QueryPermissionContext = {
					user,
					resource: name,
					operation: "create",
					data,
					request: ctx,
					scopes: userScopes,
				};

				const hasPermission = await checkPermission("create", permissionContext, resourceConfig);
				if (!hasPermission) {
					return ctx.json({ error: "Forbidden" }, { status: 403 });
				}

				// Generate ID if not present
				if (!data.id) {
					data.id = generateId();
				}

				// Update hook context with final data
				hookContext.data = data;

				// Parse include options
				const include = parseIncludeOptions(query);

				try {
					const result = await adapter.create({
						model: actualTableName,
						data,
						include,
					});

					// Execute after hooks
					hookContext.result = result;
					await HookExecutor.executeAfter(resourceConfig.hooks, hookContext);

					// Log audit event
					if (context.auditLogger) {
						await context.auditLogger.logFromContext(hookContext, undefined, result);
					}

					return ctx.json(result, { status: 201 });
				} catch (error) {
					console.error("Error creating resource:", error);
					return ctx.json(
						{
							error: "Failed to create resource",
							details: error instanceof Error ? error.message : String(error),
						},
						{ status: 500 },
					);
				}
			},
		);
	}

	// READ endpoint
	if (enabledEndpoints.read) {
		queryEndpoints[`get${capitalize(name)}`] = createQueryEndpoint(
			`/${name}/:id`,
			{
				method: "GET",
				params: z.object({
					id: z.string(),
				}),
				query: z.object({
					include: z.string().optional(),
					select: z.string().optional(),
				}).optional(),
			},
			async (ctx) => {
				const { params, context, query } = ctx;
				const { adapter } = context;
				const { id } = params;
				
				// Extract user and security context
				const user = extractUser(ctx);
				const userScopes = extractUserScopes(user);

				// Execute before hooks FIRST for read operations
				const hookContext: QueryHookContext = {
					user,
					resource: name,
					operation: "read",
					id,
					request: ctx,
					adapter: {
						...adapter,
						context: context,
					},
				};

				try {
					await HookExecutor.executeBefore(resourceConfig.hooks, hookContext);
				} catch (error) {
					return ctx.json(
						{ error: "Hook execution failed", details: error instanceof Error ? error.message : String(error) },
						{ status: 500 },
					);
				}

				// Parse include options
				const include = parseIncludeOptions(query);

				try {
					const result = await adapter.findFirst({
						model: actualTableName,
						where: convertToQueryWhere([{ field: "id", value: id }]),
						include,
					});

					if (!result) {
						return ctx.json({ error: "Resource not found" }, { status: 404 });
					}

					// Update hook context with found data
					hookContext.existingData = result;

					// Check permissions with enhanced context including existing data
					const permissionContext: QueryPermissionContext = {
						user,
						resource: name,
						operation: "read",
						id,
						existingData: result,
						request: ctx,
						scopes: userScopes,
					};

					const hasPermission = await checkPermission("read", permissionContext, resourceConfig);
					if (!hasPermission) {
						return ctx.json({ error: "Forbidden" }, { status: 403 });
					}

					// Execute after hooks
					hookContext.result = result;
					await HookExecutor.executeAfter(resourceConfig.hooks, hookContext);

					return ctx.json(result);
				} catch (error) {
					console.error("Error fetching resource:", error);
					return ctx.json(
						{
							error: "Failed to fetch resource",
							details: error instanceof Error ? error.message : String(error),
						},
						{ status: 500 },
					);
				}
			},
		);
	}

	// UPDATE endpoint  
	if (enabledEndpoints.update) {
		queryEndpoints[`update${capitalize(name)}`] = createQueryEndpoint(
			`/${name}/:id`,
			{
				method: "PATCH",
				params: z.object({
					id: z.string(),
				}),
				body: createFlexibleSchema(schema, true),
			},
			async (ctx) => {
				const { params, body, context } = ctx;
				const { adapter } = context;
				const { id } = params;
				
				// Extract user and security context
				const user = extractUser(ctx);
				const userScopes = extractUserScopes(user);

				// Check if resource exists first (needed for hooks and ownership checks)
				const existing = await adapter.findFirst({
					model: actualTableName,
					where: convertToQueryWhere([{ field: "id", value: id }]),
				});

				if (!existing) {
					return ctx.json({ error: "Resource not found" }, { status: 404 });
				}

				// Execute before hooks FIRST - they can modify data
				const hookContext: QueryHookContext = {
					user,
					resource: name,
					operation: "update",
					id,
					data: body, // Original body data
					existingData: existing,
					request: ctx,
					adapter: {
						...adapter,
						context: context,
					},
				};

				try {
					await HookExecutor.executeBefore(resourceConfig.hooks, hookContext);
				} catch (error) {
					return ctx.json(
						{ error: "Hook execution failed", details: error instanceof Error ? error.message : String(error) },
						{ status: 500 },
					);
				}

				// Use potentially modified data from hooks
				let data = hookContext.data;

				// Enhanced validation and sanitization
				const sanitizationRules = resourceConfig.sanitization?.global || [];
				const validation = validateAndSanitizeInput(
					(schema as ZodObject<any>).partial(), 
					data, 
					sanitizationRules
				);
				
				if (!validation.success) {
					return ctx.json(
						{ error: "Validation failed", details: validation.errors },
						{ status: 400 },
					);
				}

				data = validation.data;

				// Apply field-specific sanitization
				if (resourceConfig.sanitization?.fields) {
					data = sanitizeFields(data, resourceConfig.sanitization.fields);
				}

				// Check permissions with enhanced context including existing data
				const permissionContext: QueryPermissionContext = {
					user,
					resource: name,
					operation: "update",
					id,
					data,
					existingData: existing,
					request: ctx,
					scopes: userScopes,
				};

				const hasPermission = await checkPermission("update", permissionContext, resourceConfig);
				if (!hasPermission) {
					return ctx.json({ error: "Forbidden" }, { status: 403 });
				}

				// Update hook context with final data
				hookContext.data = data;

				try {
					const result = await adapter.update({
						model: actualTableName,
						where: convertToQueryWhere([{ field: "id", value: id }]),
						data,
					});

					// Execute after hooks
					hookContext.result = result;
					await HookExecutor.executeAfter(resourceConfig.hooks, hookContext);

					// Log audit event
					if (context.auditLogger) {
						await context.auditLogger.logFromContext(hookContext, existing, result);
					}

					return ctx.json(result);
				} catch (error) {
					console.error("Error updating resource:", error);
					return ctx.json(
						{
							error: "Failed to update resource",
							details: error instanceof Error ? error.message : String(error),
						},
						{ status: 500 },
					);
				}
			},
		);
	}

	// DELETE endpoint
	if (enabledEndpoints.delete) {
		queryEndpoints[`delete${capitalize(name)}`] = createQueryEndpoint(
			`/${name}/:id`,
			{
				method: "DELETE",
				params: z.object({
					id: z.string(),
				}),
			},
			async (ctx) => {
				const { params, context } = ctx;
				const { adapter } = context;
				const { id } = params;
				
				// Extract user and security context
				const user = extractUser(ctx);
				const userScopes = extractUserScopes(user);

				// Check if resource exists first (needed for hooks, ownership and audit)
				const existing = await adapter.findFirst({
					model: actualTableName,
					where: convertToQueryWhere([{ field: "id", value: id }]),
				});

				if (!existing) {
					return ctx.json({ error: "Resource not found" }, { status: 404 });
				}

				// Execute before hooks FIRST
				const hookContext: QueryHookContext = {
					user,
					resource: name,
					operation: "delete",
					id,
					existingData: existing,
					request: ctx,
					adapter: {
						...adapter,
						context: context,
					},
				};

				try {
					await HookExecutor.executeBefore(resourceConfig.hooks, hookContext);
				} catch (error) {
					return ctx.json(
						{ error: "Hook execution failed", details: error instanceof Error ? error.message : String(error) },
						{ status: 500 },
					);
				}

				// Check permissions with enhanced context including existing data
				const permissionContext: QueryPermissionContext = {
					user,
					resource: name,
					operation: "delete",
					id,
					existingData: existing,
					request: ctx,
					scopes: userScopes,
				};

				const hasPermission = await checkPermission("delete", permissionContext, resourceConfig);
				if (!hasPermission) {
					return ctx.json({ error: "Forbidden" }, { status: 403 });
				}

				try {
					await adapter.delete({
						model: actualTableName,
						where: convertToQueryWhere([{ field: "id", value: id }]),
					});

					// Execute after hooks
					await HookExecutor.executeAfter(resourceConfig.hooks, hookContext);

					// Log audit event
					if (context.auditLogger) {
						await context.auditLogger.logFromContext(hookContext, existing, undefined);
					}

					return ctx.json({ success: true });
				} catch (error) {
					console.error("Error deleting resource:", error);
					return ctx.json(
						{
							error: "Failed to delete resource",
							details: error instanceof Error ? error.message : String(error),
						},
						{ status: 500 },
					);
				}
			},
		);
	}

	// LIST endpoint with advanced search and filtering
	if (enabledEndpoints.list) {
		queryEndpoints[`list${capitalize(name)}s`] = createQueryEndpoint(
			`/${name}s`,
			{
				method: "GET",
				query: z.object({
					page: z
						.string()
						.optional()
						.transform((val) => (val ? parseInt(val) : 1)),
					limit: z
						.string()
						.optional()
						.transform((val) => (val ? parseInt(val) : 10)),
					search: z.string().optional(),
					q: z.string().optional(), // Alternative search parameter
					searchFields: z.string().optional(), // Comma-separated list of fields to search
					sortBy: z.string().optional(),
					sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
					include: z.string().optional(),
					select: z.string().optional(),
					filters: z.string().optional(), // JSON string of advanced filters
					where: z.string().optional(), // JSON string of where conditions
					dateRange: z.string().optional(), // JSON string for date range filtering
				}),
			},
			async (ctx) => {
				const { query, context } = ctx;
				const { adapter } = context;
				
				// Extract user and security context
				const user = extractUser(ctx);
				const userScopes = extractUserScopes(user);

				// Execute before hooks FIRST for list operations
				const hookContext: QueryHookContext = {
					user,
					resource: name,
					operation: "list",
					request: ctx,
					adapter: {
						...adapter,
						context: context,
					},
				};

				try {
					await HookExecutor.executeBefore(resourceConfig.hooks, hookContext);
				} catch (error) {
					return ctx.json(
						{ error: "Hook execution failed", details: error instanceof Error ? error.message : String(error) },
						{ status: 500 },
					);
				}

				// Build enhanced query parameters with proper typing
				const enhancedQuery: QueryParams = {
					...query,
					include: query.include ? SearchBuilder.parseStringArray(query.include) : undefined,
					searchFields: SearchBuilder.parseStringArray(query.searchFields),
					filters: SearchBuilder.parseJSON(query.filters),
					where: SearchBuilder.parseJSON(query.where),
					dateRange: SearchBuilder.parseJSON(query.dateRange),
					// Handle select field appropriately
					select: query.select ? (typeof query.select === 'string' ? SearchBuilder.parseJSON(query.select) : query.select) : undefined,
				};

				// Check permissions with enhanced context
				const permissionContext: QueryPermissionContext = {
					user,
					resource: name,
					operation: "list",
					request: ctx,
					scopes: userScopes,
				};

				const hasPermission = await checkPermission("list", permissionContext, resourceConfig);
				if (!hasPermission) {
					return ctx.json({ error: "Forbidden" }, { status: 403 });
				}

				try {
					// Build search conditions
					const searchConditions = SearchBuilder.buildSearchConditions(
						enhancedQuery,
						resourceConfig.search
					);

					// Build pagination
					const { page, limit, offset } = SearchBuilder.buildPagination(enhancedQuery);

					// Build ordering
					const orderBy = SearchBuilder.buildOrderBy(enhancedQuery);

					// Build include options
					const includeOptions = SearchBuilder.buildIncludeOptions(enhancedQuery);

					// Apply ownership filtering if configured
					let whereConditions = [...searchConditions];
					if (resourceConfig.ownership && user) {
						const ownershipField = resourceConfig.ownership.field;
						const userId = user.id || user.userId;
						
						// If strategy is flexible, allow users to see their own data plus admin access
						if (resourceConfig.ownership.strategy === "flexible") {
							const isAdmin = hasRequiredScopes(userScopes, ["admin", "super_admin"]);
							if (!isAdmin) {
								whereConditions.push({
									field: ownershipField,
									value: userId,
									operator: "eq",
								});
							}
						} else {
							// Strict ownership - only show user's own data
							whereConditions.push({
								field: ownershipField,
								value: userId,
								operator: "eq",
							});
						}
					}

					// Get total count for pagination
					const total = await adapter.count({
						model: actualTableName,
						where: convertToQueryWhere(whereConditions),
					});

					// Get items
					const items = await adapter.findMany({
						model: actualTableName,
						where: convertToQueryWhere(whereConditions),
						limit,
						offset,
						orderBy: convertToQueryOrderBy(orderBy),
						include: includeOptions,
					});

					const totalPages = Math.ceil(total / limit);

					const result: PaginationResult<any> = {
						items,
						pagination: {
							page,
							limit,
							total,
							totalPages,
							hasNext: page < totalPages,
							hasPrev: page > 1,
						},
					};

					// Execute after hooks
					hookContext.result = result;
					await HookExecutor.executeAfter(resourceConfig.hooks, hookContext);

					return ctx.json(result);
				} catch (error) {
					console.error("Error fetching resources:", error);
					return ctx.json(
						{
							error: "Failed to fetch resources",
							details: error instanceof Error ? error.message : String(error),
						},
						{ status: 500 },
					);
				}
			},
		);
	}

	// Merge custom endpoints if provided
	if (customEndpoints && Object.keys(customEndpoints).length > 0) {
		Object.assign(queryEndpoints, customEndpoints);
	}

	return queryEndpoints;
}

// Legacy alias
export const createCrudEndpoints = createQueryEndpoints;