import { createEndpointCreator, createMiddleware } from "better-call";
import { ZodObject, ZodRawShape, z } from "zod";
import {
	CrudContext,
	CrudPermissionContext,
	CrudResourceConfig,
	PaginationResult,
	IncludeOptions,
	CrudHookContext,
	SecurityContext,
	AuditEvent,
} from "../types";
import { capitalize, generateId, validateData } from "../utils/schema";
import { 
	sanitizeData, 
	sanitizeFields, 
	hasRequiredScopes, 
	checkOwnership, 
	extractSecurityContext, 
	checkEnhancedPermissions,
	rateLimiter,
	validateAndSanitizeInput 
} from "../utils/security";
import { HookExecutor, AuditLogger } from "../utils/hooks";
import { SearchBuilder, FilterBuilder } from "../utils/search";

/**
 * Create CRUD-specific middleware that provides context
 */
export const crudContextMiddleware = createMiddleware(async (ctx) => {
	// Extract security context from request
	const securityContext = extractSecurityContext(ctx.request || ctx);
	
	// Add security utilities to context
	const enhancedContext = {
		...({} as CrudContext),
		security: securityContext,
		rateLimiter,
		auditLogger: new AuditLogger(),
	};
	
	return enhancedContext;
});

/**
 * Create CRUD endpoint creator with our middleware
 */
export const createCrudEndpoint = createEndpointCreator({
	use: [crudContextMiddleware],
});

/**
 * Creates CRUD endpoints for a given resource
 */
export function createCrudEndpoints(resourceConfig: CrudResourceConfig) {
	const {
		name,
		schema,
		tableName,
		endpoints = {},
		permissions = {},
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

	const crudEndpoints: Record<string, any> = {};

	// Enhanced helper function to check permissions with scopes and ownership
	const checkPermission = async (
		operation: keyof typeof permissions,
		context: CrudPermissionContext,
		config?: CrudResourceConfig,
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
		crudEndpoints[`create${capitalize(name)}`] = createCrudEndpoint(
			`/${name}`,
			{
				method: "POST",
				body: schema,
				query: z.object({
					include: z.string().optional(),
					select: z.string().optional(),
				}).optional(),
			},
			async (ctx) => {
				const { body, context, query } = ctx;
				const { adapter } = context;
				
				// Extract user and security context
				const user = extractUser(ctx);
				const userScopes = extractUserScopes(user);
				const securityContext = extractSecurityContext(ctx.request || ctx);

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
				const validation = validateAndSanitizeInput(schema, body, sanitizationRules);
				
				if (!validation.success) {
					return ctx.json(
						{ error: "Validation failed", details: validation.errors },
						{ status: 400 },
					);
				}

				let data = validation.data;

				// Apply field-specific sanitization
				if (resourceConfig.sanitization?.fields) {
					data = sanitizeFields(data, resourceConfig.sanitization.fields);
				}

				// Check permissions with enhanced context
				const permissionContext: CrudPermissionContext = {
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

				// Execute before hooks
				const hookContext: CrudHookContext = {
					user,
					resource: name,
					operation: "create",
					data,
					request: ctx,
					adapter,
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
		crudEndpoints[`get${capitalize(name)}`] = createCrudEndpoint(
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

				// Parse include options
				const include = parseIncludeOptions(query);

				try {
					const result = await adapter.findFirst({
						model: actualTableName,
						where: [{ field: "id", value: id }],
						include,
					});

					if (!result) {
						return ctx.json({ error: "Resource not found" }, { status: 404 });
					}

					// Check permissions with enhanced context including existing data
					const permissionContext: CrudPermissionContext = {
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
		crudEndpoints[`update${capitalize(name)}`] = createCrudEndpoint(
			`/${name}/:id`,
			{
				method: "PATCH",
				params: z.object({
					id: z.string(),
				}),
				body: (schema as ZodObject<any>).partial(),
			},
			async (ctx) => {
				const { params, body, context } = ctx;
				const { adapter } = context;
				const { id } = params;
				
				// Extract user and security context
				const user = extractUser(ctx);
				const userScopes = extractUserScopes(user);

				// Check if resource exists first (needed for ownership checks)
				const existing = await adapter.findFirst({
					model: actualTableName,
					where: [{ field: "id", value: id }],
				});

				if (!existing) {
					return ctx.json({ error: "Resource not found" }, { status: 404 });
				}

				// Enhanced validation and sanitization
				const sanitizationRules = resourceConfig.sanitization?.global || [];
				const validation = validateAndSanitizeInput(
					(schema as ZodObject<any>).partial(), 
					body, 
					sanitizationRules
				);
				
				if (!validation.success) {
					return ctx.json(
						{ error: "Validation failed", details: validation.errors },
						{ status: 400 },
					);
				}

				let data = validation.data;

				// Apply field-specific sanitization
				if (resourceConfig.sanitization?.fields) {
					data = sanitizeFields(data, resourceConfig.sanitization.fields);
				}

				// Check permissions with enhanced context including existing data
				const permissionContext: CrudPermissionContext = {
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

				// Execute before hooks
				const hookContext: CrudHookContext = {
					user,
					resource: name,
					operation: "update",
					id,
					data,
					existingData: existing,
					request: ctx,
					adapter,
				};

				try {
					await HookExecutor.executeBefore(resourceConfig.hooks, hookContext);
				} catch (error) {
					return ctx.json(
						{ error: "Hook execution failed", details: error instanceof Error ? error.message : String(error) },
						{ status: 500 },
					);
				}

				try {
					const result = await adapter.update({
						model: actualTableName,
						where: [{ field: "id", value: id }],
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
		crudEndpoints[`delete${capitalize(name)}`] = createCrudEndpoint(
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

				// Check if resource exists first (needed for ownership and audit)
				const existing = await adapter.findFirst({
					model: actualTableName,
					where: [{ field: "id", value: id }],
				});

				if (!existing) {
					return ctx.json({ error: "Resource not found" }, { status: 404 });
				}

				// Check permissions with enhanced context including existing data
				const permissionContext: CrudPermissionContext = {
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

				// Execute before hooks
				const hookContext: CrudHookContext = {
					user,
					resource: name,
					operation: "delete",
					id,
					existingData: existing,
					request: ctx,
					adapter,
				};

				try {
					await HookExecutor.executeBefore(resourceConfig.hooks, hookContext);
				} catch (error) {
					return ctx.json(
						{ error: "Hook execution failed", details: error instanceof Error ? error.message : String(error) },
						{ status: 500 },
					);
				}

				try {
					await adapter.delete({
						model: actualTableName,
						where: [{ field: "id", value: id }],
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
		crudEndpoints[`list${capitalize(name)}s`] = createCrudEndpoint(
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

				// Build enhanced query parameters
				const enhancedQuery = {
					...query,
					searchFields: SearchBuilder.parseStringArray(query.searchFields),
					filters: SearchBuilder.parseJSON(query.filters),
					where: SearchBuilder.parseJSON(query.where),
					dateRange: SearchBuilder.parseJSON(query.dateRange),
				};

				// Check permissions with enhanced context
				const permissionContext: CrudPermissionContext = {
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
						where: whereConditions,
					});

					// Get items
					const items = await adapter.findMany({
						model: actualTableName,
						where: whereConditions,
						limit,
						offset,
						orderBy,
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

	return crudEndpoints;
}
