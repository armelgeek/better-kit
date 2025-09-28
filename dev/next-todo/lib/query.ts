import { betterQuery, createResource, withId } from "better-query";
import { z } from "zod";

// Todo Schema - Simple but elegant
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
      // dueDate is preprocessed by Zod already; ensure timestamps
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

// Exported Todo type inferred from schema
export type Todo = z.infer<typeof todoSchema>;

export const query = betterQuery({
  basePath: "/api/query",
  database: {
    provider: "sqlite",
    url: "todos.db",
    autoMigrate: true,
  },
  resources: [todoResource],
});