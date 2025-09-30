# Better Auth Integration Guide

Better Query provides type-safe integration with Better Auth for authentication, authorization, and session management through resource permissions and middleware.

## Features

- 🔐 **Type-Safe User Context**: Access Better Auth user data in permissions with full TypeScript support
- 👤 **Resource-Level Permissions**: Define granular permissions per resource and operation
- 🛡️ **Role-Based Access Control**: Implement role-based permissions using Better Auth user roles
- 🔄 **Session Management**: Automatic session validation through Better Auth
- 📊 **Custom Middleware**: Add authentication checks and user context extraction

## Installation

```bash
npm install better-query better-auth
```

## Basic Setup

```typescript
import { betterAuth } from "better-auth";
import { betterQuery, createResource } from "better-query";
import { z } from "zod";

// 1. Setup Better Auth
export const auth = betterAuth({
  database: {
    provider: "sqlite",
    url: "auth.db",
  },
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
  },
});

// 2. Setup Better Query with authentication
export const query = betterQuery({
  basePath: "/api/query",
  database: {
    provider: "sqlite",
    url: "data.db",
    autoMigrate: true,
  },
  
  resources: [
    createResource({
      name: "product",
      schema: z.object({
        id: z.string(),
        name: z.string(),
        price: z.number(),
        createdBy: z.string().optional(),
      }),
      
      // Integrate Better Auth through permissions
      permissions: {
        // Only authenticated users can create
        create: async (context) => !!context.user,
        
        // Everyone can read
        read: async () => true,
        
        // Only admin or owner can update
        update: async (context) => {
          const user = context.user as { id: string; role?: string };
          if (!user) return false;
          
          if (user.role === "admin") return true;
          return context.existingData?.createdBy === user.id;
        },
        
        // Only admin can delete
        delete: async (context) => {
          const user = context.user as { role?: string };
          return user?.role === "admin";
        },
        
        // Everyone can list
        list: async () => true,
      }
    })
  ]
});
```

## Type-Safe User Context

Define your user interface that extends Better Auth:

```typescript
// Define your custom user interface
interface CustomUser {
  id: string;
  email: string;
  role: "admin" | "user" | "moderator";
  orgId?: string;
}
## Type-Safe User Context

Define your user interface that extends Better Auth for full type safety:

```typescript
// Define your custom user interface
interface CustomUser {
  id: string;
  email: string;
  role: "admin" | "user" | "moderator";
  orgId?: string;
}

// Use type-safe helper for user operations
import { createBetterAuthIntegration } from "better-query";

const authHelper = createBetterAuthIntegration(auth);

// Use in resource permissions with full type safety
createResource({
  name: "product",
  schema: productSchema,
  permissions: {
    create: async (context) => {
      const user = authHelper.getUser(context) as CustomUser;
      return user?.role === "admin";
    },
    
    update: async (context) => {
      const user = authHelper.getUser(context) as CustomUser;
      
      // Check if user has admin role
      if (authHelper.hasRole(context, "admin")) return true;
      
      // Check if user owns the resource
      return context.existingData?.createdBy === user?.id;
    },
    
    delete: async (context) => {
      // Check if user has any of these roles
      return authHelper.hasAnyRole(context, ["admin", "moderator"]);
    }
  }
});
```

## Role-Based Permissions

Implement role-based access control directly in your resource permissions:

```typescript
createResource({
  name: "product",
  schema: productSchema,
  permissions: {
    // Admin has full access
    create: async (context) => {
      const user = context.user as { role?: string };
      return user?.role === "admin" || user?.role === "moderator";
    },
    
    // Check specific roles for update
    update: async (context) => {
      const user = context.user as { id: string; role?: string };
      
      // Admin and moderator can update any product
      if (user?.role === "admin" || user?.role === "moderator") {
        return true;
      }
      
      // Regular users can only update their own products
      return context.existingData?.createdBy === user?.id;
    },
    
    // Only admin can delete
    delete: async (context) => {
      const user = context.user as { role?: string };
      return user?.role === "admin";
    },
    
    // Everyone can read and list
    read: async () => true,
    list: async () => true,
  }
});
```

## Custom Middleware

Add custom middleware to extract Better Auth user context:

## Custom Middleware

Add custom middleware to extract Better Auth user context:

```typescript
import type { QueryMiddlewareContext } from "better-query";

createResource({
  name: "product",
  schema: productSchema,
  middlewares: [
    {
      handler: async (context: QueryMiddlewareContext) => {
        // Extract session from Better Auth
        const session = await auth.api.getSession({
          headers: context.request.headers,
        });
        
        if (session) {
          // Attach user to context
          context.user = session.user;
        }
      }
    }
  ],
  permissions: {
    create: async (context) => !!context.user,
    // ... other permissions
  }
});
```

Handle breaking schema changes with automated migrations:

```typescript
import { withSchemaVersion, createSchemaMigration } from "better-query";

// Version 1.0.0 schema
const productSchemaV1 = withSchemaVersion("1.0.0", z.object({
  id: z.string().optional(),
  name: z.string(),
  price: z.number(),
}));

// Version 2.0.0 schema with breaking changes
const productSchemaV2 = withSchemaVersion("2.0.0", z.object({
  id: z.string().optional(),
  name: z.string(),
  price: z.number(),
  category: z.string(), // New required field (breaking change)
  description: z.string().optional(), // New optional field (non-breaking)
}));

// Analyze schema changes
const { changes, migrations, report } = createSchemaMigration(
  "product",
  productSchemaV1.schema,
  productSchemaV2.schema
);

console.log("Migration Report:", report);
// ⚠️ BREAKING CHANGES DETECTED:
// ➕ Field 'category' has been added as required
// Existing records will need to be updated with a value for this field.

// Apply migrations (if needed)
if (migrations.length > 0) {
  await migrationManager.applyMigrations(adapter, migrations);
}
```

## Helper Functions

Better Query provides type-safe helper functions for Better Auth integration:

```typescript
import { createBetterAuthIntegration } from "better-query";

// Define your custom user type
interface CustomUser {
  id: string;
  email: string;
  role?: string;
  orgId?: string;
  scopes?: string[];
}

// Create the helper
const authHelper = createBetterAuthIntegration(auth);

// In your permission functions
permissions: {
  delete: async (context) => {
    // Get user with type safety
    const user = authHelper.getUser(context) as CustomUser;
    
    // Check role
    if (authHelper.hasRole(context, "admin")) {
      return true;
    }
    
    // Check multiple roles
    if (authHelper.hasAnyRole(context, ["admin", "moderator"])) {
      return true;
    }
    
    // Check organization membership
    if (authHelper.belongsToOrg(context, "my-org-123")) {
      return true;
    }
    
    // Check scopes
    if (authHelper.hasScopes(context, ["delete", "admin"])) {
      return true;
    }
    
    return false;
  }
}
```

## Session Handling

You can extract and validate Better Auth sessions in your resources:

```typescript
createResource({
  name: "product",
  schema: productSchema,
  middlewares: [
    {
      handler: async (context: QueryMiddlewareContext) => {
        // Extract and validate session from Better Auth
        const session = await auth.api.getSession({
          headers: context.request.headers,
        });
        
        if (session) {
          // Attach user to context for use in permissions
          context.user = session.user;
        }
      }
    }
  ],
  hooks: {
    beforeCreate: async (context) => {
      if (context.user) {
        // User is authenticated, set metadata
        context.data.createdBy = context.user.id;
        context.data.createdAt = new Date();
      }
    }
  }
});
```

## Advanced Patterns

### Global Authentication Middleware

Create a reusable middleware for all resources:

## Advanced Patterns

### Global Authentication Middleware

Create a reusable middleware for all resources:

```typescript
import type { QueryMiddlewareContext } from "better-query";

// Create a shared auth middleware
const authMiddleware = {
  handler: async (context: QueryMiddlewareContext) => {
    const session = await auth.api.getSession({
      headers: context.request.headers,
    });
    
    if (session) {
      context.user = session.user;
    }
  }
};

// Use in all resources
const resources = [
  createResource({
    name: "product",
    schema: productSchema,
    middlewares: [authMiddleware],
    permissions: { /* ... */ }
  }),
  createResource({
    name: "category",
    schema: categorySchema,
    middlewares: [authMiddleware],
    permissions: { /* ... */ }
  }),
];
```

### Organization-Based Access

```typescript
createResource({
  name: "project",
  schema: projectSchema,
  permissions: {
    // Users can only see projects in their organization
    list: async (context) => {
      const user = context.user as { orgId?: string };
      if (!user) return false;
      
      // Filter by organization
      context.query = {
        ...context.query,
        where: {
          ...context.query?.where,
          orgId: user.orgId
        }
      };
      return true;
    },
    
    // Similar for other operations
    read: async (context) => {
      const user = context.user as { orgId?: string };
      return context.existingData?.orgId === user?.orgId;
    }
  }
});
```

## Integration with Next.js

Example Next.js App Router integration:

```typescript
// app/lib/auth.ts
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  database: {
    provider: "sqlite",
    url: "auth.db",
  },
  secret: process.env.BETTER_AUTH_SECRET!,
  emailAndPassword: {
    enabled: true,
  },
});

// app/lib/query.ts
import { betterQuery, createResource } from "better-query";
import { auth } from "./auth";

export const query = betterQuery({
  basePath: "/api/query",
  database: {
    provider: "sqlite",
    url: "data.db",
    autoMigrate: true,
  },
  resources: [
    createResource({
      name: "product",
      schema: productSchema,
      middlewares: [
        {
          handler: async (context) => {
            const session = await auth.api.getSession({
              headers: context.request.headers,
            });
            if (session) context.user = session.user;
          }
        }
      ],
      permissions: {
        create: async (context) => !!context.user,
        // ... other permissions
      }
    })
  ]
});

// app/api/auth/[...all]/route.ts
export { auth as GET, auth as POST } from "../../../lib/auth";

// app/api/query/[...all]/route.ts
import { query } from "../../../lib/query";

export const GET = query.handler;
export const POST = query.handler;
```

## Error Handling

Better Query provides clear error messages for authorization failures:

```typescript
// Authentication errors
// "Authentication required"

// Permission errors  
// "Permission denied for operation 'delete' on resource 'product'"

// Role-based errors
// "User with role 'user' does not have permission to perform this action"
```

## Best Practices

1. **Use middleware for authentication**: Extract user context in middleware for reusability
2. **Check permissions at resource level**: Define clear permissions for each operation
3. **Type your user context**: Use TypeScript interfaces for type-safe user operations
4. **Use helper functions**: Leverage the provided helpers for common authorization patterns
5. **Handle errors gracefully**: Provide clear error messages for authentication and authorization failures

## TypeScript Integration

Better Query with Better Auth provides full TypeScript support:

```typescript
// Define your user type based on Better Auth
interface User {
  id: string;
  email: string;
  role?: string;
  orgId?: string;
}

// Use in permissions with type safety
permissions: {
  create: async (context) => {
    const user = context.user as User;
    return user?.role === "admin";
  }
}

// Type-safe helper usage
const authHelper = createBetterAuthIntegration(auth);
const user = authHelper.getUser(context) as User;
```

This integration approach provides flexible, type-safe authentication and authorization for your Better Query resources while maintaining full control over your authentication logic.