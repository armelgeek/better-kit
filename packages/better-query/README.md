# Better Query

A standalone, type-safe CRUD generator built on top of `better-call` that follows the architecture patterns of better-auth. Generate REST API endpoints for your resources with minimal configuration.

## Features

- 🚀 **Standalone**: Independent package, not tied to better-auth
- 🔧 **Automatic Endpoint Generation**: Creates full CRUD endpoints for any resource
- ✅ **Type-Safe**: Full TypeScript support with Zod schema validation
- 🔒 **Granular Permissions**: Configure permissions per operation (create, read, update, delete, list)
- 🔐 **Better Auth Integration**: Native integration with Better Auth for authentication and authorization
- 🛡️ **Role-Based Security**: Define permissions based on user roles and organization membership
- 🔄 **Schema Migrations**: Automated detection and handling of breaking schema changes
- 🎛️ **Configurable**: Enable/disable specific endpoints per resource
- 📊 **Pagination**: Built-in pagination support for list endpoints
- 🔍 **Search**: Basic search functionality for list operations
- 🏗️ **Database Agnostic**: Works with SQLite, PostgreSQL, and MySQL via Kysely
- 🌐 **Framework Agnostic**: Works with any framework that supports Web API handlers
- 🎯 **Type-Safe Client**: Client SDK with full TypeScript support, similar to better-auth

## Installation

```bash
npm install better-query
# or
yarn add better-query
# or
pnpm add better-query
```

### Database Dependencies

Install the appropriate database driver for your provider:

```bash
# For SQLite
npm install better-sqlite3

# For PostgreSQL  
npm install pg @types/pg

# For MySQL
npm install mysql2
```

## Quick Start

### 1. Basic Setup

```typescript
import { betterQuery, createResource, withId } from "better-query";
import { z } from "zod";

// Define your custom schema
const productSchema = withId({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be positive"),
  status: z.enum(["active", "inactive", "draft"]).default("draft"),
});

export const query = betterQuery({
  resources: [
    createResource({
      name: "product",
      schema: productSchema,
      permissions: {
        create: () => true,         // Allow all creates
        read: () => true,           // Allow all reads
        update: () => true,         // Allow all updates  
        delete: () => false,        // Disallow all deletes
        list: () => true,           // Allow all lists
      },
    }),
  ],
  database: {
    provider: "sqlite",
    url: "sqlite:./database.db",
    autoMigrate: true,
  },
});
```

### 2. Client Setup (NEW!)

Create a type-safe client for your CRUD operations:

```typescript
import { createQueryClient } from "better-query";

// Create the client with type inference from your query instance
export const queryClient = createQueryClient<typeof query>({
  baseURL: "http://localhost:3000/api",
});

// Now you can use the client with full type safety:
await queryClient.product.create({
  name: "Tee shirt",
  price: 29.99,
}, {
  headers: {
    "Authorization": "Bearer your-token",
  }
});
```

#### TypeScript Auto-completion & Type Safety

The client provides full TypeScript support similar to better-auth:

```typescript
// ✅ Auto-completion for all resources and methods
crudClient.product.create({ /* schema-based suggestions */ });
crudClient.category.list({ /* typed parameters */ });

// ✅ Schema validation - TypeScript enforces required fields
await crudClient.product.create({
  name: "Required field",     // ✅ TypeScript enforces this
  price: 29.99,              // ✅ Validates number type
  status: "active",          // ✅ Enum validation
  // description: "optional"  // ✅ Optional fields suggested
});

// ✅ Partial updates with proper typing
await crudClient.product.update("id", {
  price: 34.99,  // ✅ Only update fields you want to change
});

// ✅ Properly typed responses
const result = await crudClient.product.create(data);
if (result.error) {
  console.log(result.error.code);     // ✅ Typed error codes
} else {
  console.log(result.data.name);      // ✅ Typed response data
}
```

#### Error Handling

Better Query includes error codes similar to better-auth:

```typescript
// Access error codes
console.log(queryClient.$ERROR_CODES.VALIDATION_FAILED);
console.log(queryClient.$ERROR_CODES.FORBIDDEN);
console.log(queryClient.$ERROR_CODES.NOT_FOUND);

// Typed error handling pattern
type ErrorTypes = Partial<
  Record<
    keyof typeof queryClient.$ERROR_CODES,
    {
      en: string;
      es: string;
    }
  >
>;

const errorCodes = {
  VALIDATION_FAILED: {
    en: "validation failed",
    es: "validación fallida",
  },
  FORBIDDEN: {
    en: "access denied",
    es: "acceso denegado", 
  },
} satisfies ErrorTypes;

const getErrorMessage = (code: string, lang: "en" | "es") => {
  if (code in errorCodes) {
    return errorCodes[code as keyof typeof errorCodes][lang];
  }
  return "";
};

// Usage in components
const result = await queryClient.product.create(data);
if (result.error?.code) {
  alert(getErrorMessage(result.error.code, "en"));
}
```

## Better Auth Integration

Better Query provides native integration with Better Auth for seamless authentication and authorization:

```typescript
import { betterAuth } from "better-auth";
import { betterQuery, betterAuth as betterAuthPlugin } from "better-query";

// 1. Setup Better Auth
const auth = betterAuth({
  database: { provider: "sqlite", url: "auth.db" },
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: { enabled: true },
});

// 2. Integrate with Better Query
const query = betterQuery({
  basePath: "/api/query",
  database: { provider: "sqlite", url: "data.db", autoMigrate: true },
  
  // Enable Better Auth plugin
  plugins: [
    betterAuthPlugin({
      auth,
      rolePermissions: {
        admin: {
          resources: ["*"], // Access to all resources
          operations: ["create", "read", "update", "delete", "list"],
        },
        user: {
          operations: ["read", "create"],
        }
      }
    })
  ],
  
  resources: [
    createResource({
      name: "product",
      schema: productSchema,
      permissions: {
        create: async (context) => !!context.user, // Authenticated users only
        update: async (context) => {
          const user = context.user as { role?: string; id: string };
          return user?.role === "admin" || 
                 context.existingData?.createdBy === user?.id;
        },
      }
    })
  ]
});
```

For detailed Better Auth integration guide, see [Better Auth Integration Documentation](../docs/better-auth-integration.md).

### 3. Framework Integration

#### Next.js App Router

```typescript
// app/api/[...query]/route.ts
import { query } from "@/lib/query";

export const GET = query.handler;
export const POST = query.handler;
export const PATCH = query.handler;
export const DELETE = query.handler;
```

#### Hono

```typescript
import { Hono } from "hono";
import { query } from "./query";

const app = new Hono();

app.all("/api/*", async (c) => {
  const response = await query.handler(c.req.raw);
  return response;
});
```

#### Express

```typescript
import express from "express";
import { crud } from "./crud";

const app = express();

app.all("/api/*", async (req, res) => {
  const request = new Request(`${req.protocol}://${req.get('host')}${req.originalUrl}`, {
    method: req.method,
    headers: req.headers as any,
    body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
  });
  
  const response = await crud.handler(request);
  const data = await response.json();
  
  res.status(response.status).json(data);
});
```

### 4. Generated Endpoints

For each resource, the following endpoints are automatically created:

- `POST /api/product` - Create a product
- `GET /api/product/:id` - Get a product by ID
- `PATCH /api/product/:id` - Update a product
- `DELETE /api/product/:id` - Delete a product
- `GET /api/products` - List products (with pagination)

## Client Usage

The client provides a convenient, type-safe way to interact with your CRUD API:

### Creating Resources

```typescript
// Type-safe creation with custom headers
const product = await queryClient.products.create({
  name: "Awesome T-Shirt",
  price: 29.99,
  description: "High quality cotton shirt",
  status: "active",
}, {
  headers: {
    "Authorization": "Bearer your-token",
    "Content-Type": "application/json",
  }
});
```

### Reading Resources

```typescript
// Get a specific product
const product = await queryClient.products.read("product-id", {
  headers: {
    "Authorization": "Bearer your-token",
  }
});
```

### Updating Resources

```typescript
// Partial updates are supported
const updatedProduct = await queryClient.products.update("product-id", {
  price: 24.99,
  status: "active",
}, {
  headers: {
    "Authorization": "Bearer your-token",
  }
});
```

### Deleting Resources

```typescript
await queryClient.products.delete("product-id", {
  headers: {
    "Authorization": "Bearer your-token",
  }
});
```

### Listing Resources with Pagination

```typescript
const result = await queryClient.products.list({
  page: 1,
  limit: 10,
  search: "shirt",
  sortBy: "name",
  sortOrder: "asc",
}, {
  headers: {
    "Authorization": "Bearer your-token",
  }
});

console.log(result.data); 
// {
//   items: [...products],
//   pagination: {
//     page: 1,
//     limit: 10,
//     total: 25,
//     totalPages: 3,
//     hasNext: true,
//     hasPrev: false
//   }
// }
```

### React Hook Example

```typescript
import { useState, useEffect } from 'react';
import { queryClient } from '@/lib/query-client';

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await queryClient.products.list(params, {
        headers: {
          "Authorization": `Bearer ${getAuthToken()}`,
        }
      });
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setProducts(result.data.items);
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async (productData) => {
    try {
      const result = await queryClient.products.create(productData, {
        headers: {
          "Authorization": `Bearer ${getAuthToken()}`,
        }
      });
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      const newProduct = result.data;
      setProducts(prev => [...prev, newProduct]);
      return newProduct;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return { products, loading, error, fetchProducts, createProduct };
}
```

## Configuration

### Resource Configuration

```typescript
interface CrudResourceConfig {
  name: string;                    // Resource name (e.g., "product")
  schema: ZodSchema;              // Zod validation schema
  tableName?: string;             // Custom table name (defaults to name)
  endpoints?: {                   // Enable/disable specific endpoints
    create?: boolean;
    read?: boolean;
    update?: boolean;
    delete?: boolean;
    list?: boolean;
  };
  permissions?: {                 // Permission functions
    create?: (context: CrudPermissionContext) => Promise<boolean> | boolean;
    read?: (context: CrudPermissionContext) => Promise<boolean> | boolean;
    update?: (context: CrudPermissionContext) => Promise<boolean> | boolean;
    delete?: (context: CrudPermissionContext) => Promise<boolean> | boolean;
    list?: (context: CrudPermissionContext) => Promise<boolean> | boolean;
  };
}
```

### Client Configuration

```typescript
interface CrudClientOptions {
  baseURL?: string;               // API base URL
  headers?: Record<string, string>; // Default headers for all requests
  // ... other BetterFetchOption properties
}
```

### CRUD Options

```typescript
interface CrudOptions {
  resources: CrudResourceConfig[];  // Array of resources
  database: CrudDatabaseConfig;    // Database configuration
  basePath?: string;               // Base path for all endpoints (optional)
  requireAuth?: boolean;           // Global auth requirement (default: false)
  middleware?: CrudMiddleware[];   // Custom middleware
}
```

## Custom Schemas

Define your own schemas using Zod:

```typescript
import { z } from "zod";

const userSchema = z.object({
  id: z.string().optional(),
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(["user", "admin"]).default("user"),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

const crud = adiemus({
  resources: [
    createResource({
      name: "user",
      schema: userSchema,
    }),
  ],
  database: {
    provider: "sqlite",
    url: "sqlite:./users.db",
  },
});

// Client automatically infers the schema
const client = createCrudClient<typeof crud>();
```

## Schema Helpers

Adiemus provides helpful utilities for creating schemas:

```typescript
import { withId, withTimestamps } from "adiemus";
import { z } from "zod";

// Helper for creating schemas with id and timestamps
const productSchema = withId({
  name: z.string().min(1),
  price: z.number().positive(),
  description: z.string().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
});

// Helper for creating schemas with just timestamps
const logSchema = withTimestamps({
  level: z.enum(["info", "warn", "error"]),
  message: z.string(),
  source: z.string(),
});

// For maximum flexibility, define schemas manually
const userSchema = z.object({
  id: z.string().optional(),
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(["user", "admin"]).default("user"),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});
```

## Advanced Usage

### Custom Permissions

```typescript
createResource({
  name: "order",
  schema: orderSchema,
  permissions: {
    create: async (context) => {
      // Only allow users to create orders for themselves
      return context.user && context.data.userId === context.user.id;
    },
    read: async (context) => {
      // Users can only read their own orders, admins can read all
      if (context.user?.role === 'admin') return true;
      const order = await findOrder(context.id);
      return order?.userId === context.user?.id;
    },
    update: async (context) => {
      // Only admin users can update orders
      return context.user?.role === 'admin';
    },
    delete: () => false, // No one can delete orders
    list: async (context) => {
      return !!context.user; // Only authenticated users can list
    },
  },
})
```

### Custom Table Names

```typescript
createResource({
  name: "product",
  schema: productSchema, // Your custom schema
  tableName: "custom_products_table",
})
```

### Selective Endpoints

```typescript
createResource({
  name: "user",
  schema: userSchema,
  endpoints: {
    create: true,
    read: true,
    update: true,
    delete: false, // Disable delete endpoint
    list: true,
  },
})
```

### Base Path

```typescript
const crud = adiemus({
  resources: [/* ... */],
  database: {/* ... */},
  basePath: "/api/v1", // All endpoints will be prefixed with /api/v1
});
```

## Database Support

Adiemus supports multiple database providers through Kysely:

- **SQLite**: Perfect for development and small applications
- **PostgreSQL**: Production-ready with advanced features
- **MySQL**: Wide compatibility and good performance

### Auto-Migration

Enable auto-migration to automatically create tables based on your schemas:

```typescript
const crud = adiemus({
  resources: [/* ... */],
  database: {
    provider: "sqlite",
    url: "sqlite:./database.db",
    autoMigrate: true, // Creates tables automatically
  },
});
```

## Error Handling

Adiemus returns standard HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `403` - Forbidden (permission denied)
- `404` - Not Found
- `500` - Internal Server Error

The client automatically handles these responses:

```typescript
try {
  const product = await crudClient.products.create({
    name: "Test Product",
    price: 29.99,
  });
  
  if (product.error) {
    // Handle API errors
    console.error('API Error:', product.error);
  } else {
    // Success - use product.data
    console.log('Created:', product.data);
  }
} catch (error) {
  // Handle network/other errors
  console.error('Network Error:', error);
}
```

## Type Safety

The TypeScript integration provides full type safety:

```typescript
// Types are automatically inferred from your custom schemas
type Product = z.infer<typeof productSchema>;

// CRUD instance is fully typed
const crud = adiemus({...});
// crud.api.createProduct, crud.api.getProduct, etc. are all typed

// Client is fully typed based on your CRUD configuration
const client = createCrudClient<typeof crud>();
// client.products.create, client.products.list, etc. are all typed
```

## Environment Variables

The client can automatically infer the base URL from environment variables:

```env
# Development
BETTER_QUERY_URL=http://localhost:3000/api
# or
NEXT_PUBLIC_BETTER_QUERY_URL=http://localhost:3000/api

# Production
VERCEL_URL=https://your-app.vercel.app/api
# or
NEXT_PUBLIC_VERCEL_URL=https://your-app.vercel.app/api
```

## Contributing

Better Query follows the patterns established by better-auth. When contributing:

1. Follow the existing code style
2. Add tests for new functionality
3. Update documentation
4. Ensure TypeScript compatibility
5. Test with multiple database adapters

## License

MIT