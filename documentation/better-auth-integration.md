# Better Auth Integration Guide

Better Query now provides native integration with Better Auth for seamless authentication, authorization, and session management.

## Features

- 🔐 **Native Better Auth Integration**: Direct integration with Better Auth instances
- 👤 **Automatic User Context Typing**: Type-safe user context from Better Auth sessions
- 🛡️ **Role-Based Permissions**: Define permissions based on Better Auth user roles
- 🔄 **Transparent Session Handling**: Automatic session validation and context passing
- 📊 **Schema Migration Management**: Handle breaking schema changes with automated migrations

## Installation

```bash
npm install better-query better-auth
```

## Basic Setup

```typescript
import { betterAuth } from "better-auth";
import { betterQuery, betterAuth as betterAuthPlugin } from "better-query";

// 1. Setup Better Auth
const auth = betterAuth({
  database: {
    provider: "sqlite",
    url: "auth.db",
  },
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
  },
});

// 2. Setup Better Query with Better Auth integration
const query = betterQuery({
  basePath: "/api/query",
  database: {
    provider: "sqlite",
    url: "data.db",
    autoMigrate: true,
  },
  
  // Enable Better Auth plugin
  plugins: [
    betterAuthPlugin({
      auth,
      rolePermissions: {
        admin: {
          resources: ["*"], // Access to all resources
          operations: ["create", "read", "update", "delete", "list"],
          scopes: ["admin", "write", "read"]
        },
        user: {
          operations: ["read", "create"],
          scopes: ["read"]
        }
      }
    })
  ],
  
  resources: [
    // Your resources here...
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

// Use in permission functions with full type safety
createResource({
  name: "product",
  schema: productSchema,
  permissions: {
    create: async (context) => {
      const user = context.user as CustomUser;
      return user?.role === "admin";
    },
    
    update: async (context) => {
      const user = context.user as CustomUser;
      // Admins can update anything, users can update their own
      return user?.role === "admin" || 
             context.existingData?.createdBy === user?.id;
    }
  }
});
```

## Role-Based Permissions

Configure role-based access control:

```typescript
betterAuthPlugin({
  auth,
  rolePermissions: {
    // Super admin with full access
    admin: {
      resources: ["*"],
      operations: ["create", "read", "update", "delete", "list"],
      scopes: ["admin", "write", "read"]
    },
    
    // Moderator with limited admin access
    moderator: {
      resources: ["product", "category", "review"],
      operations: ["read", "update", "list"],
      scopes: ["moderate", "read"]
    },
    
    // Regular user with basic access
    user: {
      resources: ["product", "review"],
      operations: ["read", "create"],
      scopes: ["read"]
    }
  }
})
```

## Schema Migration Management

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

Use the provided helper functions for common operations:

```typescript
import { createBetterAuthContext } from "better-query";

const authContext = createBetterAuthContext<CustomUser>();

// In your permission functions
permissions: {
  delete: async (context) => {
    const user = authContext.getUser(context);
    
    // Check role
    if (authContext.hasRole(context, "admin")) {
      return true;
    }
    
    // Check multiple roles
    if (authContext.hasAnyRole(context, ["admin", "moderator"])) {
      return true;
    }
    
    // Check organization membership
    if (authContext.belongsToOrg(context, "my-org-123")) {
      return true;
    }
    
    // Check scopes
    if (authContext.hasScopes(context, ["delete", "admin"])) {
      return true;
    }
    
    return false;
  }
}
```

## Session Handling

Better Auth sessions are automatically validated and attached to the request context:

```typescript
// The plugin automatically:
// 1. Extracts session from request headers
// 2. Validates the session with Better Auth
// 3. Attaches user to context.user
// 4. Adds role-based scopes to user.scopes

// In your hooks, the user is always available:
hooks: {
  beforeCreate: async (context) => {
    if (context.user) {
      // User is authenticated, set metadata
      context.data.createdBy = context.user.id;
      context.data.createdAt = new Date();
    }
  }
}
```

## Advanced Configuration

### Custom User Extraction

```typescript
betterAuthPlugin({
  // Custom user extraction logic
  getUserFromRequest: async (request) => {
    // Extract user from custom header or token
    const token = request.headers.authorization;
    if (token) {
      return await validateCustomToken(token);
    }
    return null;
  }
})
```

### Session Validation

```typescript
betterAuthPlugin({
  session: {
    autoValidate: true, // Automatically validate sessions
    validate: async (session) => {
      // Custom session validation logic
      return session.expiresAt > new Date();
    }
  }
})
```

## Integration with Next.js

```typescript
// pages/api/auth/[...all].ts
export { auth as GET, auth as POST } from "../../lib/auth-config";

// pages/api/query/[...all].ts
export const handler = query.handler;
export { handler as GET, handler as POST };
```

## Error Handling

The integration provides detailed error messages for authorization failures:

```typescript
// Role-based error: "Role 'user' does not have access to resource 'admin-panel'"
// Operation error: "Role 'user' does not have permission to delete on resource 'product'"
// Authentication error: "Authentication required"
```

## Migration Best Practices

1. **Test migrations in development** before applying to production
2. **Backup your database** before running migrations
3. **Use gradual rollouts** for breaking changes
4. **Monitor application logs** during migration deployment
5. **Have rollback procedures** ready

## TypeScript Integration

Better Query with Better Auth provides full TypeScript support:

```typescript
// Types are automatically inferred from your Better Auth instance
type User = typeof auth.$inferredTypes.User;

// Context helpers are fully typed
const user: User | null = authContext.getUser(context);

// Permission functions have typed context
permissions: {
  create: async (context: BetterAuthPermissionContext<User>) => {
    // context.user is properly typed as User
    return context.user?.role === "admin";
  }
}
```

This integration makes Better Auth and Better Query work seamlessly together, providing type-safe authentication, authorization, and session management for your applications.