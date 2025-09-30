# Plugin Examples for Next-Todo

This directory contains examples of how to use plugins with Better Query in the Next-Todo application.

## Quick Start

The plugins have been integrated into the `next-todo` application. Here's what was added:

### 1. Custom Plugin (Timestamp Plugin)

Location: `lib/plugins/timestamp-plugin.ts`

A simple custom plugin that automatically adds timestamps to todos.

**Features:**
- Adds `createdAt` and `updatedAt` timestamps when creating a todo
- Updates `updatedAt` timestamp when updating a todo
- Logs a message when a todo is created

### 2. Built-in Plugins

The following built-in plugins have been added to `lib/query.ts`:

#### Audit Plugin
Logs all CRUD operations (create, update, delete) for debugging and tracking.

#### Cache Plugin
Provides in-memory caching for read operations:
- Individual todos cached for 10 minutes
- Todo lists cached for 5 minutes
- Automatic cache invalidation on writes

#### Validation Plugin
Enhanced validation with global rules:
- Automatically trims whitespace from strings
- Validates email format
- Strict mode enabled

## Usage Example

See the complete implementation in `lib/query.ts`:

```typescript
import { betterQuery, createResource, withId } from "better-query";
import {
  auditPlugin,
  cachePlugin,
  validationPlugin,
} from "better-query/plugins";
import { timestampPlugin } from "./plugins";

export const query = betterQuery({
  basePath: "/api/query",
  database: {
    provider: "sqlite",
    url: "todos.db",
    autoMigrate: true,
  },
  plugins: [
    // Built-in plugin: Audit logging
    auditPlugin({
      enabled: true,
      operations: ["create", "update", "delete"],
      logger: (event) => {
        console.log(`[AUDIT] ${event.operation} on ${event.resource}`);
      },
    }),

    // Built-in plugin: Cache
    cachePlugin({
      enabled: true,
      defaultTTL: 300,
      resources: {
        todo: {
          enabled: true,
          readTTL: 600,
          listTTL: 300,
        },
      },
    }),

    // Built-in plugin: Validation
    validationPlugin({
      strict: true,
      globalRules: {
        trimStrings: true,
        validateEmails: true,
      },
    }),

    // Custom plugin: Timestamps
    timestampPlugin,
  ],
  resources: [todoResource],
});
```

## Creating Your Own Plugin

To create a custom plugin, use the `createPlugin` function:

```typescript
import { createPlugin } from "better-query/plugins";

export const myPlugin = createPlugin({
  id: "my-plugin",
  hooks: {
    beforeCreate: async (context) => {
      // Your logic here
    },
  },
});
```

See `lib/plugins/timestamp-plugin.ts` for a complete example.

## Comprehensive Documentation

For a detailed guide on the plugin system, including:
- How each plugin works
- Plugin configuration options
- Creating custom plugins
- Plugin hook lifecycle
- Best practices

See `PLUGINS.md` in the root of the next-todo directory.

## Testing the Plugins

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Create, update, or delete a todo to see the plugins in action:
   - Check the console logs for audit messages
   - Watch for timestamp logs when creating todos
   - Observe cache statistics in server logs

3. Access plugin endpoints:
   - `GET /api/query/cache/stats` - View cache statistics
   - `DELETE /api/query/cache/clear` - Clear the cache

## Plugin Benefits

- **Audit Plugin**: Track all data changes for debugging and compliance
- **Cache Plugin**: Improve performance by reducing database queries
- **Validation Plugin**: Ensure data quality with automatic validation
- **Timestamp Plugin**: Automatically track when records are created and modified

## Learn More

- Check out `PLUGINS.md` for the complete plugin guide
- See `lib/query.ts` for the full implementation
- Explore `lib/plugins/timestamp-plugin.ts` for a custom plugin example
