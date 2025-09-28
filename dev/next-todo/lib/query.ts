import { betterQuery, createResource, withId } from "better-query";
// Note: In a real project, you would import from "better-query/plugins"
// import { betterAuth as betterAuthPlugin } from "better-query/plugins";
import { auth } from "./auth";
import { z } from "zod";

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
  // User ownership fields (for when Better Auth is fully integrated)
  // userId: z.string().optional(), 
  // createdBy: z.string().optional(),
});

// Create todo resource with basic permissions for now
// In a real Better Auth integration, these would be authentication-based
const todoResource = createResource({
  name: "todo",
  schema: todoSchema,
  permissions: {
    create: async (context) => {
      // For demo: allow all operations
      // In real Better Auth integration: return !!context.user;
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
      // For demo: basic timestamps
      // In real Better Auth integration: auto-assign user ID
      // if (context.user) {
      //   context.data.userId = context.user.id;
      //   context.data.createdBy = context.user.name || context.user.email;
      // }
      context.data.createdAt = new Date();
      context.data.updatedAt = new Date();
    },
    beforeUpdate: async (context) => {
      context.data.updatedAt = new Date();
    },
    // In real Better Auth integration: filter by user
    // beforeList: async (context) => {
    //   if (context.user && context.user.role !== "admin") {
    //     context.query = context.query || {};
    //     context.query.where = {
    //       ...context.query.where,
    //       userId: context.user.id,
    //     };
    //   }
    // },
    afterCreate: async (context) => {
      console.log(`Todo created:`, context.result.title);
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
  // For demo: commented out Better Auth plugin
  // In a real project with better-auth installed:
  // plugins: [
  //   betterAuthPlugin({
  //     auth, // Pass the Better Auth instance
  //     rolePermissions: {
  //       admin: {
  //         resources: ["*"],
  //         operations: ["create", "read", "update", "delete", "list"],
  //         scopes: ["admin", "write", "read"]
  //       },
  //       user: {
  //         resources: ["todo"],
  //         operations: ["create", "read", "update", "delete", "list"],
  //         scopes: ["read", "write"]
  //       }
  //     },
  //     defaultRole: "user",
  //   })
  // ],
  resources: [todoResource],
});