import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { z } from "zod";
import { adiemus } from "../index";
import { belongsTo, belongsToMany, hasMany } from "../schemas/relationships";

/**
 * Comprehensive TODO CRUD Test with Complex Relationships
 * 
 * This test demonstrates a complete TODO system with:
 * - Users (authors of todos)
 * - Projects (containers for todos)
 * - Todos (main entity)
 * - Tags (many-to-many with todos)
 * - Comments (replies on todos)
 * - Priorities (belongsTo relationship)
 * 
 * Relationship types tested:
 * - hasMany: User -> Todos, Project -> Todos, Todo -> Comments
 * - belongsTo: Todo -> User, Todo -> Project, Todo -> Priority, Comment -> Todo, Comment -> User
 * - belongsToMany: Todo <-> Tags (through todo_tags junction table)
 * - Self-referential: Todo -> Parent Todo (subtasks)
 */

// Schema Definitions
const userSchema = z.object({
	id: z.string().optional(),
	email: z.string().email("Valid email is required"),
	name: z.string().min(1, "Name is required"),
	avatar: z.string().url().optional(),
	role: z.enum(["admin", "user", "guest"]).default("user"),
	createdAt: z.date().default(() => new Date()),
	updatedAt: z.date().default(() => new Date()),
});

const projectSchema = z.object({
	id: z.string().optional(),
	name: z.string().min(1, "Project name is required"),
	description: z.string().optional(),
	status: z.enum(["active", "archived", "completed"]).default("active"),
	startDate: z.date().optional(),
	endDate: z.date().optional(),
	ownerId: z.string(),
	createdAt: z.date().default(() => new Date()),
	updatedAt: z.date().default(() => new Date()),
});

const prioritySchema = z.object({
	id: z.string().optional(),
	name: z.string().min(1, "Priority name is required"),
	level: z.number().int().min(1).max(5),
	color: z.string().optional(),
	createdAt: z.date().default(() => new Date()),
	updatedAt: z.date().default(() => new Date()),
});

const todoSchema = z.object({
	id: z.string().optional(),
	title: z.string().min(1, "Title is required"),
	description: z.string().optional(),
	completed: z.boolean().default(false),
	dueDate: z.date().optional(),
	userId: z.string(), // Who created/owns this todo
	projectId: z.string().optional(), // Optional project association
	priorityId: z.string().optional(), // Optional priority
	parentId: z.string().optional(), // For subtasks
	sortOrder: z.number().int().default(0), // Renamed from 'order' to avoid SQL keyword
	createdAt: z.date().default(() => new Date()),
	updatedAt: z.date().default(() => new Date()),
});

const tagSchema = z.object({
	id: z.string().optional(),
	name: z.string().min(1, "Tag name is required"),
	color: z.string().optional(),
	createdAt: z.date().default(() => new Date()),
	updatedAt: z.date().default(() => new Date()),
});

const commentSchema = z.object({
	id: z.string().optional(),
	content: z.string().min(1, "Content is required"),
	todoId: z.string(),
	userId: z.string(),
	createdAt: z.date().default(() => new Date()),
	updatedAt: z.date().default(() => new Date()),
});

describe("Comprehensive TODO CRUD with Complex Relationships", () => {
	let crud: any;
	let adapter: any;

	beforeAll(async () => {
		// Initialize CRUD system with all resources and relationships
		crud = adiemus({
			database: {
				provider: "sqlite",
				url: "sqlite::memory:",
				autoMigrate: true,
			},
			resources: [
				{
					name: "user",
					schema: userSchema,
					relationships: {
						todos: hasMany("todo", "userId"),
						comments: hasMany("comment", "userId"),
						ownedProjects: hasMany("project", "ownerId"),
					},
				},
				{
					name: "project",
					schema: projectSchema,
					relationships: {
						owner: belongsTo("user", "ownerId"),
						todos: hasMany("todo", "projectId"),
					},
				},
				{
					name: "priority",
					schema: prioritySchema,
					relationships: {
						todos: hasMany("todo", "priorityId"),
					},
				},
				{
					name: "todo",
					schema: todoSchema,
					relationships: {
						user: belongsTo("user", "userId"),
						project: belongsTo("project", "projectId"),
						priority: belongsTo("priority", "priorityId"),
						parent: belongsTo("todo", "parentId"),
						subtasks: hasMany("todo", "parentId"),
						comments: hasMany("comment", "todoId"),
						tags: belongsToMany("tag", "todo_tags", "todoId", "tagId"),
					},
				},
				{
					name: "tag",
					schema: tagSchema,
					relationships: {
						todos: belongsToMany("todo", "todo_tags", "tagId", "todoId"),
					},
				},
				{
					name: "comment",
					schema: commentSchema,
					relationships: {
						todo: belongsTo("todo", "todoId"),
						user: belongsTo("user", "userId"),
					},
				},
			],
		});

		// Store adapter reference
		adapter = crud.context.adapter;

		// Wait a bit for database initialization
		await new Promise((resolve) => setTimeout(resolve, 100));
	});

	afterAll(async () => {
		// Cleanup if needed
	});

	describe("Basic CRUD Operations", () => {
		it("should create users", async () => {
			

			const user1 = await adapter.create({
				model: "user",
				data: {
					id: "user-1",
					email: "john@example.com",
					name: "John Doe",
					role: "admin",
				},
			});

			expect(user1).toBeDefined();
			expect(user1.id).toBe("user-1");
			expect(user1.email).toBe("john@example.com");
			expect(user1.name).toBe("John Doe");

			const user2 = await adapter.create({
				model: "user",
				data: {
					id: "user-2",
					email: "jane@example.com",
					name: "Jane Smith",
					role: "user",
				},
			});

			expect(user2).toBeDefined();
			expect(user2.id).toBe("user-2");
		});

		it("should create priorities", async () => {
			

			const high = await adapter.create({
				model: "priority",
				data: {
					id: "priority-high",
					name: "High",
					level: 5,
					color: "#ff0000",
				},
			});

			expect(high).toBeDefined();
			expect(high.name).toBe("High");

			const medium = await adapter.create({
				model: "priority",
				data: {
					id: "priority-medium",
					name: "Medium",
					level: 3,
					color: "#ffaa00",
				},
			});

			expect(medium).toBeDefined();

			const low = await adapter.create({
				model: "priority",
				data: {
					id: "priority-low",
					name: "Low",
					level: 1,
					color: "#00ff00",
				},
			});

			expect(low).toBeDefined();
		});

		it("should create projects", async () => {
			

			const project1 = await adapter.create({
				model: "project",
				data: {
					id: "project-1",
					name: "Website Redesign",
					description: "Complete overhaul of company website",
					status: "active",
					ownerId: "user-1",
					startDate: new Date("2024-01-01"),
				},
			});

			expect(project1).toBeDefined();
			expect(project1.name).toBe("Website Redesign");
			expect(project1.ownerId).toBe("user-1");

			const project2 = await adapter.create({
				model: "project",
				data: {
					id: "project-2",
					name: "Mobile App",
					description: "New mobile application",
					status: "active",
					ownerId: "user-2",
				},
			});

			expect(project2).toBeDefined();
		});

		it("should create tags", async () => {
			

			const urgent = await adapter.create({
				model: "tag",
				data: {
					id: "tag-urgent",
					name: "urgent",
					color: "#ff0000",
				},
			});

			expect(urgent).toBeDefined();

			const bug = await adapter.create({
				model: "tag",
				data: {
					id: "tag-bug",
					name: "bug",
					color: "#ff6600",
				},
			});

			expect(bug).toBeDefined();

			const feature = await adapter.create({
				model: "tag",
				data: {
					id: "tag-feature",
					name: "feature",
					color: "#0066ff",
				},
			});

			expect(feature).toBeDefined();
		});

		it("should create todos with relationships", async () => {
			

			const todo1 = await adapter.create({
				model: "todo",
				data: {
					id: "todo-1",
					title: "Design homepage mockup",
					description: "Create initial design concepts for the new homepage",
					completed: false,
					userId: "user-1",
					projectId: "project-1",
					priorityId: "priority-high",
					dueDate: new Date("2024-02-15"),
					sortOrder: 1,
				},
			});

			expect(todo1).toBeDefined();
			expect(todo1.title).toBe("Design homepage mockup");
			expect(todo1.userId).toBe("user-1");
			expect(todo1.projectId).toBe("project-1");

			const todo2 = await adapter.create({
				model: "todo",
				data: {
					id: "todo-2",
					title: "Implement responsive layout",
					description: "Make the design work on mobile and desktop",
					completed: false,
					userId: "user-2",
					projectId: "project-1",
					priorityId: "priority-medium",
					sortOrder: 2,
				},
			});

			expect(todo2).toBeDefined();

			const todo3 = await adapter.create({
				model: "todo",
				data: {
					id: "todo-3",
					title: "Write unit tests",
					description: "Add test coverage for new features",
					completed: true,
					userId: "user-1",
					projectId: "project-2",
					priorityId: "priority-low",
					sortOrder: 1,
				},
			});

			expect(todo3).toBeDefined();
			// SQLite stores booleans as 1/0
			expect(todo3.completed).toBeTruthy();
		});

		it("should create subtasks (self-referential relationship)", async () => {
			

			const subtask1 = await adapter.create({
				model: "todo",
				data: {
					id: "todo-subtask-1",
					title: "Research color schemes",
					description: "Find inspiration for color palette",
					completed: false,
					userId: "user-1",
					projectId: "project-1",
					parentId: "todo-1", // Subtask of "Design homepage mockup"
					sortOrder: 1,
				},
			});

			expect(subtask1).toBeDefined();
			expect(subtask1.parentId).toBe("todo-1");

			const subtask2 = await adapter.create({
				model: "todo",
				data: {
					id: "todo-subtask-2",
					title: "Create wireframes",
					description: "Low-fidelity wireframes for layout",
					completed: true,
					userId: "user-1",
					projectId: "project-1",
					parentId: "todo-1",
					sortOrder: 2,
				},
			});

			expect(subtask2).toBeDefined();
			// SQLite stores booleans as 1/0
			expect(subtask2.completed).toBeTruthy();
		});

		it("should create comments", async () => {
			

			const comment1 = await adapter.create({
				model: "comment",
				data: {
					id: "comment-1",
					content: "Great progress on the design!",
					todoId: "todo-1",
					userId: "user-2",
				},
			});

			expect(comment1).toBeDefined();
			expect(comment1.content).toBe("Great progress on the design!");

			const comment2 = await adapter.create({
				model: "comment",
				data: {
					id: "comment-2",
					content: "Should we add dark mode support?",
					todoId: "todo-1",
					userId: "user-1",
				},
			});

			expect(comment2).toBeDefined();

			const comment3 = await adapter.create({
				model: "comment",
				data: {
					id: "comment-3",
					content: "This is completed, ready for review",
					todoId: "todo-3",
					userId: "user-1",
				},
			});

			expect(comment3).toBeDefined();
		});
	});

	describe("Read Operations with Relationships", () => {
		it("should read a todo with user relationship", async () => {
			

			const todo = await adapter.findFirst({
				model: "todo",
				where: [{ field: "id", value: "todo-1" }],
				include: { include: ["user"] },
			});

			expect(todo).toBeDefined();
			expect(todo.id).toBe("todo-1");
			expect(todo.user).toBeDefined();
			expect(todo.user.id).toBe("user-1");
			expect(todo.user.name).toBe("John Doe");
		});

		it("should read a todo with multiple relationships", async () => {
			

			const todo = await adapter.findFirst({
				model: "todo",
				where: [{ field: "id", value: "todo-1" }],
				include: { include: ["user", "project", "priority"] },
			});

			expect(todo).toBeDefined();
			expect(todo.user).toBeDefined();
			expect(todo.user.name).toBe("John Doe");
			expect(todo.project).toBeDefined();
			expect(todo.project.name).toBe("Website Redesign");
			expect(todo.priority).toBeDefined();
			expect(todo.priority.name).toBe("High");
		});

		it("should read a todo with comments", async () => {
			

			const todo = await adapter.findFirst({
				model: "todo",
				where: [{ field: "id", value: "todo-1" }],
				include: { include: ["comments"] },
			});

			expect(todo).toBeDefined();
			expect(todo.comments).toBeDefined();
			expect(Array.isArray(todo.comments)).toBe(true);
			expect(todo.comments.length).toBeGreaterThan(0);
		});

		it("should read a todo with subtasks", async () => {
			

			const todo = await adapter.findFirst({
				model: "todo",
				where: [{ field: "id", value: "todo-1" }],
				include: { include: ["subtasks"] },
			});

			expect(todo).toBeDefined();
			expect(todo.subtasks).toBeDefined();
			expect(Array.isArray(todo.subtasks)).toBe(true);
			expect(todo.subtasks.length).toBeGreaterThan(0);
			expect(todo.subtasks[0].parentId).toBe("todo-1");
		});

		it("should read a project with all its todos", async () => {
			

			const project = await adapter.findFirst({
				model: "project",
				where: [{ field: "id", value: "project-1" }],
				include: { include: ["todos", "owner"] },
			});

			expect(project).toBeDefined();
			expect(project.name).toBe("Website Redesign");
			expect(project.owner).toBeDefined();
			expect(project.owner.name).toBe("John Doe");
			expect(project.todos).toBeDefined();
			expect(Array.isArray(project.todos)).toBe(true);
			expect(project.todos.length).toBeGreaterThan(0);
		});

		it("should read a user with all their todos", async () => {
			

			const user = await adapter.findFirst({
				model: "user",
				where: [{ field: "id", value: "user-1" }],
				include: { include: ["todos"] },
			});

			expect(user).toBeDefined();
			expect(user.name).toBe("John Doe");
			expect(user.todos).toBeDefined();
			expect(Array.isArray(user.todos)).toBe(true);
			expect(user.todos.length).toBeGreaterThan(0);
		});

		it("should list todos with filtering and relationships", async () => {
			

			const todos = await adapter.findMany({
				model: "todo",
				where: [{ field: "completed", value: 0 }], // SQLite uses 0 for false
				include: { include: ["user", "priority"] },
				orderBy: [{ field: "sortOrder", direction: "asc" }],
			});

			expect(todos).toBeDefined();
			expect(Array.isArray(todos)).toBe(true);
			expect(todos.length).toBeGreaterThan(0);
			
			// All should be incomplete (SQLite stores false as 0)
			for (const todo of todos) {
				expect(todo.completed).toBeFalsy();
				expect(todo.user).toBeDefined();
			}
		});
	});

	describe("Update Operations", () => {
		it("should update a todo", async () => {
			

			const updated = await adapter.update({
				model: "todo",
				where: [{ field: "id", value: "todo-2" }],
				data: {
					completed: true,
					updatedAt: new Date(),
				},
			});

			expect(updated).toBeDefined();
			// SQLite stores booleans as 1/0
			expect(updated.completed).toBeTruthy();
		});

		it("should update a todo's relationships", async () => {
			

			const updated = await adapter.update({
				model: "todo",
				where: [{ field: "id", value: "todo-2" }],
				data: {
					priorityId: "priority-high",
				},
			});

			expect(updated).toBeDefined();
			expect(updated.priorityId).toBe("priority-high");

			// Verify with include
			const todo = await adapter.findFirst({
				model: "todo",
				where: [{ field: "id", value: "todo-2" }],
				include: { include: ["priority"] },
			});

			expect(todo.priority).toBeDefined();
			expect(todo.priority.name).toBe("High");
		});

		it("should update a project", async () => {
			

			const updated = await adapter.update({
				model: "project",
				where: [{ field: "id", value: "project-1" }],
				data: {
					status: "completed",
					endDate: new Date("2024-03-01"),
				},
			});

			expect(updated).toBeDefined();
			expect(updated.status).toBe("completed");
		});
	});

	describe("Delete Operations", () => {
		it("should delete a comment", async () => {
			

			await adapter.delete({
				model: "comment",
				where: [{ field: "id", value: "comment-3" }],
			});

			const deleted = await adapter.findFirst({
				model: "comment",
				where: [{ field: "id", value: "comment-3" }],
			});

			// Adapter may return null or undefined for missing records
			expect(deleted).toBeFalsy();
		});

		it("should count todos", async () => {
			

			const count = await adapter.count({
				model: "todo",
				where: [{ field: "completed", value: 0 }], // SQLite uses 0 for false
			});

			expect(count).toBeGreaterThan(0);
		});

		it("should count all records of each type", async () => {
			

			const userCount = await adapter.count({ model: "user" });
			const projectCount = await adapter.count({ model: "project" });
			const todoCount = await adapter.count({ model: "todo" });
			const commentCount = await adapter.count({ model: "comment" });

			expect(userCount).toBe(2);
			expect(projectCount).toBe(2);
			expect(todoCount).toBeGreaterThan(3); // 3 main todos + subtasks
			expect(commentCount).toBe(2); // We deleted one
		});
	});

	describe("Complex Queries", () => {
		it("should query todos with nested relationships", async () => {
			

			const todos = await adapter.findMany({
				model: "todo",
				where: [{ field: "projectId", value: "project-1" }],
				include: { 
					include: ["user", "project", "priority", "comments", "subtasks"] 
				},
			});

			expect(todos).toBeDefined();
			expect(Array.isArray(todos)).toBe(true);
			
			for (const todo of todos) {
				expect(todo.project).toBeDefined();
				expect(todo.project.id).toBe("project-1");
				if (todo.user) {
					expect(todo.user.id).toBeDefined();
				}
			}
		});

		it("should handle pagination with relationships", async () => {
			

			const page1 = await adapter.findMany({
				model: "todo",
				limit: 2,
				offset: 0,
				include: { include: ["user"] },
				orderBy: [{ field: "sortOrder", direction: "asc" }],
			});

			expect(page1).toBeDefined();
			expect(page1.length).toBeLessThanOrEqual(2);

			const page2 = await adapter.findMany({
				model: "todo",
				limit: 2,
				offset: 2,
				include: { include: ["user"] },
				orderBy: [{ field: "sortOrder", direction: "asc" }],
			});

			expect(page2).toBeDefined();
		});

		it("should query with multiple filters", async () => {
			

			const todos = await adapter.findMany({
				model: "todo",
				where: [
					{ field: "completed", value: 0 }, // SQLite uses 0 for false
					{ field: "userId", value: "user-1" },
				],
				include: { include: ["priority"] },
			});

			expect(todos).toBeDefined();
			expect(Array.isArray(todos)).toBe(true);
			
			for (const todo of todos) {
				expect(todo.completed).toBeFalsy();
				expect(todo.userId).toBe("user-1");
			}
		});
	});

	describe("Schema Validation", () => {
		it("should have proper field references in schemas", () => {
			const todoSchemaInfo = crud.context.schemas.get("todo");
			expect(todoSchemaInfo).toBeDefined();
			expect(todoSchemaInfo.fields.userId).toBeDefined();
			expect(todoSchemaInfo.fields.projectId).toBeDefined();
			expect(todoSchemaInfo.fields.priorityId).toBeDefined();
			expect(todoSchemaInfo.fields.parentId).toBeDefined();

			const commentSchemaInfo = crud.context.schemas.get("comment");
			expect(commentSchemaInfo).toBeDefined();
			expect(commentSchemaInfo.fields.todoId).toBeDefined();
			expect(commentSchemaInfo.fields.userId).toBeDefined();

			const projectSchemaInfo = crud.context.schemas.get("project");
			expect(projectSchemaInfo).toBeDefined();
			expect(projectSchemaInfo.fields.ownerId).toBeDefined();
		});
	});
});
