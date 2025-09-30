# Plugin System Guide for Next-Todo

This guide explains how to use and create plugins in the Next-Todo application using Better Query's plugin system.

## What are Plugins?

Plugins are modular extensions that add functionality to your Better Query application. They can:
- Add hooks to the CRUD lifecycle (beforeCreate, afterUpdate, etc.)
- Add custom API endpoints
- Extend the database schema
- Add middleware for all operations
- Register new resources

## Built-in Plugins Used in This App

### 1. Audit Plugin

The audit plugin automatically logs all CRUD operations (create, update, delete) for tracking and debugging.

**Configuration:**
```typescript
auditPlugin({
  enabled: true,
  operations: ["create", "update", "delete"],
  includeRequestData: false,
  logger: (event) => {
    console.log(`[AUDIT] ${event.operation.toUpperCase()} on ${event.resource}`, {
      recordId: event.recordId,
      user: event.user?.email || "anonymous",
      timestamp: event.timestamp,
    });
  },
})
```

**What it does:**
- Logs when todos are created, updated, or deleted
- Captures user information (if authenticated)
- Records timestamps and affected record IDs
- Uses a custom logger function for console output

### 2. Cache Plugin

The cache plugin provides in-memory caching for read operations to improve performance.

**Configuration:**
```typescript
cachePlugin({
  enabled: true,
  defaultTTL: 300, // 5 minutes
  resources: {
    todo: {
      enabled: true,
      readTTL: 600, // 10 minutes for individual todos
      listTTL: 300, // 5 minutes for todo lists
    },
  },
})
```

**What it does:**
- Caches individual todo reads for 10 minutes
- Caches todo list results for 5 minutes
- Automatically invalidates cache on create/update/delete operations
- Improves response times for frequently accessed data

**Cache API endpoints:**
The cache plugin adds these endpoints:
- `GET /api/query/cache/stats` - Get cache statistics
- `DELETE /api/query/cache/clear` - Clear the entire cache
- `DELETE /api/query/cache/clear/:resource` - Clear cache for a specific resource

### 3. Validation Plugin

The validation plugin adds enhanced validation and data sanitization.

**Configuration:**
```typescript
validationPlugin({
  strict: true,
  globalRules: {
    trimStrings: true,
    validateEmails: true,
    sanitizeHtml: false,
  },
})
```

**What it does:**
- Automatically trims whitespace from string fields
- Validates email format for email fields
- Strict mode enforces all validation rules
- Prevents invalid data from being stored

## Custom Plugin: Timestamp Plugin

We created a custom plugin that automatically adds timestamps to todos.

**Location:** `lib/plugins/timestamp-plugin.ts`

**Implementation:**
```typescript
import { createPlugin } from "better-query/plugins";

export const timestampPlugin = createPlugin({
  id: "timestamp",
  hooks: {
    beforeCreate: async (context) => {
      // Add createdAt timestamp when creating a todo
      if (context.data) {
        context.data.createdAt = new Date();
        context.data.updatedAt = new Date();
      }
    },
    beforeUpdate: async (context) => {
      // Update the updatedAt timestamp when updating a todo
      if (context.data) {
        context.data.updatedAt = new Date();
      }
    },
    afterCreate: async (context) => {
      // Log when a todo is created (optional)
      console.log(`✅ Todo created: "${context.result.title}" at ${new Date().toISOString()}`);
    },
  },
});
```

**What it does:**
- Automatically sets `createdAt` and `updatedAt` on new todos
- Updates `updatedAt` on every todo update
- Logs a message when a todo is created

## Creating Your Own Plugin

### Basic Plugin Structure

A plugin is created using the `createPlugin` function:

```typescript
import { createPlugin } from "better-query/plugins";

export const myPlugin = createPlugin({
  id: "my-plugin", // Unique identifier
  
  // Hooks into the CRUD lifecycle
  hooks: {
    beforeCreate: async (context) => {
      // Run before creating a record
    },
    afterCreate: async (context) => {
      // Run after creating a record
    },
    beforeUpdate: async (context) => {
      // Run before updating a record
    },
    afterUpdate: async (context) => {
      // Run after updating a record
    },
    beforeDelete: async (context) => {
      // Run before deleting a record
    },
    afterDelete: async (context) => {
      // Run after deleting a record
    },
    beforeList: async (context) => {
      // Run before listing records
    },
    afterList: async (context) => {
      // Run after listing records
    },
  },
  
  // Custom API endpoints (optional)
  endpoints: {
    myEndpoint: {
      path: "/my-endpoint",
      method: "GET",
      handler: async (ctx) => ctx.json({ message: "Hello from my plugin!" }),
      options: { method: "GET" },
    },
  },
  
  // Database schema extensions (optional)
  schema: {
    my_table: {
      fields: {
        id: { type: "string", required: true },
        name: { type: "string", required: true },
      },
    },
  },
});
```

### Plugin Hook Context

Each hook receives a context object with:

- `context.resource` - The resource name (e.g., "todo")
- `context.operation` - The operation type (e.g., "create", "update")
- `context.data` - The data being created/updated
- `context.result` - The result after the operation (in after* hooks)
- `context.existingData` - The existing data (in update/delete operations)
- `context.user` - The authenticated user (if any)
- `context.query` - The query parameters (in list operations)

### Example: Notification Plugin

Here's an example of a plugin that sends notifications:

```typescript
export const notificationPlugin = createPlugin({
  id: "notifications",
  hooks: {
    afterCreate: async (context) => {
      if (context.resource === "todo") {
        // Send notification when a todo is created
        console.log(`📧 Notification: New todo "${context.result.title}" created`);
        // You could integrate with email, Slack, etc.
      }
    },
    afterUpdate: async (context) => {
      if (context.resource === "todo" && context.data.completed === true) {
        // Notify when a todo is completed
        console.log(`🎉 Notification: Todo "${context.result.title}" completed!`);
      }
    },
  },
});
```

### Example: Priority Plugin

A plugin that enforces business rules:

```typescript
export const priorityPlugin = createPlugin({
  id: "priority-rules",
  hooks: {
    beforeCreate: async (context) => {
      if (context.resource === "todo" && context.data.priority === "high") {
        // High priority todos must have a due date
        if (!context.data.dueDate) {
          throw new Error("High priority todos must have a due date");
        }
      }
    },
  },
});
```

## Using Plugins in Your App

To use plugins, add them to the `plugins` array in your `betterQuery` configuration:

```typescript
export const query = betterQuery({
  basePath: "/api/query",
  database: {
    provider: "sqlite",
    url: "todos.db",
    autoMigrate: true,
  },
  plugins: [
    // Built-in plugins
    auditPlugin({ enabled: true }),
    cachePlugin({ enabled: true }),
    validationPlugin({ strict: true }),
    
    // Your custom plugins
    timestampPlugin,
    notificationPlugin,
    priorityPlugin,
  ],
  resources: [todoResource],
});
```

## Plugin Execution Order

Plugins are executed in the order they are defined in the `plugins` array:

1. `beforeCreate` hooks run in order before creating a record
2. The record is created
3. `afterCreate` hooks run in order after creation

This means if you have multiple plugins modifying data, they will run sequentially.

## Best Practices

1. **Keep plugins focused**: Each plugin should do one thing well
2. **Use descriptive IDs**: Plugin IDs should clearly indicate what the plugin does
3. **Handle errors gracefully**: Use try-catch in hooks to prevent breaking the entire operation
4. **Document your plugins**: Add comments explaining what each hook does
5. **Test plugins separately**: Create unit tests for your plugin logic
6. **Consider performance**: Be mindful of expensive operations in hooks that run frequently

## Testing Plugins

You can test that plugins are working by:

1. **Check console logs**: Audit and timestamp plugins log to the console
2. **Use the cache API**: Visit `/api/query/cache/stats` to see cache statistics
3. **Create/update todos**: Watch for the effects of your plugins in action
4. **Check the database**: Verify timestamps and other data modifications

## Plugin API Reference

### Available Built-in Plugins

- `auditPlugin` - Audit logging
- `cachePlugin` - In-memory caching
- `validationPlugin` - Enhanced validation
- `openApiPlugin` - OpenAPI/Swagger documentation

### Plugin Creation Functions

- `createPlugin(config)` - Create a custom plugin

For more information about the plugin system, see the [Better Query documentation](https://armelgeek.github.io/better-kit).
