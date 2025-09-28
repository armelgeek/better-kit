import { describe, it, expect } from "vitest";
import { betterQuery } from "./query";
import { createResource, withId } from "./index";
import { validationPlugin } from "./plugins/validation";
import { z } from "zod";
import Database from "better-sqlite3";

/**
 * End-to-end test demonstrating the hook execution priority fix.
 * This test validates that resource hooks run before plugin hooks,
 * allowing data transformation before validation.
 */
describe("Hook Priority End-to-End Test", () => {
  it("should allow date string transformation in beforeCreate hook before validation", async () => {
    // Create schema that expects Date objects
    const todoSchema = withId({
      title: z.string().min(1, "Title is required"),
      description: z.string().optional(),
      completed: z.boolean().default(false),
      priority: z.enum(["low", "medium", "high"]).default("medium"),
      category: z.string().optional(),
      dueDate: z.date().optional(),
      createdAt: z.date().optional(),
      updatedAt: z.date().optional(),
    });

    // Create resource with beforeCreate hook that transforms date strings
    const todoResource = createResource({
      name: "todo",
      schema: todoSchema,
      hooks: {
        beforeCreate: async (context) => {
          // Transform date string to Date object (common use case from frontend)
          if (context.data.dueDate && typeof context.data.dueDate === 'string') {
            context.data.dueDate = new Date(context.data.dueDate);
          }
          // Add timestamps
          context.data.createdAt = new Date();
          context.data.updatedAt = new Date();
        },
        beforeUpdate: async (context) => {
          // Transform date string to Date object for updates
          if (context.data.dueDate && typeof context.data.dueDate === 'string') {
            context.data.dueDate = new Date(context.data.dueDate);
          }
          context.data.updatedAt = new Date();
        }
      },
    });

    // Create validation plugin that enforces schema validation
    const validation = validationPlugin({
      strict: true,
      rules: {
        todo: {
          create: todoSchema,
          update: todoSchema.partial(),
        },
      },
    });

    // Create in-memory database
    const db = new Database(":memory:");

    // Create query instance with validation plugin
    const query = betterQuery({
      database: {
        provider: "sqlite",
        url: ":memory:",
        autoMigrate: true,
      },
      resources: [todoResource],
      plugins: [validation],
    });

    // Create todo data with date string (typical from HTML date input)
    const todoData = {
      title: "Test Todo with Date String",
      description: "Testing date transformation",
      priority: "high" as const,
      category: "work",
      dueDate: "2024-02-15", // String that needs to be converted to Date
    };

    // This should work because:
    // 1. Resource beforeCreate hook runs first, transforming dueDate string to Date
    // 2. Validation plugin runs second, validating the transformed data with Date object
    const createContext = {
      user: { id: "user123" },
      resource: "todo",
      operation: "create" as const,
      data: { ...todoData },
      adapter: {
        context: {
          pluginManager: query.context.pluginManager,
        },
      },
    };

    // Execute the hooks in the correct order
    await todoResource.hooks!.beforeCreate!(createContext);

    // Verify data was transformed correctly
    expect(createContext.data.dueDate).toBeInstanceOf(Date);
    expect(createContext.data.createdAt).toBeInstanceOf(Date);
    expect(createContext.data.updatedAt).toBeInstanceOf(Date);
    expect(createContext.data.title).toBe("Test Todo with Date String");
    expect(createContext.data.priority).toBe("high");

    // Verify schema validation passes with transformed data
    const parsedData = todoSchema.parse(createContext.data);
    expect(parsedData.dueDate).toBeInstanceOf(Date);
    expect(parsedData.title).toBe("Test Todo with Date String");
  });

  it("should allow partial date transformation in beforeUpdate hook", async () => {
    const todoSchema = withId({
      title: z.string().min(1, "Title is required"),
      dueDate: z.date().optional(),
      updatedAt: z.date().optional(),
    });

    const todoResource = createResource({
      name: "todo",
      schema: todoSchema,
      hooks: {
        beforeUpdate: async (context) => {
          // Transform date string for updates
          if (context.data.dueDate && typeof context.data.dueDate === 'string') {
            context.data.dueDate = new Date(context.data.dueDate);
          }
          context.data.updatedAt = new Date();
        }
      },
    });

    const validation = validationPlugin({
      strict: true,
      rules: {
        todo: {
          update: todoSchema.partial(),
        },
      },
    });

    const query = betterQuery({
      database: {
        provider: "sqlite",
        url: ":memory:",
        autoMigrate: true,
      },
      resources: [todoResource],
      plugins: [validation],
    });

    // Update with only a date change (partial update)
    const updateData = {
      dueDate: "2024-03-20", // String that needs conversion
    };

    const updateContext = {
      user: { id: "user123" },
      resource: "todo",
      operation: "update" as const,
      data: { ...updateData },
      id: "todo123",
      existingData: { id: "todo123", title: "Existing Todo" },
      adapter: {
        context: {
          pluginManager: query.context.pluginManager,
        },
      },
    };

    // Execute update hooks
    await todoResource.hooks!.beforeUpdate!(updateContext);

    // Verify transformation worked
    expect(updateContext.data.dueDate).toBeInstanceOf(Date);
    expect(updateContext.data.updatedAt).toBeInstanceOf(Date);

    // Verify partial schema validation passes
    const parsedData = todoSchema.partial().parse(updateContext.data);
    expect(parsedData.dueDate).toBeInstanceOf(Date);
  });

  it("should handle validation errors after transformation correctly", async () => {
    const todoSchema = withId({
      title: z.string().min(1, "Title is required"),
      priority: z.enum(["low", "medium", "high"]),
      dueDate: z.date().optional(),
    });

    const todoResource = createResource({
      name: "todo",
      schema: todoSchema,
      hooks: {
        beforeCreate: async (context) => {
          // Transform date (this should work)
          if (context.data.dueDate && typeof context.data.dueDate === 'string') {
            context.data.dueDate = new Date(context.data.dueDate);
          }
          // But we won't fix the invalid priority (this should fail validation)
        }
      },
    });

    const validation = validationPlugin({
      strict: true,
      rules: {
        todo: {
          create: todoSchema,
        },
      },
    });

    // Data with invalid priority that won't be fixed by transformation
    const invalidData = {
      title: "Test Todo",
      priority: "invalid_priority" as any, // This will fail validation
      dueDate: "2024-02-15", // This will be transformed successfully
    };

    const createContext = {
      user: { id: "user123" },
      resource: "todo",
      operation: "create" as const,
      data: { ...invalidData },
      adapter: {
        context: {
          pluginManager: {
            executeHook: async (hookName: string, context: any) => {
              if (hookName === 'beforeCreate' && validation.hooks?.beforeCreate) {
                await validation.hooks.beforeCreate(context);
              }
            }
          },
        },
      },
    };

    // Execute resource hook first (transforms date)
    await todoResource.hooks!.beforeCreate!(createContext);

    // Verify date was transformed
    expect(createContext.data.dueDate).toBeInstanceOf(Date);

    // But validation should still fail due to invalid priority
    let validationError: any = null;
    try {
      await createContext.adapter.context.pluginManager.executeHook('beforeCreate', createContext);
    } catch (error) {
      validationError = error;
    }

    expect(validationError).toBeDefined();
    expect(validationError.errors).toContain('priority: Invalid enum value. Expected \'low\' | \'medium\' | \'high\', received \'invalid_priority\'');
  });
});