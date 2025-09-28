import { betterQuery, createResource, withId } from "better-query";
import { z } from "zod";

// Todo Schema - Simple but elegant
export const todoSchema = withId({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  completed: z.boolean().default(false),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  category: z.string().optional(),
  dueDate: z.string().optional(),
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
      context.data.dueDate = context.data.dueDate ? new Date(context.data.dueDate) : undefined;
      context.data.tags = JSON.stringify(context.data.tags) || '[]';
      context.data.createdAt = new Date();
      context.data.updatedAt = new Date();
    },
    beforeUpdate: async (context) => {
      // Update timestamp
      console.log("Updating todo:", context);
      context.data.updatedAt = new Date();
    },
    afterCreate: async (context) => {
      console.log("Created todo:", context);
    }
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