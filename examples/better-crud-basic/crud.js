import { betterCrud, createResource, productSchema, categorySchema } from "better-crud";
import { z } from "zod";

// Define a custom schema
const userSchema = z.object({
  id: z.string().optional(),
  email: z.string().email("Valid email is required"),
  name: z.string().min(1, "Name is required"),
  role: z.enum(["user", "admin"]).default("user"),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

// Create the CRUD instance
export const crud = betterCrud({
  resources: [
    createResource({
      name: "product",
      schema: productSchema,
      permissions: {
        create: () => true,
        read: () => true,
        update: () => true,
        delete: () => false, // Disable product deletion
        list: () => true,
      },
    }),
    createResource({
      name: "category",
      schema: categorySchema,
    }),
    createResource({
      name: "user",
      schema: userSchema,
      permissions: {
        create: () => true,
        read: () => true,
        update: (context) => {
          // Users can only update their own profiles
          return context.user?.id === context.id || context.user?.role === "admin";
        },
        delete: (context) => {
          // Only admins can delete users
          return context.user?.role === "admin";
        },
        list: (context) => {
          // Only admins can list all users
          return context.user?.role === "admin";
        },
      },
    }),
  ],
  database: {
    provider: "sqlite",
    url: "sqlite:./example.db",
    autoMigrate: true,
  },
  basePath: "/api",
});

console.log("CRUD instance created successfully!");
console.log("Available endpoints:");
console.log("- POST /api/product - Create product");
console.log("- GET /api/product/:id - Get product");
console.log("- PATCH /api/product/:id - Update product");
console.log("- GET /api/products - List products");
console.log("- POST /api/category - Create category");
console.log("- GET /api/category/:id - Get category");
console.log("- PATCH /api/category/:id - Update category");
console.log("- DELETE /api/category/:id - Delete category");
console.log("- GET /api/categories - List categories");
console.log("- POST /api/user - Create user");
console.log("- GET /api/user/:id - Get user");
console.log("- PATCH /api/user/:id - Update user");
console.log("- DELETE /api/user/:id - Delete user");
console.log("- GET /api/users - List users");