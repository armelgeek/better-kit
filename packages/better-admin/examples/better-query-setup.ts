import { betterQuery, createResource, withId } from "better-query";
import { betterAuth } from "better-auth";
import { z } from "zod";

// Better Auth setup
export const auth = betterAuth({
  database: { provider: "sqlite", url: "auth.db" },
  secret: process.env.BETTER_AUTH_SECRET!,
  emailAndPassword: { enabled: true },
});

// Define your schemas with validation
const userSchema = withId({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "user"]).default("user"),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

const postSchema = withId({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  content: z.string().min(1, "Content is required"),
  authorId: z.string().uuid("Invalid author ID"),
  published: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

const commentSchema = withId({
  content: z.string().min(1, "Comment is required").max(500, "Comment too long"),
  postId: z.string().uuid("Invalid post ID"),
  authorId: z.string().uuid("Invalid author ID"),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

// Create Better Query instance with comprehensive resource definitions
export const query = betterQuery({
  basePath: "/api/query",
  database: { 
    provider: "sqlite", 
    url: "data.db", 
    autoMigrate: true 
  },
  resources: [
    createResource({
      name: "user",
      schema: userSchema,
      permissions: {
        create: () => true, // Allow user registration
        read: () => true,   // Allow reading user profiles
        update: async (context) => {
          // Users can update their own profile, admins can update anyone
          const user = context.user as { id: string; role?: string };
          return user?.role === "admin" || context.existingData?.id === user?.id;
        },
        delete: async (context) => {
          // Only admins can delete users
          const user = context.user as { role?: string };
          return user?.role === "admin";
        },
        list: () => true,
      },
    }),
    
    createResource({
      name: "post",
      schema: postSchema,
      permissions: {
        create: async (context) => !!context.user, // Authenticated users only
        read: () => true, // Anyone can read posts
        update: async (context) => {
          // Authors can update their own posts, admins can update any post
          const user = context.user as { id: string; role?: string };
          return user?.role === "admin" || context.existingData?.authorId === user?.id;
        },
        delete: async (context) => {
          // Authors can delete their own posts, admins can delete any post
          const user = context.user as { id: string; role?: string };
          return user?.role === "admin" || context.existingData?.authorId === user?.id;
        },
        list: () => true,
      },
      // Add relationships
      relations: {
        author: {
          type: "many-to-one",
          target: "user",
          foreignKey: "authorId",
        },
        comments: {
          type: "one-to-many",
          target: "comment",
          foreignKey: "postId",
        },
      },
    }),
    
    createResource({
      name: "comment",
      schema: commentSchema,
      permissions: {
        create: async (context) => !!context.user, // Authenticated users only
        read: () => true, // Anyone can read comments
        update: async (context) => {
          // Authors can update their own comments, admins can update any comment
          const user = context.user as { id: string; role?: string };
          return user?.role === "admin" || context.existingData?.authorId === user?.id;
        },
        delete: async (context) => {
          // Authors can delete their own comments, admins can delete any comment
          const user = context.user as { id: string; role?: string };
          return user?.role === "admin" || context.existingData?.authorId === user?.id;
        },
        list: () => true,
      },
      relations: {
        post: {
          type: "many-to-one",
          target: "post",
          foreignKey: "postId",
        },
        author: {
          type: "many-to-one",
          target: "user",
          foreignKey: "authorId",
        },
      },
    }),
  ],
  
  // Enable Better Auth plugin for authentication
  plugins: [
    // betterAuth integration would go here
    // This would provide user context for permissions
  ],
});

// Export types for frontend use
export type User = z.infer<typeof userSchema>;
export type Post = z.infer<typeof postSchema>;
export type Comment = z.infer<typeof commentSchema>;