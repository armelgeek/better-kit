import { betterQuery, createResource, withId } from "better-query";
import { betterAuth as betterAuthPlugin } from "better-query/plugins";
import { auth } from "./auth";
import { z } from "zod";

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
  // User ownership fields
  userId: z.string(), // Links to the authenticated user
  createdBy: z.string().optional(), // Name of user who created it
});

// Create todo resource with authentication-based permissions
const todoResource = createResource({
  name: "todo",
  schema: todoSchema,
  permissions: {
    create: async (context) => {
      // Only authenticated users can create todos
      return !!context.user;
    },
    read: async (context) => {
      // Users can only read their own todos, admins can read all
      if (!context.user) return false;
      if (context.user.role === "admin") return true;
      return context.existingData?.userId === context.user.id;
    },
    update: async (context) => {
      // Users can only update their own todos, admins can update all
      if (!context.user) return false;
      if (context.user.role === "admin") return true;
      return context.existingData?.userId === context.user.id;
    },
    delete: async (context) => {
      // Users can only delete their own todos, admins can delete all
      if (!context.user) return false;
      if (context.user.role === "admin") return true;
      return context.existingData?.userId === context.user.id;
    },
    list: async (context) => {
      // Only authenticated users can list todos
      return !!context.user;
    },
  },
  hooks: {
    beforeCreate: async (context) => {
      // Auto-assign user ID and creator info
      if (context.user) {
        context.data.userId = context.user.id;
        context.data.createdBy = context.user.name || context.user.email;
      }
      context.data.createdAt = new Date();
      context.data.updatedAt = new Date();
    },
    beforeUpdate: async (context) => {
      // Update timestamp
      context.data.updatedAt = new Date();
    },
    beforeList: async (context) => {
      // Filter list results by user (non-admins see only their todos)
      if (context.user && context.user.role !== "admin") {
        context.query = context.query || {};
        context.query.where = {
          ...context.query.where,
          userId: context.user.id,
        };
      }
    },
    afterCreate: async (context) => {
      console.log(`Todo created by ${context.user?.name || 'Unknown'}:`, context.result.title);
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
  plugins: [
    betterAuthPlugin({
      auth, // Pass the Better Auth instance
      rolePermissions: {
        admin: {
          resources: ["*"],
          operations: ["create", "read", "update", "delete", "list"],
          scopes: ["admin", "write", "read"]
        },
        user: {
          resources: ["todo"],
          operations: ["create", "read", "update", "delete", "list"],
          scopes: ["read", "write"]
        }
      },
      defaultRole: "user",
    })
  ],
  resources: [todoResource],
});