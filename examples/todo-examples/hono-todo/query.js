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
});

// Create todo resource with full CRUD operations
const todoResource = createResource({
  name: "todo",
  schema: todoSchema,
  permissions: {
    create: () => true, // Anyone can create todos
    read: () => true,   // Anyone can read todos  
    update: () => true, // Anyone can update todos
    delete: () => true, // Anyone can delete todos
    list: () => true,   // Anyone can list todos
  },
});

// Initialize Better Query with SQLite database
export const query = betterQuery({
  basePath: "/api/query",
  database: {
    provider: "sqlite",
    url: "todos.db",
    autoMigrate: true,
  },
  resources: [todoResource],
});