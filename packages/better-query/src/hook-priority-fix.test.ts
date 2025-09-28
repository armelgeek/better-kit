import { describe, it, expect } from "vitest";
import { HookExecutor } from "./utils/hooks";
import { validationPlugin, ValidationError } from "./plugins/validation";
import { z } from "zod";

/**
 * Test that validates the hook execution priority fix.
 * Resource hooks should execute BEFORE plugin hooks to allow data transformation
 * before validation.
 */
describe("Hook Execution Priority Fix", () => {
  it("should execute resource hooks BEFORE plugin hooks", async () => {
    const executionOrder: string[] = [];
    
    const todoSchema = z.object({
      title: z.string(),
      dueDate: z.date().optional(),
    });

    // Create validation plugin that will fail if dueDate is a string
    const validationPluginInstance = validationPlugin({
      rules: {
        todo: {
          create: todoSchema,
        },
      },
    });

    // Mock plugin manager that tracks execution order and applies validation
    const mockPluginManager = {
      executeHook: async (hookName: string, context: any) => {
        executionOrder.push(`plugin-${hookName}`);
        // Apply the validation plugin hook
        if (hookName === 'beforeCreate' && validationPluginInstance.hooks?.beforeCreate) {
          await validationPluginInstance.hooks.beforeCreate(context);
        }
      }
    };

    // Resource hooks that transform string dates to Date objects
    const resourceHooks = {
      beforeCreate: async (context: any) => {
        executionOrder.push('resource-beforeCreate');
        
        // This is the typical data transformation that happens in resource hooks
        if (context.data.dueDate && typeof context.data.dueDate === 'string') {
          context.data.dueDate = new Date(context.data.dueDate);
        }
      }
    };

    const mockContext = {
      user: { id: "user123" },
      resource: "todo",
      operation: "create" as const,
      data: {
        title: "Test Todo",
        dueDate: "2024-01-15", // String that needs to be converted to Date
      },
      adapter: {
        context: {
          pluginManager: mockPluginManager
        }
      },
    };

    // Execute hooks using the current system
    await HookExecutor.executeBefore(resourceHooks, mockContext);

    // Verify execution order is correct (resource hooks first)
    expect(executionOrder).toEqual([
      'resource-beforeCreate',  // Should run first to transform data
      'plugin-beforeCreate'     // Should run second to validate transformed data
    ]);
    
    // Verify data transformation worked
    expect(mockContext.data.dueDate).toBeInstanceOf(Date);
    expect(mockContext.data.title).toBe("Test Todo");
  });

  it("should fail validation when hooks run in wrong order (current broken behavior)", async () => {
    const executionOrder: string[] = [];
    
    const todoSchema = z.object({
      title: z.string(),
      dueDate: z.date().optional(),
    });

    // Create validation plugin
    const validationPluginInstance = validationPlugin({
      rules: {
        todo: {
          create: todoSchema,
        },
      },
    });

    // Manually simulate the WRONG order (plugin hooks first) - this is the current broken behavior
    const mockContext = {
      user: { id: "user123" },
      resource: "todo",
      operation: "create" as const,
      data: {
        title: "Test Todo",
        dueDate: "2024-01-15", // String that would be valid after transformation
      },
      adapter: {},
    };

    // Simulate plugin hooks running first (validation before transformation)
    let validationError: any = null;
    try {
      if (validationPluginInstance.hooks?.beforeCreate) {
        await validationPluginInstance.hooks.beforeCreate(mockContext);
      }
    } catch (error) {
      validationError = error;
    }

    // Should fail because validation ran before data transformation
    expect(validationError).toBeInstanceOf(ValidationError);
    expect(validationError.errors).toContain('dueDate: Expected date, received string');
  });

  it("should pass validation when hooks run in correct order", async () => {
    const todoSchema = z.object({
      title: z.string(),
      dueDate: z.date().optional(),
    });

    // Create validation plugin
    const validationPluginInstance = validationPlugin({
      rules: {
        todo: {
          create: todoSchema,
        },
      },
    });

    const mockContext = {
      user: { id: "user123" },
      resource: "todo",
      operation: "create" as const,
      data: {
        title: "Test Todo",
        dueDate: "2024-01-15", // String that needs transformation
      },
      adapter: {},
    };

    // Simulate CORRECT order: resource hooks first (transform data)
    if (mockContext.data.dueDate && typeof mockContext.data.dueDate === 'string') {
      mockContext.data.dueDate = new Date(mockContext.data.dueDate);
    }

    // Then plugin hooks (validate transformed data)
    let validationError: any = null;
    try {
      if (validationPluginInstance.hooks?.beforeCreate) {
        await validationPluginInstance.hooks.beforeCreate(mockContext);
      }
    } catch (error) {
      validationError = error;
    }

    // Should pass because validation ran after data transformation
    expect(validationError).toBeNull();
    expect(mockContext.data.dueDate).toBeInstanceOf(Date);
  });
});