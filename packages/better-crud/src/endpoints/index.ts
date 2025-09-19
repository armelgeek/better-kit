import { createEndpointCreator, createMiddleware } from "better-call";
import { ZodObject, ZodRawShape, z } from "zod";
import {
	CrudContext,
	CrudPermissionContext,
	CrudResourceConfig,
	PaginationResult,
} from "../types";
import { capitalize, generateId, validateData } from "../utils/schema";

/**
 * Create CRUD-specific middleware that provides context
 */
export const crudContextMiddleware = createMiddleware(async (ctx) => {
	return {} as CrudContext;
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

	// Helper function to check permissions
	const checkPermission = async (
		operation: keyof typeof permissions,
		context: CrudPermissionContext,
	): Promise<boolean> => {
		const permissionFn = permissions[operation];
		if (!permissionFn) return true; // No permission defined = allow

		try {
			return await permissionFn(context);
		} catch {
			return false;
		}
	};

	// CREATE endpoint
	if (enabledEndpoints.create) {
		crudEndpoints[`create${capitalize(name)}`] = createCrudEndpoint(
			`/${name}`,
			{
				method: "POST",
				body: schema,
			},
			async (ctx) => {
				const { body, context } = ctx;
				const { adapter } = context;

				// Check permissions
				const hasPermission = await checkPermission("create", {
					user: null, // TODO: extract from session/auth
					resource: name,
					operation: "create",
					data: body,
					request: ctx,
				});

				if (!hasPermission) {
					return ctx.json({ error: "Forbidden" }, { status: 403 });
				}

				// Validate data
				const validation = validateData(schema, body);
				if (!validation.success) {
					return ctx.json(
						{ error: "Validation failed", details: validation.error },
						{ status: 400 },
					);
				}

				// Generate ID if not present
				const data = { ...validation.data };
				if (!data.id) {
					data.id = generateId();
				}

				try {
					const result = await adapter.create({
						model: actualTableName,
						data,
					});

					return ctx.json(result, { status: 201 });
				} catch (error) {
					return ctx.json(
						{ error: "Failed to create resource" },
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
			},
			async (ctx) => {
				const { params, context } = ctx;
				const { adapter } = context;
				const { id } = params;

				// Check permissions
				const hasPermission = await checkPermission("read", {
					user: null, // TODO: extract from session/auth
					resource: name,
					operation: "read",
					id,
					request: ctx,
				});

				if (!hasPermission) {
					return ctx.json({ error: "Forbidden" }, { status: 403 });
				}

				try {
					const result = await adapter.findFirst({
						model: actualTableName,
						where: [{ field: "id", value: id }],
					});

					if (!result) {
						return ctx.json({ error: "Resource not found" }, { status: 404 });
					}

					return ctx.json(result);
				} catch (error) {
					return ctx.json(
						{ error: "Failed to fetch resource" },
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

				// Check permissions
				const hasPermission = await checkPermission("update", {
					user: null, // TODO: extract from session/auth
					resource: name,
					operation: "update",
					id,
					data: body,
					request: ctx,
				});

				if (!hasPermission) {
					return ctx.json({ error: "Forbidden" }, { status: 403 });
				}

				// Validate data
				const validation = validateData(
					(schema as ZodObject<any>).partial(),
					body,
				);
				if (!validation.success) {
					return ctx.json(
						{ error: "Validation failed", details: validation.error },
						{ status: 400 },
					);
				}

				try {
					// Check if resource exists
					const existing = await adapter.findFirst({
						model: actualTableName,
						where: [{ field: "id", value: id }],
					});

					if (!existing) {
						return ctx.json({ error: "Resource not found" }, { status: 404 });
					}

					const result = await adapter.update({
						model: actualTableName,
						where: [{ field: "id", value: id }],
						data: validation.data,
					});

					return ctx.json(result);
				} catch (error) {
					return ctx.json(
						{ error: "Failed to update resource" },
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

				// Check permissions
				const hasPermission = await checkPermission("delete", {
					user: null, // TODO: extract from session/auth
					resource: name,
					operation: "delete",
					id,
					request: ctx,
				});

				if (!hasPermission) {
					return ctx.json({ error: "Forbidden" }, { status: 403 });
				}

				try {
					// Check if resource exists
					const existing = await adapter.findFirst({
						model: actualTableName,
						where: [{ field: "id", value: id }],
					});

					if (!existing) {
						return ctx.json({ error: "Resource not found" }, { status: 404 });
					}

					await adapter.delete({
						model: actualTableName,
						where: [{ field: "id", value: id }],
					});

					return ctx.json({ success: true });
				} catch (error) {
					return ctx.json(
						{ error: "Failed to delete resource" },
						{ status: 500 },
					);
				}
			},
		);
	}

	// LIST endpoint
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
					sortBy: z.string().optional(),
					sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
				}),
			},
			async (ctx) => {
				const { query, context } = ctx;
				const { adapter } = context;

				// Check permissions
				const hasPermission = await checkPermission("list", {
					user: null, // TODO: extract from session/auth
					resource: name,
					operation: "list",
					request: ctx,
				});

				if (!hasPermission) {
					return ctx.json({ error: "Forbidden" }, { status: 403 });
				}

				try {
					const { page, limit, search, sortBy, sortOrder } = query;
					const offset = (page - 1) * limit;

					// Build where conditions for search
					const where: Array<{ field: string; value: any; operator?: string }> =
						[];
					if (search) {
						// Simple search implementation - searches in all string fields
						// In a real implementation, you'd want to be more specific about searchable fields
						where.push({
							field: "name",
							value: `%${search}%`,
							operator: "LIKE",
						});
					}

					// Build order by
					const orderBy: Array<{ field: string; direction: "asc" | "desc" }> =
						[];
					if (sortBy) {
						orderBy.push({ field: sortBy, direction: sortOrder });
					}

					// Get total count
					const total = await adapter.count({
						model: actualTableName,
						where,
					});

					// Get items
					const items = await adapter.findMany({
						model: actualTableName,
						where,
						limit,
						offset,
						orderBy,
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
					return ctx.json(
						{ error: "Failed to fetch resources" },
						{ status: 500 },
					);
				}
			},
		);
	}

	return crudEndpoints;
}
