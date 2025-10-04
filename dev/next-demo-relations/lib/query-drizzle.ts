import { betterQuery, createResource } from "better-query";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { z } from "zod";
import * as schema from "./schema/drizzle";

/**
 * Better Query with Drizzle ORM
 *
 * This demonstrates how to use Better Query with Drizzle ORM
 * and define complex relationships including:
 * - hasMany (User → Todos, Projects, Comments)
 * - belongsTo (Todo → User, Project, Priority)
 * - belongsToMany (Todo ↔ Tags through junction table)
 * - Self-referential (Todo → Subtasks)
 */

// Initialize Drizzle
const sqlite = new Database("./drizzle-demo.db");
const db = drizzle(sqlite, { schema });

// Define Zod schemas for validation
const userSchema = z.object({
	id: z.string().optional(),
	email: z.string().email(),
	name: z.string().min(1),
	avatar: z.string().url().optional().nullable(),
	role: z.enum(["admin", "user", "guest"]).default("user"),
	createdAt: z.date().default(() => new Date()),
	updatedAt: z.date().default(() => new Date()),
});

const projectSchema = z.object({
	id: z.string().optional(),
	name: z.string().min(1),
	description: z.string().optional().nullable(),
	status: z.enum(["active", "archived", "completed"]).default("active"),
	ownerId: z.string(),
	startDate: z.date().optional().nullable(),
	endDate: z.date().optional().nullable(),
	createdAt: z.date().default(() => new Date()),
	updatedAt: z.date().default(() => new Date()),
});

const prioritySchema = z.object({
	id: z.string().optional(),
	name: z.string().min(1),
	level: z.number().int().min(1).max(5),
	color: z.string().optional().nullable(),
	createdAt: z.date().default(() => new Date()),
	updatedAt: z.date().default(() => new Date()),
});

const todoSchema = z.object({
	id: z.string().optional(),
	title: z.string().min(1),
	description: z.string().optional().nullable(),
	completed: z.boolean().default(false),
	userId: z.string(),
	projectId: z.string().optional().nullable(),
	priorityId: z.string().optional().nullable(),
	parentId: z.string().optional().nullable(),
	sortOrder: z.number().int().default(0),
	dueDate: z.date().optional().nullable(),
	createdAt: z.date().default(() => new Date()),
	updatedAt: z.date().default(() => new Date()),
});

const tagSchema = z.object({
	id: z.string().optional(),
	name: z.string().min(1),
	color: z.string().optional().nullable(),
	createdAt: z.date().default(() => new Date()),
	updatedAt: z.date().default(() => new Date()),
});

const todoTagSchema = z.object({
	id: z.string().optional(),
	todoId: z.string(),
	tagId: z.string(),
	createdAt: z.date().default(() => new Date()),
});

const commentSchema = z.object({
	id: z.string().optional(),
	content: z.string().min(1),
	todoId: z.string(),
	userId: z.string(),
	createdAt: z.date().default(() => new Date()),
	updatedAt: z.date().default(() => new Date()),
});

// Create resources with relationships
const userResource = createResource({
	name: "user",
	schema: userSchema,
	relationships: {
		todos: { type: "hasMany", target: "todo", foreignKey: "userId" },
		projects: { type: "hasMany", target: "project", foreignKey: "ownerId" },
		comments: { type: "hasMany", target: "comment", foreignKey: "userId" },
	},
});

const projectResource = createResource({
	name: "project",
	schema: projectSchema,
	relationships: {
		owner: { type: "belongsTo", target: "user", foreignKey: "ownerId" },
		todos: { type: "hasMany", target: "todo", foreignKey: "projectId" },
	},
});

const priorityResource = createResource({
	name: "priority",
	schema: prioritySchema,
	relationships: {
		todos: { type: "hasMany", target: "todo", foreignKey: "priorityId" },
	},
});

const todoResource = createResource({
	name: "todo",
	schema: todoSchema,
	relationships: {
		user: { type: "belongsTo", target: "user", foreignKey: "userId" },
		project: { type: "belongsTo", target: "project", foreignKey: "projectId" },
		priority: {
			type: "belongsTo",
			target: "priority",
			foreignKey: "priorityId",
		},
		parent: { type: "belongsTo", target: "todo", foreignKey: "parentId" },
		subtasks: { type: "hasMany", target: "todo", foreignKey: "parentId" },
		comments: { type: "hasMany", target: "comment", foreignKey: "todoId" },
		tags: {
			type: "belongsToMany",
			target: "tag",
			through: "todo_tags",
			foreignKey: "todoId",
			targetKey: "tagId",
		},
	},
});

const tagResource = createResource({
	name: "tag",
	schema: tagSchema,
	relationships: {
		todos: {
			type: "belongsToMany",
			target: "todo",
			through: "todo_tags",
			foreignKey: "tagId",
			targetKey: "todoId",
		},
	},
});

const todoTagResource = createResource({
	name: "todo_tags",
	schema: todoTagSchema,
	relationships: {
		todo: { type: "belongsTo", target: "todo", foreignKey: "todoId" },
		tag: { type: "belongsTo", target: "tag", foreignKey: "tagId" },
	},
});

const commentResource = createResource({
	name: "comment",
	schema: commentSchema,
	relationships: {
		todo: { type: "belongsTo", target: "todo", foreignKey: "todoId" },
		user: { type: "belongsTo", target: "user", foreignKey: "userId" },
	},
});

// Initialize Better Query with Drizzle adapter
export const queryDrizzle = betterQuery({
	basePath: "/api/drizzle",
	database: {
		provider: "sqlite",
		url: "./drizzle-demo.db",
		autoMigrate: true,
	},
	resources: [
		userResource,
		projectResource,
		priorityResource,
		todoResource,
		tagResource,
		todoTagResource,
		commentResource,
	],
});

export type User = z.infer<typeof userSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Priority = z.infer<typeof prioritySchema>;
export type Todo = z.infer<typeof todoSchema>;
export type Tag = z.infer<typeof tagSchema>;
export type TodoTag = z.infer<typeof todoTagSchema>;
export type Comment = z.infer<typeof commentSchema>;
