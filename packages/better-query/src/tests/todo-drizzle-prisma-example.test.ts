import { describe, expect, it } from "vitest";
import { z } from "zod";

/**
 * Comprehensive TODO CRUD Examples for Drizzle and Prisma Adapters
 *
 * This file demonstrates how to use Better Query with both Drizzle ORM and Prisma
 * for a complete TODO application with complex relationships.
 *
 * NOTE: These are example/documentation tests. To run them in a real project:
 * 1. Install the required dependencies
 * 2. Set up your database schema
 * 3. Initialize the appropriate adapter
 *
 * Relationships demonstrated:
 * - User hasMany Todos, Projects, Comments
 * - Project belongsTo User, hasMany Todos
 * - Todo belongsTo User, Project, Priority
 * - Todo hasMany Comments, Subtasks (self-referential)
 * - Todo belongsToMany Tags (through junction table)
 * - Comment belongsTo Todo, User
 * - Priority hasMany Todos
 * - Tag belongsToMany Todos
 */

describe("TODO CRUD with Drizzle and Prisma - Examples", () => {
	describe("Drizzle ORM Example", () => {
		it("should demonstrate Drizzle setup and usage", () => {
			/**
			 * Step 1: Install Drizzle dependencies
			 * ```bash
			 * pnpm add drizzle-orm better-sqlite3
			 * pnpm add -D drizzle-kit @types/better-sqlite3
			 * ```
			 */

			/**
			 * Step 2: Define Drizzle schema
			 * File: schema/drizzle.ts
			 */
			const drizzleSchemaExample = `
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// User table
export const users = sqliteTable('user', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  avatar: text('avatar'),
  role: text('role').notNull().default('user'), // 'admin', 'user', 'guest'
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
});

// Project table
export const projects = sqliteTable('project', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  status: text('status').notNull().default('active'), // 'active', 'archived', 'completed'
  ownerId: text('ownerId').notNull().references(() => users.id),
  startDate: integer('startDate', { mode: 'timestamp' }),
  endDate: integer('endDate', { mode: 'timestamp' }),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
});

// Priority table
export const priorities = sqliteTable('priority', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  level: integer('level').notNull(), // 1-5
  color: text('color'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
});

// Todo table
export const todos = sqliteTable('todo', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
  userId: text('userId').notNull().references(() => users.id),
  projectId: text('projectId').references(() => projects.id),
  priorityId: text('priorityId').references(() => priorities.id),
  parentId: text('parentId').references(() => todos.id), // Self-referential for subtasks
  sortOrder: integer('sortOrder').notNull().default(0),
  dueDate: integer('dueDate', { mode: 'timestamp' }),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
});

// Tag table
export const tags = sqliteTable('tag', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  color: text('color'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
});

// Junction table for many-to-many relationship between todos and tags
export const todoTags = sqliteTable('todo_tags', {
  id: text('id').primaryKey(),
  todoId: text('todoId').notNull().references(() => todos.id),
  tagId: text('tagId').notNull().references(() => tags.id),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
});

// Comment table
export const comments = sqliteTable('comment', {
  id: text('id').primaryKey(),
  content: text('content').notNull(),
  todoId: text('todoId').notNull().references(() => todos.id),
  userId: text('userId').notNull().references(() => users.id),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  todos: many(todos),
  projects: many(projects),
  comments: many(comments),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, { fields: [projects.ownerId], references: [users.id] }),
  todos: many(todos),
}));

export const todosRelations = relations(todos, ({ one, many }) => ({
  user: one(users, { fields: [todos.userId], references: [users.id] }),
  project: one(projects, { fields: [todos.projectId], references: [projects.id] }),
  priority: one(priorities, { fields: [todos.priorityId], references: [priorities.id] }),
  parent: one(todos, { fields: [todos.parentId], references: [todos.id] }),
  subtasks: many(todos),
  comments: many(comments),
  todoTags: many(todoTags),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  todoTags: many(todoTags),
}));

export const todoTagsRelations = relations(todoTags, ({ one }) => ({
  todo: one(todos, { fields: [todoTags.todoId], references: [todos.id] }),
  tag: one(tags, { fields: [todoTags.tagId], references: [tags.id] }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  todo: one(todos, { fields: [comments.todoId], references: [todos.id] }),
  user: one(users, { fields: [comments.userId], references: [users.id] }),
}));

export const prioritiesRelations = relations(priorities, ({ many }) => ({
  todos: many(todos),
}));
`;

			/**
			 * Step 3: Initialize Better Query with Drizzle adapter
			 * File: lib/query.ts
			 */
			const drizzleUsageExample = `
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { betterQuery, createResource } from 'better-query';
import { DrizzleCrudAdapter } from 'better-query/adapters';
import * as schema from './schema/drizzle';
import { z } from 'zod';

// Initialize Drizzle
const sqlite = new Database('todo.db');
const db = drizzle(sqlite, { schema });

// Define Zod schemas for validation
const userSchema = z.object({
  id: z.string().optional(),
  email: z.string().email(),
  name: z.string().min(1),
  avatar: z.string().url().optional(),
  role: z.enum(['admin', 'user', 'guest']).default('user'),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

const projectSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['active', 'archived', 'completed']).default('active'),
  ownerId: z.string(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

const todoSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  completed: z.boolean().default(false),
  userId: z.string(),
  projectId: z.string().optional(),
  priorityId: z.string().optional(),
  parentId: z.string().optional(),
  sortOrder: z.number().int().default(0),
  dueDate: z.date().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

// Create resources
const userResource = createResource({
  name: 'user',
  schema: userSchema,
  relationships: {
    todos: { type: 'hasMany', target: 'todo', foreignKey: 'userId' },
    projects: { type: 'hasMany', target: 'project', foreignKey: 'ownerId' },
    comments: { type: 'hasMany', target: 'comment', foreignKey: 'userId' },
  },
});

const projectResource = createResource({
  name: 'project',
  schema: projectSchema,
  relationships: {
    owner: { type: 'belongsTo', target: 'user', foreignKey: 'ownerId' },
    todos: { type: 'hasMany', target: 'todo', foreignKey: 'projectId' },
  },
});

const todoResource = createResource({
  name: 'todo',
  schema: todoSchema,
  relationships: {
    user: { type: 'belongsTo', target: 'user', foreignKey: 'userId' },
    project: { type: 'belongsTo', target: 'project', foreignKey: 'projectId' },
    priority: { type: 'belongsTo', target: 'priority', foreignKey: 'priorityId' },
    parent: { type: 'belongsTo', target: 'todo', foreignKey: 'parentId' },
    subtasks: { type: 'hasMany', target: 'todo', foreignKey: 'parentId' },
    comments: { type: 'hasMany', target: 'comment', foreignKey: 'todoId' },
    tags: { 
      type: 'belongsToMany', 
      target: 'tag', 
      through: 'todo_tags',
      foreignKey: 'todoId',
      targetKey: 'tagId'
    },
  },
});

// Initialize Better Query with Drizzle adapter
export const query = betterQuery({
  basePath: '/api/query',
  database: {
    adapter: new DrizzleCrudAdapter(db, {
      user: schema.users,
      project: schema.projects,
      todo: schema.todos,
      tag: schema.tags,
      todo_tags: schema.todoTags,
      comment: schema.comments,
      priority: schema.priorities,
    }),
  },
  resources: [userResource, projectResource, todoResource],
});

// Usage examples:

// Create a todo
const newTodo = await query.context.adapter.create({
  model: 'todo',
  data: {
    id: 'todo-1',
    title: 'Complete project',
    description: 'Finish the TODO app with Drizzle',
    completed: false,
    userId: 'user-1',
    projectId: 'project-1',
    priorityId: 'priority-high',
    sortOrder: 1,
  },
});

// Read todo with relationships using Drizzle's query API
const todoWithRelations = await query.context.adapter.findFirst({
  model: 'todo',
  where: [{ field: 'id', value: 'todo-1' }],
  include: { include: ['user', 'project', 'priority', 'comments', 'tags'] },
});

// Update todo
const updatedTodo = await query.context.adapter.update({
  model: 'todo',
  where: [{ field: 'id', value: 'todo-1' }],
  data: { completed: true },
});

// Delete todo
await query.context.adapter.delete({
  model: 'todo',
  where: [{ field: 'id', value: 'todo-1' }],
});

// Custom Drizzle operations
await query.context.adapter.executeCustomOperation('batchInsert', {
  model: 'todo',
  data: [
    { title: 'Task 1', userId: 'user-1' },
    { title: 'Task 2', userId: 'user-1' },
    { title: 'Task 3', userId: 'user-1' },
  ],
});
`;

			expect(drizzleSchemaExample).toBeDefined();
			expect(drizzleUsageExample).toBeDefined();
		});
	});

	describe("Prisma ORM Example", () => {
		it("should demonstrate Prisma setup and usage", () => {
			/**
			 * Step 1: Install Prisma dependencies
			 * ```bash
			 * pnpm add @prisma/client
			 * pnpm add -D prisma
			 * npx prisma init
			 * ```
			 */

			/**
			 * Step 2: Define Prisma schema
			 * File: prisma/schema.prisma
			 */
			const prismaSchemaExample = `
datasource db {
  provider = "sqlite"
  url      = "file:./todo.db"
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String    @id @default(cuid())
  email     String    @unique
  name      String
  avatar    String?
  role      String    @default("user") // 'admin', 'user', 'guest'
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  
  // Relations
  todos     Todo[]
  projects  Project[]
  comments  Comment[]
}

model Project {
  id          String    @id @default(cuid())
  name        String
  description String?
  status      String    @default("active") // 'active', 'archived', 'completed'
  ownerId     String
  startDate   DateTime?
  endDate     DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  // Relations
  owner       User      @relation(fields: [ownerId], references: [id])
  todos       Todo[]
}

model Priority {
  id        String   @id @default(cuid())
  name      String
  level     Int      // 1-5
  color     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  todos     Todo[]
}

model Todo {
  id          String    @id @default(cuid())
  title       String
  description String?
  completed   Boolean   @default(false)
  userId      String
  projectId   String?
  priorityId  String?
  parentId    String?   // Self-referential for subtasks
  sortOrder   Int       @default(0)
  dueDate     DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  // Relations
  user        User      @relation(fields: [userId], references: [id])
  project     Project?  @relation(fields: [projectId], references: [id])
  priority    Priority? @relation(fields: [priorityId], references: [id])
  parent      Todo?     @relation("TodoSubtasks", fields: [parentId], references: [id])
  subtasks    Todo[]    @relation("TodoSubtasks")
  comments    Comment[]
  tags        TodoTag[]
}

model Tag {
  id        String    @id @default(cuid())
  name      String    @unique
  color     String?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  
  // Relations
  todos     TodoTag[]
}

model TodoTag {
  id        String   @id @default(cuid())
  todoId    String
  tagId     String
  createdAt DateTime @default(now())
  
  // Relations
  todo      Todo     @relation(fields: [todoId], references: [id])
  tag       Tag      @relation(fields: [tagId], references: [id])
  
  @@unique([todoId, tagId])
}

model Comment {
  id        String   @id @default(cuid())
  content   String
  todoId    String
  userId    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  todo      Todo     @relation(fields: [todoId], references: [id])
  user      User     @relation(fields: [userId], references: [id])
}
`;

			/**
			 * Step 3: Generate Prisma client
			 * ```bash
			 * npx prisma generate
			 * npx prisma db push
			 * ```
			 */

			/**
			 * Step 4: Initialize Better Query with Prisma adapter
			 * File: lib/query.ts
			 */
			const prismaUsageExample = `
import { PrismaClient } from '@prisma/client';
import { betterQuery, createResource } from 'better-query';
import { PrismaCrudAdapter } from 'better-query/adapters';
import { z } from 'zod';

// Initialize Prisma
const prisma = new PrismaClient();

// Define Zod schemas for validation (same as Drizzle example)
const userSchema = z.object({
  id: z.string().optional(),
  email: z.string().email(),
  name: z.string().min(1),
  avatar: z.string().url().optional(),
  role: z.enum(['admin', 'user', 'guest']).default('user'),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

const todoSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  completed: z.boolean().default(false),
  userId: z.string(),
  projectId: z.string().optional(),
  priorityId: z.string().optional(),
  parentId: z.string().optional(),
  sortOrder: z.number().int().default(0),
  dueDate: z.date().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

// Create resources (same structure as Drizzle)
const userResource = createResource({
  name: 'user',
  schema: userSchema,
  relationships: {
    todos: { type: 'hasMany', target: 'todo', foreignKey: 'userId' },
    projects: { type: 'hasMany', target: 'project', foreignKey: 'ownerId' },
    comments: { type: 'hasMany', target: 'comment', foreignKey: 'userId' },
  },
});

const todoResource = createResource({
  name: 'todo',
  schema: todoSchema,
  relationships: {
    user: { type: 'belongsTo', target: 'user', foreignKey: 'userId' },
    project: { type: 'belongsTo', target: 'project', foreignKey: 'projectId' },
    priority: { type: 'belongsTo', target: 'priority', foreignKey: 'priorityId' },
    parent: { type: 'belongsTo', target: 'todo', foreignKey: 'parentId' },
    subtasks: { type: 'hasMany', target: 'todo', foreignKey: 'parentId' },
    comments: { type: 'hasMany', target: 'comment', foreignKey: 'todoId' },
    tags: { 
      type: 'belongsToMany', 
      target: 'tag', 
      through: 'todoTag',
      foreignKey: 'todoId',
      targetKey: 'tagId'
    },
  },
});

// Initialize Better Query with Prisma adapter
export const query = betterQuery({
  basePath: '/api/query',
  database: {
    adapter: new PrismaCrudAdapter(prisma),
  },
  resources: [userResource, todoResource],
});

// Usage examples:

// Create a todo
const newTodo = await query.context.adapter.create({
  model: 'todo',
  data: {
    title: 'Complete project',
    description: 'Finish the TODO app with Prisma',
    completed: false,
    userId: 'user-1',
    projectId: 'project-1',
    priorityId: 'priority-high',
    sortOrder: 1,
  },
});

// Read todo with relationships using Prisma's include
const todoWithRelations = await query.context.adapter.findFirst({
  model: 'todo',
  where: [{ field: 'id', value: newTodo.id }],
  include: {
    include: ['user', 'project', 'priority', 'comments', 'tags'],
  },
});

// Update todo
const updatedTodo = await query.context.adapter.update({
  model: 'todo',
  where: [{ field: 'id', value: newTodo.id }],
  data: { completed: true, updatedAt: new Date() },
});

// Delete todo with cascade
await query.context.adapter.delete({
  model: 'todo',
  where: [{ field: 'id', value: newTodo.id }],
  cascade: true, // Will also delete related comments
});

// Custom Prisma operations
await query.context.adapter.executeCustomOperation('createMany', {
  model: 'todo',
  data: [
    { title: 'Task 1', userId: 'user-1' },
    { title: 'Task 2', userId: 'user-1' },
    { title: 'Task 3', userId: 'user-1' },
  ],
  skipDuplicates: true,
});

// Prisma transaction
await query.context.adapter.executeCustomOperation('transaction', {
  operations: [
    { model: 'todo', operation: 'create', data: { title: 'Task A', userId: 'user-1' } },
    { model: 'comment', operation: 'create', data: { content: 'Great!', todoId: 'todo-1', userId: 'user-1' } },
  ],
});

// Prisma aggregations
const todoStats = await query.context.adapter.executeCustomOperation('aggregate', {
  model: 'todo',
  where: { userId: 'user-1' },
  _count: true,
  _avg: { sortOrder: true },
  _sum: { sortOrder: true },
});
`;

			expect(prismaSchemaExample).toBeDefined();
			expect(prismaUsageExample).toBeDefined();
		});
	});

	describe("Comparison: Drizzle vs Prisma", () => {
		it("should highlight key differences and use cases", () => {
			const comparison = {
				drizzle: {
					pros: [
						"TypeScript-first, fully type-safe queries",
						"Lightweight and performant",
						"SQL-like query builder",
						"Direct database access with full control",
						"Great for complex queries",
						"Better for microservices",
					],
					cons: [
						"Less mature ecosystem",
						"Manual migration management",
						"More setup required",
					],
					bestFor: [
						"Performance-critical applications",
						"Complex SQL queries",
						"Developers who prefer SQL-like syntax",
						"Projects requiring fine-grained control",
					],
				},
				prisma: {
					pros: [
						"Mature ecosystem with excellent tooling",
						"Auto-generated migrations",
						"Intuitive schema definition",
						"Great developer experience",
						"Built-in connection pooling",
						"Excellent documentation",
					],
					cons: [
						"Heavier runtime overhead",
						"Less control over generated SQL",
						"Can be slower for complex queries",
					],
					bestFor: [
						"Rapid application development",
						"Teams preferring declarative schemas",
						"Applications with standard CRUD operations",
						"Projects prioritizing developer experience",
					],
				},
				betterQuery: {
					advantage: [
						"Unified API across both ORMs",
						"Automatic CRUD endpoint generation",
						"Built-in relationship management",
						"Type-safe client/server communication",
						"Switch between ORMs without changing application code",
					],
				},
			};

			expect(comparison.drizzle.pros.length).toBeGreaterThan(0);
			expect(comparison.prisma.pros.length).toBeGreaterThan(0);
			expect(comparison.betterQuery.advantage.length).toBeGreaterThan(0);
		});
	});

	describe("Advanced Patterns", () => {
		it("should demonstrate complex relationship queries", () => {
			/**
			 * Example: Get all todos for a project with nested relationships
			 */
			const complexQueryExample = `
// Get project with all todos, their comments, and user info
const projectData = await adapter.findFirst({
  model: 'project',
  where: [{ field: 'id', value: 'project-1' }],
  include: {
    include: [
      'owner',
      {
        relation: 'todos',
        include: ['user', 'priority', 'comments', 'tags', 'subtasks'],
      },
    ],
  },
});

// Result structure:
{
  id: 'project-1',
  name: 'Website Redesign',
  owner: {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
  },
  todos: [
    {
      id: 'todo-1',
      title: 'Design homepage',
      user: { id: 'user-1', name: 'John Doe' },
      priority: { id: 'priority-high', name: 'High', level: 5 },
      comments: [
        { id: 'comment-1', content: 'Looking good!', user: {...} },
      ],
      tags: [
        { id: 'tag-1', name: 'design' },
        { id: 'tag-2', name: 'urgent' },
      ],
      subtasks: [
        { id: 'todo-2', title: 'Create wireframes', parentId: 'todo-1' },
      ],
    },
  ],
}
`;

			expect(complexQueryExample).toBeDefined();
		});

		it("should demonstrate pagination and filtering", () => {
			const paginationExample = `
// Get incomplete todos with pagination
const todos = await adapter.findMany({
  model: 'todo',
  where: [
    { field: 'completed', value: false },
    { field: 'projectId', value: 'project-1' },
  ],
  include: { include: ['user', 'priority'] },
  orderBy: [
    { field: 'priority.level', direction: 'desc' },
    { field: 'sortOrder', direction: 'asc' },
  ],
  limit: 20,
  offset: 0,
});

// Count total for pagination
const totalCount = await adapter.count({
  model: 'todo',
  where: [
    { field: 'completed', value: false },
    { field: 'projectId', value: 'project-1' },
  ],
});

const totalPages = Math.ceil(totalCount / 20);
`;

			expect(paginationExample).toBeDefined();
		});

		it("should demonstrate batch operations", () => {
			const batchExample = `
// Drizzle: Batch insert todos
await adapter.executeCustomOperation('batchInsert', {
  model: 'todo',
  data: [
    { title: 'Task 1', userId: 'user-1', projectId: 'project-1' },
    { title: 'Task 2', userId: 'user-1', projectId: 'project-1' },
    { title: 'Task 3', userId: 'user-2', projectId: 'project-1' },
  ],
});

// Prisma: Create many with skip duplicates
await adapter.executeCustomOperation('createMany', {
  model: 'todo',
  data: [
    { title: 'Task 1', userId: 'user-1', projectId: 'project-1' },
    { title: 'Task 2', userId: 'user-1', projectId: 'project-1' },
  ],
  skipDuplicates: true,
});

// Prisma: Update many
await adapter.executeCustomOperation('updateMany', {
  model: 'todo',
  where: { projectId: 'project-1', completed: false },
  data: { priorityId: 'priority-high' },
});
`;

			expect(batchExample).toBeDefined();
		});

		it("should demonstrate transaction handling", () => {
			const transactionExample = `
// Prisma: Transaction to create todo with tags
await adapter.executeCustomOperation('transaction', {
  operations: [
    {
      model: 'todo',
      operation: 'create',
      data: {
        id: 'todo-new',
        title: 'New task',
        userId: 'user-1',
      },
    },
    {
      model: 'todoTag',
      operation: 'create',
      data: {
        todoId: 'todo-new',
        tagId: 'tag-urgent',
      },
    },
    {
      model: 'todoTag',
      operation: 'create',
      data: {
        todoId: 'todo-new',
        tagId: 'tag-feature',
      },
    },
  ],
});

// Either all operations succeed or all fail
`;

			expect(transactionExample).toBeDefined();
		});
	});
});
