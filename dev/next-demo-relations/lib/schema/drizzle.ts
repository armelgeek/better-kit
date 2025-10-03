import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

/**
 * Drizzle Schema demonstrating various relationship types:
 * - hasMany: User → Todos, Projects, Comments
 * - belongsTo: Todo → User, Project, Priority
 * - belongsToMany: Todo ↔ Tags (through junction table)
 * - Self-referential: Todo → Subtasks
 */

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

// Define relations for Drizzle
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
  parent: one(todos, { fields: [todos.parentId], references: [todos.id], relationName: 'subtasks' }),
  subtasks: many(todos, { relationName: 'subtasks' }),
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
