import { betterQuery, createResource, withId } from "better-query";
import {
	auditPlugin,
	cachePlugin,
	validationPlugin,
} from "better-query/plugins";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "./auth";
import { timestampPlugin } from "./plugins";

export const todoSchema = withId({
	title: z.string().min(1, "Title is required"),
	description: z.string().optional(),
	completed: z.boolean().default(false),
	priority: z.enum(["low", "medium", "high"]).default("medium"),
	category: z.string().optional(),
	dueDate: z.preprocess((val) => {
		if (val == null || val === "") return undefined;
		return val instanceof Date ? val : new Date(String(val));
	}, z.date().optional()),
	tags: z.array(z.string()).default([]),
});

const todoResource = createResource({
	name: "todo",
	schema: todoSchema,
	middlewares: [
		{
			handler: async (context) => {
				console.log("Todo resource middleware triggered", context);
				const session = await auth.api.getSession({
					headers: await headers(),
				});
				console.log("Middleware session user:", session?.user);
				context.user = session?.user;
			},
		},
	],
	permissions: {
		create: async (context) => {
			return !!context.user;
		},
		read: async (context) => {
			return !!context.user;
		},
		update: async (context) => {
			return !!context.user;
		},
		delete: async (context) => {
			return !!context.user;
		},
		list: async (context) => {
			return !!context.user;
		},
	},
	hooks: {
		beforeCreate: async (context) => {
			console.log("Before create hook user:", context.user);
			// Timestamps are now handled by the timestampPlugin
		},
		afterCreate: async (context) => {
			console.log(`Todo created:`, context.result.title);
		},
	},
});

export type Todo = z.infer<typeof todoSchema>;

export const query = betterQuery({
	basePath: "/api/query",
	database: {
		provider: "sqlite",
		url: "todos.db",
		autoMigrate: true,
	},
	plugins: [
		// Built-in plugin: Audit logging for all CRUD operations
		auditPlugin({
			enabled: true,
			operations: ["create", "update", "delete"],
			includeRequestData: false,
			logger: (event) => {
				console.log(
					`[AUDIT] ${event.operation.toUpperCase()} on ${event.resource}`,
					{
						recordId: event.recordId,
						user: event.user?.email || "anonymous",
						timestamp: event.timestamp,
					},
				);
			},
		}),

		// Built-in plugin: Cache for read operations
		cachePlugin({
			enabled: true,
			defaultTTL: 300, // 5 minutes
			resources: {
				todo: {
					enabled: true,
					readTTL: 600, // 10 minutes for individual todos
					listTTL: 300, // 5 minutes for todo lists
				},
			},
		}),

		// Built-in plugin: Validation with global rules
		validationPlugin({
			strict: true,
			globalRules: {
				trimStrings: true,
				validateEmails: true,
				sanitizeHtml: false, // We don't need HTML sanitization for todos
			},
		}),

		// Custom plugin: Automatic timestamps
		timestampPlugin,
	],
	resources: [todoResource],
});
