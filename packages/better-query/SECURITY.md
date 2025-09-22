# Security Features Documentation

This document outlines the comprehensive security features implemented in the better-crud CRUD system.

## Overview

The security implementation provides multiple layers of protection:

1. **Authentication & Authorization** - User identification and permission management
2. **Input Validation & Sanitization** - Protecting against malicious input
3. **Hooks & Middleware** - Lifecycle management and audit trails
4. **Advanced Search & Filtering** - Secure querying capabilities
5. **Rate Limiting** - Protection against abuse
6. **Ownership-based Access Control** - Row-level security

## Authentication & Authorization

### Scope-based Permissions

Define fine-grained permissions using scopes:

```typescript
const resource = {
  name: "product",
  schema: productSchema,
  scopes: {
    create: ["product:write", "admin"],
    read: ["product:read"],
    update: ["product:write"],
    delete: ["product:delete", "admin"],
    list: ["product:read"]
  }
}
```

### Ownership-based Access Control

Implement row-level security with ownership:

```typescript
const resource = {
  name: "product",
  schema: productSchema,
  ownership: {
    field: "userId", // Field that identifies the resource owner
    strategy: "flexible" // "strict" or "flexible"
  }
}
```

**Strategies:**
- `strict`: Only the owner can access the resource
- `flexible`: Owner + users with admin roles can access

### Custom Permission Functions

Add complex business logic to permissions:

```typescript
const resource = {
  permissions: {
    create: async (context) => {
      const user = context.user;
      const userProductCount = await getUserProductCount(user.id);
      const maxProducts = user.plan === "premium" ? 1000 : 10;
      return userProductCount < maxProducts;
    },
    update: async (context) => {
      // Don't allow updates to archived items
      return context.existingData?.status !== "archived";
    }
  }
}
```

## Input Validation & Sanitization

### Global Sanitization Rules

Apply sanitization to all fields:

```typescript
const resource = {
  sanitization: {
    global: [
      { type: "trim" },        // Remove whitespace
      { type: "escape" },      // Escape HTML characters
      { type: "lowercase" }    // Convert to lowercase
    ]
  }
}
```

### Field-specific Sanitization

Apply different rules to specific fields:

```typescript
const resource = {
  sanitization: {
    fields: {
      description: [
        { type: "strip" }  // Remove < and > characters
      ],
      name: [
        { 
          type: "custom", 
          customFn: (value) => value.replace(/[^\w\s-]/g, "")
        }
      ]
    }
  }
}
```

### Available Sanitization Types

- `trim`: Remove leading/trailing whitespace
- `escape`: Escape HTML special characters
- `lowercase`: Convert to lowercase
- `uppercase`: Convert to uppercase
- `strip`: Remove < and > characters
- `custom`: Apply custom function

## Hooks & Middleware

### Lifecycle Hooks

Execute custom logic at different stages:

```typescript
const resource = {
  hooks: {
    // Before operations
    onCreate: async (context) => {
      context.data.createdAt = new Date();
      context.data.userId = context.user.id;
    },
    onUpdate: async (context) => {
      context.data.updatedAt = new Date();
    },
    onDelete: async (context) => {
      // Prevent deletion of important records
      if (context.existingData.important) {
        throw new Error("Cannot delete important record");
      }
    },
    
    // After operations
    afterCreate: async (context) => {
      await sendNotification(context.user, context.result);
    },
    afterUpdate: async (context) => {
      await clearCache(context.id);
    },
    afterDelete: async (context) => {
      await cleanupRelatedData(context.id);
    }
  }
}
```

### Built-in Hook Utilities

Pre-built hooks for common scenarios:

```typescript
import { HookUtils } from 'better-crud';

const resource = {
  hooks: {
    onCreate: HookUtils.timestampHook,
    onUpdate: HookUtils.userTrackingHook("createdBy"),
    onDelete: HookUtils.softDeleteHook,
    afterCreate: HookUtils.notificationHook(sendEmail),
    onUpdate: HookUtils.validationHook((data) => data.price > 0)
  }
}
```

### Audit Logging

Automatic audit trail for all operations:

```typescript
const crudOptions = {
  audit: {
    enabled: true,
    logOperations: ["create", "update", "delete"],
    auditLogger: async (event) => {
      console.log(`[AUDIT] ${event.operation} on ${event.resource}`, {
        user: event.user?.id,
        timestamp: event.timestamp,
        changes: event.dataAfter
      });
    }
  }
}
```

## Advanced Search & Filtering

### Basic Search

Search across multiple fields:

```typescript
// GET /products?search=laptop&searchFields=name,description
```

### Advanced Filters

Complex filtering with operators:

```typescript
// GET /products?filters={"price":{"operator":"gte","value":100},"category":{"operator":"in","value":["electronics","computers"]}}
```

**Available Operators:**
- `eq`: Equal
- `ne`: Not equal
- `gt`: Greater than
- `gte`: Greater than or equal
- `lt`: Less than
- `lte`: Less than or equal
- `in`: In array
- `notin`: Not in array
- `like`: SQL LIKE pattern
- `ilike`: Case-insensitive LIKE
- `between`: Between two values

### Date Range Filtering

Filter by date ranges:

```typescript
// GET /products?dateRange={"field":"createdAt","start":"2024-01-01","end":"2024-12-31"}
```

### Full-Text Search Configuration

Configure search behavior per resource:

```typescript
const resource = {
  search: {
    fields: ["name", "description", "tags"],
    strategy: "contains", // "contains", "startsWith", "exact", "fuzzy"
    caseSensitive: false
  }
}
```

### Fluent Query Builder

Programmatic query building:

```typescript
import { FilterBuilder } from 'better-crud';

const filter = new FilterBuilder()
  .equals("status", "active")
  .greaterThan("price", 100)
  .like("name", "laptop")
  .in("category", ["electronics", "computers"])
  .between("createdAt", startDate, endDate)
  .build();
```

## Rate Limiting

Protect against abuse with rate limiting:

```typescript
const crudOptions = {
  security: {
    rateLimit: {
      windowMs: 60000, // 1 minute window
      max: 100         // Max 100 requests per window
    }
  }
}
```

## Security Context

Automatic extraction of security information:

```typescript
// Available in all hooks and permission functions
const context = {
  user: {
    id: "user123",
    scopes: ["product:read", "product:write"],
    roles: ["user", "premium"]
  },
  ipAddress: "192.168.1.1",
  userAgent: "Mozilla/5.0...",
  session: { ... }
}
```

## Complete Example

```typescript
import { z } from "zod";
import { createCrudEndpoints, HookUtils } from "adiemus";

const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().min(0),
  userId: z.string(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

const secureProductResource = {
  name: "product",
  schema: productSchema,
  
  // Security
  ownership: {
    field: "userId",
    strategy: "flexible"
  },
  scopes: {
    create: ["product:write"],
    read: ["product:read"],
    update: ["product:write"],
    delete: ["product:delete"],
    list: ["product:read"]
  },
  
  // Sanitization
  sanitization: {
    global: [{ type: "trim" }, { type: "escape" }],
    fields: {
      description: [{ type: "strip" }]
    }
  },
  
  // Hooks
  hooks: {
    onCreate: async (ctx) => {
      ctx.data.createdAt = new Date();
      ctx.data.userId = ctx.user.id;
    },
    afterCreate: async (ctx) => {
      await sendNotification(ctx.user, ctx.result);
    }
  },
  
  // Search
  search: {
    fields: ["name", "description"],
    strategy: "contains"
  }
};

const productCrud = createCrudEndpoints(secureProductResource);
```

## API Usage Examples

### Create with Security
```http
POST /product
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "  Secure Product  ",
  "description": "<script>alert('xss')</script>Safe description",
  "price": 99.99
}
```

### Advanced Search
```http
GET /products?search=laptop&filters={"price":{"operator":"gte","value":500}}&sortBy=price&sortOrder=desc&page=1&limit=20
```

### Update with Ownership Check
```http
PATCH /product/123
Authorization: Bearer <token>
Content-Type: application/json

{
  "price": 149.99,
  "description": "Updated description"
}
```

## Testing

Comprehensive test coverage for all security features:

```bash
npm test src/tests/security.test.ts    # 19 tests for sanitization, permissions, rate limiting
npm test src/tests/hooks.test.ts       # 14 tests for lifecycle hooks and audit logging  
npm test src/tests/search.test.ts      # 28 tests for search and filtering
```

## Best Practices

1. **Always use sanitization** for user input
2. **Implement ownership** for user-generated content
3. **Use scopes** for fine-grained permissions
4. **Add audit logging** for compliance
5. **Configure rate limiting** to prevent abuse
6. **Use hooks** for business logic separation
7. **Test security features** thoroughly

This security implementation provides enterprise-grade protection while maintaining developer productivity and system performance.