import { ZodSchema, z } from "zod";
import { User } from "../../adapters/schema";
import { createAuthEndpoint } from "../../api/call";
import { Where } from "../../types/adapter";
import { generateId } from "../../utils/id";
import { CrudContext, CrudOperation, CrudResourceConfig } from "./types";

/**
 * Creates CRUD endpoints for a given resource
 */
export function createCrudEndpoints(resourceConfig: CrudResourceConfig) {
	const { name, schema, endpoints = {}, permissions = {} } = resourceConfig;
	const tableName = resourceConfig.tableName || name;

	// Default all endpoints to true if not specified
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
		operation: CrudOperation,
		user: User | null,
		context: Omit<CrudContext, "user" | "operation">,
	): Promise<boolean> => {
		const permissionFn = permissions[operation];
		if (!permissionFn) return true; // No permission check means allowed

		if (!user && operation !== "read" && operation !== "list") {
			return false; // Most operations require authentication
		}

		// Call permission function with appropriate parameters
		try {
			switch (operation) {
				case "create":
					return await (permissionFn as any)(user, context.data);
				case "read":
				case "delete":
					return await (permissionFn as any)(user, context.id);
				case "update":
					return await (permissionFn as any)(user, context.id, context.data);
				case "list":
					return await (permissionFn as any)(user);
				default:
					return false;
			}
		} catch {
			return false;
		}
	};

	// Helper function to get current user from session
	const getCurrentUser = async (ctx: any): Promise<User | null> => {
		if (!ctx.request?.headers) return null;

		const sessionCookieToken = await ctx.getSignedCookie(
			ctx.context.authCookies.sessionToken.name,
			ctx.context.options.secret,
		);

		if (!sessionCookieToken) return null;

		const session =
			await ctx.context.internalAdapter.findSession(sessionCookieToken);
		if (!session || session.session.expiresAt < new Date()) {
			return null;
		}

		return session.user;
	};

	// CREATE endpoint
	if (enabledEndpoints.create) {
		const createSchema =
			schema instanceof z.ZodObject
				? schema.omit({ id: true, createdAt: true, updatedAt: true })
				: schema;

		crudEndpoints[`create${capitalize(name)}`] = createAuthEndpoint(
			`/${name}`,
			{
				method: "POST",
				body: createSchema,
				requireHeaders: true,
			},
			async (ctx) => {
				const user = await getCurrentUser(ctx);
				const canCreate = await checkPermission("create", user, {
					resource: name,
					data: ctx.body,
				});

				if (!canCreate) {
					return ctx.json({ error: "Permission denied" }, { status: 403 });
				}

				const id = generateId();
				const now = new Date();
				const data = {
					...ctx.body,
					id,
					createdAt: now,
					updatedAt: now,
				};

				// Use adapter to create the resource
				const adapter = ctx.context.adapter;
				const result = await adapter.create({
					model: tableName,
					data,
				});

				return ctx.json(result);
			},
		);
	}

	// READ endpoint
	if (enabledEndpoints.read) {
		crudEndpoints[`get${capitalize(name)}`] = createAuthEndpoint(
			`/${name}/:id`,
			{
				method: "GET",
			},
			async (ctx) => {
				const { id } = ctx.params;
				const user = await getCurrentUser(ctx);
				const canRead = await checkPermission("read", user, {
					resource: name,
					id,
				});

				if (!canRead) {
					return ctx.json({ error: "Permission denied" }, { status: 403 });
				}

				const adapter = ctx.context.adapter;
				const result = await adapter.findOne({
					model: tableName,
					where: [{ field: "id", value: id }],
				});

				if (!result) {
					return ctx.json({ error: "Resource not found" }, { status: 404 });
				}

				return ctx.json(result);
			},
		);
	}

	// UPDATE endpoint
	if (enabledEndpoints.update) {
		const updateSchema =
			schema instanceof z.ZodObject
				? schema.omit({ id: true, createdAt: true }).partial()
				: schema;

		crudEndpoints[`update${capitalize(name)}`] = createAuthEndpoint(
			`/${name}/:id`,
			{
				method: "PATCH",
				body: updateSchema,
				requireHeaders: true,
			},
			async (ctx) => {
				const { id } = ctx.params;
				const user = await getCurrentUser(ctx);
				const canUpdate = await checkPermission("update", user, {
					resource: name,
					id,
					data: ctx.body,
				});

				if (!canUpdate) {
					return ctx.json({ error: "Permission denied" }, { status: 403 });
				}

				const adapter = ctx.context.adapter;

				// Check if resource exists
				const existing = await adapter.findOne({
					model: tableName,
					where: [{ field: "id", value: id }],
				});

				if (!existing) {
					return ctx.json({ error: "Resource not found" }, { status: 404 });
				}

				const updateData = {
					...ctx.body,
					updatedAt: new Date(),
				};

				const result = await adapter.update({
					model: tableName,
					where: [{ field: "id", value: id }],
					update: updateData,
				});

				return ctx.json(result);
			},
		);
	}

	// DELETE endpoint
	if (enabledEndpoints.delete) {
		crudEndpoints[`delete${capitalize(name)}`] = createAuthEndpoint(
			`/${name}/:id`,
			{
				method: "DELETE",
				requireHeaders: true,
			},
			async (ctx) => {
				const { id } = ctx.params;
				const user = await getCurrentUser(ctx);
				const canDelete = await checkPermission("delete", user, {
					resource: name,
					id,
				});

				if (!canDelete) {
					return ctx.json({ error: "Permission denied" }, { status: 403 });
				}

				const adapter = ctx.context.adapter;

				// Check if resource exists
				const existing = await adapter.findOne({
					model: tableName,
					where: [{ field: "id", value: id }],
				});

				if (!existing) {
					return ctx.json({ error: "Resource not found" }, { status: 404 });
				}

				await adapter.delete({
					model: tableName,
					where: [{ field: "id", value: id }],
				});

				return ctx.json({ success: true });
			},
		);
	}

	// LIST endpoint
	if (enabledEndpoints.list) {
		crudEndpoints[`list${capitalize(name)}s`] = createAuthEndpoint(
			`/${name}s`,
			{
				method: "GET",
				query: z
					.object({
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
					})
					.optional(),
			},
			async (ctx) => {
				const user = await getCurrentUser(ctx);
				const canList = await checkPermission("list", user, {
					resource: name,
				});

				if (!canList) {
					return ctx.json({ error: "Permission denied" }, { status: 403 });
				}

				const {
					page = 1,
					limit = 10,
					search,
					sortBy,
					sortOrder = "asc",
				} = ctx.query || {};

				const adapter = ctx.context.adapter;

				// Build where clause for search
				let where: Where[] = [];
				if (search) {
					// Simple search implementation - searches in name field if it exists
					where = [{ field: "name", value: search, operator: "eq" }];
				}

				// For this simplified implementation, we'll just get all matching items
				const items = await adapter.findMany({
					model: tableName,
					where: where.length > 0 ? where : undefined,
				});

				// Simple pagination (in a real implementation, you'd do this at the database level)
				const startIndex = (page - 1) * limit;
				const paginatedItems = items.slice(startIndex, startIndex + limit);

				return ctx.json({
					items: paginatedItems,
					pagination: {
						page,
						limit,
						total: items.length,
						totalPages: Math.ceil(items.length / limit),
					},
				});
			},
		);
	}

	return crudEndpoints;
}

// Helper function to capitalize first letter
function capitalize(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1);
}
