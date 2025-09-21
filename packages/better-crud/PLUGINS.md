# Better-CRUD Plugin System

The Better-CRUD plugin system is inspired by Better-Auth and provides a powerful, extensible way to add functionality to your CRUD operations. Plugins can add endpoints, extend schemas, provide hooks, and integrate with the admin interface.

## Quick Start

```typescript
import { betterCrud, auditPlugin, validationPlugin } from 'better-crud';

const crud = betterCrud({
  database: {
    provider: "sqlite",
    url: "database.db"
  },
  resources: [/* your resources */],
  plugins: [
    auditPlugin({ enabled: true }),
    validationPlugin({ strict: true })
  ]
});
```

## Core Concepts

### Plugin Interface

All plugins implement the `Plugin` interface:

```typescript
interface Plugin {
  id: string;                    // Unique plugin identifier
  endpoints?: Record<string, Endpoint>;  // Additional API endpoints
  schema?: PluginSchema;         // Database schema extensions
  resources?: CrudResourceConfig[];      // Additional CRUD resources
  middleware?: CrudMiddleware[]; // Global middleware
  hooks?: PluginHooks;          // Lifecycle hooks
  init?: (context: PluginInitContext) => Promise<void> | void;
  destroy?: () => Promise<void> | void;
}
```

### Plugin Hooks

Plugins can hook into CRUD operations:

```typescript
interface PluginHooks {
  beforeCreate?: (context: CrudHookContext) => Promise<void> | void;
  afterCreate?: (context: CrudHookContext) => Promise<void> | void;
  beforeUpdate?: (context: CrudHookContext) => Promise<void> | void;
  afterUpdate?: (context: CrudHookContext) => Promise<void> | void;
  beforeDelete?: (context: CrudHookContext) => Promise<void> | void;
  afterDelete?: (context: CrudHookContext) => Promise<void> | void;
  beforeRead?: (context: CrudHookContext) => Promise<void> | void;
  afterRead?: (context: CrudHookContext) => Promise<void> | void;
  beforeList?: (context: CrudHookContext) => Promise<void> | void;
  afterList?: (context: CrudHookContext) => Promise<void> | void;
}
```

## Built-in Plugins

### Audit Plugin

Automatically logs all CRUD operations:

```typescript
import { auditPlugin } from 'better-crud/plugins';

const audit = auditPlugin({
  enabled: true,
  operations: ['create', 'update', 'delete'],
  includeRequestData: true,
  includeResponseData: false,
  logger: (event) => {
    console.log(`[AUDIT] ${event.operation} on ${event.resource}`);
  }
});
```

**Features:**
- Automatic audit trail creation
- Configurable operation filtering
- Custom audit loggers
- Built-in audit logs API endpoint: `GET /audit/logs`

### Validation Plugin

Enhanced validation with sanitization:

```typescript
import { validationPlugin } from 'better-crud/plugins';

const validation = validationPlugin({
  strict: true,
  globalRules: {
    trimStrings: true,
    sanitizeHtml: true,
    validateEmails: true
  },
  rules: {
    user: {
      create: z.object({
        email: z.string().email(),
        name: z.string().min(2).max(50)
      }),
      customValidation: async (data, context) => {
        // Custom validation logic
        return []; // Return error messages array
      }
    }
  }
});
```

**Features:**
- Zod schema validation
- Global sanitization rules
- Resource-specific validation
- Custom validation functions

### Cache Plugin

In-memory and configurable caching:

```typescript
import { cachePlugin } from 'better-crud/plugins';

const cache = cachePlugin({
  enabled: true,
  defaultTTL: 300, // 5 minutes
  resources: {
    user: {
      readTTL: 600,    // 10 minutes for reads
      listTTL: 300,    // 5 minutes for lists
      invalidatePatterns: ['user:*']
    }
  }
});
```

**Features:**
- Automatic read/list caching
- Configurable TTL per resource
- Cache invalidation on writes
- Cache management endpoints: `GET /cache/stats`, `POST /cache/clear`

## Creating Custom Plugins

### Basic Plugin

```typescript
import { createPlugin } from 'better-crud/plugins';

const timestampPlugin = createPlugin({
  id: 'timestamp',
  hooks: {
    beforeCreate: async (context) => {
      if (context.data) {
        context.data.createdAt = new Date();
      }
    },
    beforeUpdate: async (context) => {
      if (context.data) {
        context.data.updatedAt = new Date();
      }
    }
  }
});
```

### Plugin with Endpoints

```typescript
import { createPlugin, createCrudEndpoint } from 'better-crud/plugins';

const analyticsPlugin = createPlugin({
  id: 'analytics',
  endpoints: {
    getStats: createCrudEndpoint('/analytics/stats', {
      method: 'GET',
      query: z.object({
        resource: z.string().optional(),
        period: z.enum(['day', 'week', 'month']).optional()
      })
    }, async (ctx) => {
      // Implementation
      return ctx.json({ totalOperations: 1000 });
    })
  }
});
```

### Resource Custom Endpoints

You can also add custom endpoints directly to resources using the `customEndpoints` property:

```typescript
import { createResource, createCrudEndpoint } from 'better-crud';
import { z } from 'zod';

const productCustomEndpoints = {
  getProductStats: createCrudEndpoint('/products/stats', {
    method: 'GET',
    query: z.object({
      category: z.string().optional(),
    }),
  }, async (ctx) => {
    const { category } = ctx.query;
    
    // Access the CRUD context and adapter
    const adapter = ctx.context.adapter;
    
    // Perform custom logic
    const stats = await adapter.count({
      model: 'product',
      where: category ? [{ field: 'category', value: category }] : undefined
    });
    
    return ctx.json({ total: stats, category });
  }),

  bulkUpdate: createCrudEndpoint('/products/bulk-update', {
    method: 'POST',
    body: z.object({
      updates: z.array(z.object({
        id: z.string(),
        data: z.record(z.any())
      }))
    }),
  }, async (ctx) => {
    const { updates } = ctx.body;
    const adapter = ctx.context.adapter;
    
    const results = [];
    for (const update of updates) {
      try {
        const result = await adapter.update({
          model: 'product',
          where: [{ field: 'id', value: update.id }],
          data: update.data
        });
        results.push({ id: update.id, success: true, data: result });
      } catch (error) {
        results.push({ id: update.id, success: false, error: error.message });
      }
    }
    
    return ctx.json({ results });
  })
};

const productResource = createResource({
  name: 'product',
  schema: productSchema,
  customEndpoints: productCustomEndpoints
});
```

When you add custom endpoints to a resource, they are merged with the standard CRUD endpoints. The API will include both:

- Standard CRUD endpoints: `createProduct`, `getProduct`, `updateProduct`, `deleteProduct`, `listProducts`
- Custom endpoints: `getProductStats`, `bulkUpdate`

### Plugin with Schema Extensions

```typescript
const auditPlugin = createPlugin({
  id: 'audit',
  schema: {
    audit_logs: {
      fields: {
        id: { type: 'string', required: true },
        operation: { type: 'string', required: true },
        resource: { type: 'string', required: true },
        user_id: { type: 'string', required: false },
        timestamp: { type: 'date', required: true },
        data: { type: 'json', required: false }
      }
    }
  }
});
```

### Plugin with Additional Resources

```typescript
const loggingPlugin = createPlugin({
  id: 'logging',
  resources: [
    {
      name: 'log',
      schema: z.object({
        id: z.string(),
        level: z.enum(['info', 'warn', 'error']),
        message: z.string(),
        timestamp: z.date()
      })
    }
  ]
});
```

## Advanced Features

### Plugin Initialization

```typescript
const complexPlugin = createPlugin({
  id: 'complex',
  init: async (context) => {
    // Access to all resources, schemas, adapter
    console.log('Available resources:', Array.from(context.resources.keys()));
    
    // Setup external connections, validate configuration, etc.
  },
  destroy: async () => {
    // Cleanup when CRUD instance is destroyed
  }
});
```

### Hook Context

The `CrudHookContext` provides access to:

```typescript
interface CrudHookContext {
  user?: any;              // Current user
  resource: string;        // Resource name
  operation: CrudOperation; // 'create' | 'read' | 'update' | 'delete' | 'list'
  data?: any;             // Request data
  id?: string;            // Record ID (for read/update/delete)
  existingData?: any;     // Current data (for update/delete)
  result?: any;           // Operation result (for after hooks)
  request?: any;          // Full request context
  adapter: CrudAdapter;   // Database adapter
}
```

### Plugin Composition

Plugins can build on each other:

```typescript
const crud = betterCrud({
  // ... config
  plugins: [
    // Order matters - hooks execute in order
    validationPlugin({ strict: true }),
    auditPlugin({ enabled: true }),
    cachePlugin({ enabled: true })
  ]
});
```

## Integration with Admin Interface

Plugins automatically integrate with the admin interface:

1. **Schema Extensions**: Plugin schemas appear as additional tables
2. **Custom Endpoints**: Plugin endpoints are available in the API
3. **Hooks**: Validation and audit happen transparently
4. **Cache**: Improves admin interface performance

## OpenAPI Integration

Plugins can extend OpenAPI documentation:

```typescript
const documentedPlugin = createPlugin({
  id: 'documented',
  endpoints: { /* ... */ },
  openapi: {
    paths: {
      '/analytics/stats': {
        get: {
          summary: 'Get analytics statistics',
          responses: {
            200: { description: 'Success' }
          }
        }
      }
    },
    tags: [
      { name: 'Analytics', description: 'Analytics operations' }
    ]
  }
});
```

## Best Practices

1. **Plugin IDs**: Use unique, descriptive IDs
2. **Error Handling**: Always handle errors in hooks gracefully
3. **Performance**: Consider the performance impact of hooks
4. **Configuration**: Make plugins configurable for different use cases
5. **Documentation**: Document your custom plugins well

## Examples

See the `examples/` directory for complete plugin examples:
- `plugin-demo.ts` - Basic plugin creation
- `plugin-example.ts` - Full CRUD instance with plugins

## Type Safety

The plugin system is fully typed and provides excellent TypeScript support:

```typescript
// Plugin endpoints are automatically typed
const crud = betterCrud({
  plugins: [auditPlugin(), cachePlugin()]
});

// These endpoints exist and are typed
crud.api.getAuditLogs({ query: { resource: 'user' } });
crud.api.getCacheStats();
```