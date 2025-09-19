# Better CRUD

A standalone, type-safe CRUD generator built on top of `better-call` that follows the architecture patterns of better-auth. Generate REST API endpoints for your resources with minimal configuration.

## Features

- 🚀 **Standalone**: Independent package, not tied to better-auth
- 🔧 **Automatic Endpoint Generation**: Creates full CRUD endpoints for any resource
- ✅ **Type-Safe**: Full TypeScript support with Zod schema validation
- 🔒 **Granular Permissions**: Configure permissions per operation (create, read, update, delete, list)
- 🎛️ **Configurable**: Enable/disable specific endpoints per resource
- 📊 **Pagination**: Built-in pagination support for list endpoints
- 🔍 **Search**: Basic search functionality for list operations
- 🏗️ **Database Agnostic**: Works with SQLite, PostgreSQL, and MySQL via Kysely
- 🌐 **Framework Agnostic**: Works with any framework that supports Web API handlers

## Installation

```bash
npm install better-crud
# or
yarn add better-crud
# or
pnpm add better-crud
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
import { betterCrud, createResource, productSchema } from "better-crud";

export const crud = betterCrud({
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

### 2. Framework Integration

#### Next.js App Router

```typescript
// app/api/[...crud]/route.ts
import { crud } from "@/lib/crud";

export const GET = crud.handler;
export const POST = crud.handler;
export const PATCH = crud.handler;
export const DELETE = crud.handler;
```

#### Hono

```typescript
import { Hono } from "hono";
import { crud } from "./crud";

const app = new Hono();

app.all("/api/*", async (c) => {
  const response = await crud.handler(c.req.raw);
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

### 3. Generated Endpoints

For each resource, the following endpoints are automatically created:

- `POST /api/product` - Create a product
- `GET /api/product/:id` - Get a product by ID
- `PATCH /api/product/:id` - Update a product
- `DELETE /api/product/:id` - Delete a product
- `GET /api/products` - List products (with pagination)

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

const crud = betterCrud({
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
```

## Built-in Schemas

Better CRUD comes with several pre-defined schemas:

```typescript
import { 
  productSchema, 
  categorySchema, 
  tagSchema, 
  orderSchema,
  userSchema,
  postSchema 
} from "better-crud";
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
  schema: productSchema,
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
const crud = betterCrud({
  resources: [/* ... */],
  database: {/* ... */},
  basePath: "/api/v1", // All endpoints will be prefixed with /api/v1
});
```

## API Usage Examples

### Creating a Resource

```typescript
const response = await fetch('/api/product', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Awesome Product',
    price: 29.99,
    description: 'A really cool product',
    status: 'active',
  }),
});

const product = await response.json();
```

### Fetching with Pagination

```typescript
const response = await fetch('/api/products?page=1&limit=10&search=awesome&sortBy=name&sortOrder=asc');
const { items, pagination } = await response.json();

console.log(pagination);
// { page: 1, limit: 10, total: 25, totalPages: 3, hasNext: true, hasPrev: false }
```

### Updating a Resource

```typescript
const response = await fetch('/api/product/123', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    price: 24.99,
    status: 'active',
  }),
});
```

## Database Support

Better CRUD supports multiple database providers through Kysely:

- **SQLite**: Perfect for development and small applications
- **PostgreSQL**: Production-ready with advanced features
- **MySQL**: Wide compatibility and good performance

### Auto-Migration

Enable auto-migration to automatically create tables based on your schemas:

```typescript
const crud = betterCrud({
  resources: [/* ... */],
  database: {
    provider: "sqlite",
    url: "sqlite:./database.db",
    autoMigrate: true, // Creates tables automatically
  },
});
```

## Error Handling

Better CRUD returns standard HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `403` - Forbidden (permission denied)
- `404` - Not Found
- `500` - Internal Server Error

## Type Safety

The TypeScript integration provides full type safety:

```typescript
// Types are automatically inferred from your schemas
type Product = z.infer<typeof productSchema>;

// CRUD instance is fully typed
const crud = betterCrud({...});
// crud.api.createProduct, crud.api.getProduct, etc. are all typed
```

## Contributing

Better CRUD follows the patterns established by better-auth. When contributing:

1. Follow the existing code style
2. Add tests for new functionality
3. Update documentation
4. Ensure TypeScript compatibility
5. Test with multiple database adapters

## License

MIT