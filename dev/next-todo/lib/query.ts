import { betterQuery, createResource, withId } from "better-query";
import { auth } from "./auth";
import { z } from "zod";
import { headers } from "next/headers";

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
  middlewares: [
    {
      handler: async (context) => {
        console.log('Todo resource middleware triggered', context);
        const session = await auth.api.getSession({
          headers: await headers()
        });
        console.log('Middleware session user:', session?.user);
        context.user = session?.user;
      }
    }
  ],
  permissions: {
    create: async (context) => {
      
      return !!context.user;
    },
    read: async (context) => {
      return !!context.user;
    },
    update: async (context) => {
      return !!context.user;
    },
    delete: async (context) => {
      return !!context.user;
    },
    list: async (context) => {
      return !!context.user;
    },
  },
  hooks: {
    beforeCreate: async (context) => {
      console.log('Before create hook user:', context.user);
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