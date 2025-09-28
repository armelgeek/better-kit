import { betterQuery, createResource, withId } from "better-query";
import { z } from "zod";

// Todo Schema - Simple but elegant
const todoSchema = withId({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  completed: z.boolean().default(false),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  category: z.string().optional(),
  dueDate: z.date().optional(),
  tags: z.array(z.string()).default([]),
});

// Create todo resource with full CRUD operations
const todoResource = createResource({
  name: "todo",
  schema: todoSchema,
  permissions: {
    create: () => true,
    read: () => true,
    update: () => true,
    delete: () => true,
    list: () => true,
  },
  hooks: {

    beforeCreate: async (context) => {
      console.log("Creating todo:", context);
      // Auto-generate timestamps
      context.data.dueDate = context.data.dueDate ? new Date(context.data.dueDate) : undefined;
      context.data.createdAt = new Date();
      context.data.updatedAt = new Date();
    },
    beforeUpdate: async (context) => {
      // Update timestamp
      context.data.updatedAt = new Date();
    },
  },
});

// Initialize Better Query
export const query = betterQuery({
  basePath: "/api/query",
  database: {
    provider: "sqlite",
    url: "todos.db",
    autoMigrate: true,
  },
  resources: [todoResource],
});