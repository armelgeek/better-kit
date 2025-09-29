import { betterQuery, createResource, withId } from "better-query";
// Note: In a real project, you would import from "better-query/plugins"
// import { betterAuth as betterAuthPlugin } from "better-query/plugins";
import { auth } from "./auth";
import { z } from "zod";
import { headers } from "next/headers";

// Mock Better Auth plugin implementation for demonstration
// In a real project, this would be imported from better-query/plugins
const mockBetterAuthPlugin = (options: any) => ({
  id: 'better-auth',
  // Mock plugin implementation
  init: async (context: any) => {
    console.log("Mock Better Auth plugin initialized");
  },
  middleware: [],
  hooks: {},
});

// Todo Schema - Enhanced with user ownership
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
  permissions: {
    create: async (context) => {
      console.log('Create context user:', context.user);
      return true;
    },
    read: async (context) => {
      // For demo: allow all operations
      // In real Better Auth integration: check user ownership
      return true;
    },
    update: async (context) => {
      // For demo: allow all operations
      // In real Better Auth integration: check user ownership or admin role
      return true;
    },
    delete: async (context) => {
      // For demo: allow all operations
      // In real Better Auth integration: check user ownership or admin role
      return true;
    },
    list: async (context) => {
      // For demo: allow all operations
      // In real Better Auth integration: return !!context.user;
      return true;
    },
  },
  hooks: {
    beforeCreate: async (context) => {
      const session = await auth.api.getSession({
        headers: await headers()
      })
      console.log('Before create session user:', session?.user);
      context.user =  session?.user;
      context.data.createdAt = new Date();
      context.data.updatedAt = new Date();
    },
    beforeUpdate: async (context) => {
      context.data.updatedAt = new Date();
    },
    afterCreate: async (context) => {
      console.log(`Todo created:`, context.result.title);
    }
  }

});

export type Todo = z.infer<typeof todoSchema>;

export const query = betterQuery({
  basePath: "/api/query",
  database: {
    provider: "sqlite",
    url: "todos.db",
    autoMigrate: true,
  },
  plugins: [],
  resources: [todoResource],
});