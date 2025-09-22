# Adiemus Documentation

Complete documentation for Adiemus - A powerful, type-safe CRUD generator for TypeScript applications.

## Table of Contents

- [Introduction](#introduction)
  - [Key Features](#key-features)
  - [Why Adiemus?](#why-adiemus)
- [Concepts](#concepts)
  - [Core Architecture](#core-architecture)
  - [Data Flow](#data-flow)
  - [Type Safety](#type-safety)
- [Get Started](#get-started)
  - [Installation](#installation)
  - [Quick Setup](#quick-setup)
  - [Generated Endpoints](#generated-endpoints)
  - [Built-in Schemas](#built-in-schemas)
- [Database](#database)
  - [Supported Databases](#supported-databases)
  - [Configuration](#configuration)
  - [Auto-Migration](#auto-migration)
  - [Adapter System](#adapter-system)
  - [Relationships](#relationships)
- [Hooks](#hooks)
  - [Hook Types](#hook-types)
  - [Hook Context](#hook-context)
  - [Hook Examples](#hook-examples)
  - [Built-in Hook Utilities](#built-in-hook-utilities)
  - [Hook Execution Order](#hook-execution-order)
- [Plugins](#plugins)
  - [Plugin Architecture](#plugin-architecture)
  - [Built-in Plugins](#built-in-plugins)
  - [Creating Custom Plugins](#creating-custom-plugins)
  - [Plugin Development Best Practices](#plugin-development-best-practices)
- [Testing & Development](#testing--development)
- [Contributing](#contributing)

---

## Introduction

**Adiemus** is a standalone, type-safe CRUD generator built on top of `better-call` that follows the architecture patterns of Better-Auth. It provides a simple yet powerful way to generate REST API endpoints for your resources with minimal configuration while maintaining full TypeScript support and database agnostic operations.

### Key Features

- 🚀 **Standalone**: Independent package, not tied to any specific authentication library
- 🔧 **Automatic Endpoint Generation**: Creates full CRUD endpoints for any resource
- ✅ **Type-Safe**: Full TypeScript support with Zod schema validation
- 🔒 **Granular Permissions**: Configure permissions per operation (create, read, update, delete, list)
- 🎛️ **Configurable**: Enable/disable specific endpoints per resource
- 📊 **Pagination**: Built-in pagination support for list endpoints
- 🔍 **Search**: Basic search functionality for list operations
- 🏗️ **Database Agnostic**: Works with SQLite, PostgreSQL, and MySQL via Kysely
- 🌐 **Framework Agnostic**: Works with any framework that supports Web API handlers
- 🎯 **Type-Safe Client**: Client SDK with full TypeScript support, similar to Better-Auth
- 🔌 **Extensible Plugin System**: Extend functionality with plugins for audit, validation, caching, and more

### Why Adiemus?

Adiemus was designed to fill the gap between simple CRUD generators and complex ORM solutions. It provides:

1. **Developer Experience**: TypeScript-first design with excellent auto-completion and type safety
2. **Flexibility**: Works with any framework, database, and authentication system
3. **Simplicity**: Minimal configuration while maintaining powerful features
4. **Scalability**: Plugin system allows extending functionality as your application grows
5. **Consistency**: Follows established patterns from Better-Auth for familiar developer experience

---

## Concepts

### Core Architecture

Adiemus follows a modular architecture inspired by Better-Auth, consisting of several key components:

#### Resources
Resources represent your data entities (like users, products, posts). Each resource is defined with:
- A **name** (e.g., "product")
- A **Zod schema** for validation
- **Permissions** for each operation
- Optional **endpoints configuration** to enable/disable specific operations

#### Endpoints
For each resource, Adiemus automatically generates RESTful endpoints:
- `POST /api/product` - Create a product
- `GET /api/product/:id` - Get a product by ID
- `PATCH /api/product/:id` - Update a product
- `DELETE /api/product/:id` - Delete a product
- `GET /api/products` - List products (with pagination and search)

#### Adapters
The adapter system provides database abstraction, allowing you to use different ORMs or databases:
- **Kysely Adapter** (built-in): SQLite, PostgreSQL, MySQL support
- **Custom Adapters**: Implement your own for Prisma, TypeORM, or any database system

#### Plugins
Plugins extend core functionality without modifying the core library:
- **Audit Plugin**: Automatic logging of all operations
- **Validation Plugin**: Enhanced validation and sanitization
- **Cache Plugin**: Intelligent caching for read operations
- **OpenAPI Plugin**: Automatic API documentation generation

#### Client SDK
Type-safe client similar to Better-Auth's client:
- Full TypeScript inference from your server configuration
- Automatic error handling and retry logic
- Consistent API across all resources

### Data Flow

1. **Request** → Framework handler (Next.js, Hono, Express)
2. **Router** → Better-Call routes to appropriate endpoint
3. **Middleware** → Global and plugin middleware execution
4. **Permissions** → Resource-level permission checks
5. **Validation** → Zod schema validation
6. **Hooks** → Before hooks execution (plugins + custom)
7. **Database** → Adapter executes database operation
8. **Hooks** → After hooks execution (plugins + custom)
9. **Response** → Formatted JSON response

### Type Safety

Adiemus provides end-to-end type safety:

```typescript
// Server: Define your resource with Zod
const productSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  status: z.enum(["active", "inactive"]),
});

// Server: Create CRUD instance
const crud = adiemus({
  resources: [createResource({ name: "product", schema: productSchema })],
  database: { provider: "sqlite", url: "database.db" }
});

// Client: Full type inference
const client = createCrudClient<typeof crud>();

// TypeScript enforces schema validation
await client.product.create({
  name: "T-Shirt",        // ✅ Required string
  price: 29.99,           // ✅ Required positive number
  status: "active",       // ✅ Required enum value
  // extra: "field"       // ❌ TypeScript error: unknown property
});
```

---

## Get Started

### Installation

```bash
npm install adiemus
# or
yarn add adiemus
# or
pnpm add adiemus
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

### Quick Setup

#### 1. Define Your Resource

```typescript
import { z } from "zod";
import { adiemus, createResource } from "adiemus";

// Define your data schema
const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  price: z.number().positive("Price must be positive"),
  description: z.string().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});
```

#### 2. Create CRUD Instance

```typescript
export const crud = adiemus({
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
    autoMigrate: true,              // Automatically create tables
  },
});
```

#### 3. Framework Integration

##### Next.js App Router

```typescript
// app/api/[...crud]/route.ts
import { crud } from "@/lib/crud";

export const GET = crud.handler;
export const POST = crud.handler;
export const PATCH = crud.handler;
export const DELETE = crud.handler;
```

##### Hono

```typescript
import { Hono } from "hono";
import { crud } from "./crud";

const app = new Hono();

app.all("/api/*", async (c) => {
  const response = await crud.handler(c.req.raw);
  return response;
});
```

##### Express

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

#### 4. Client Setup

```typescript
// lib/crud-client.ts
import { createCrudClient } from "adiemus";
import type { crud } from "./crud";

export const crudClient = createCrudClient<typeof crud>({
  baseURL: process.env.CRUD_URL || "http://localhost:3000/api",
});
```

#### 5. Using the Client

```typescript
// Create a product
const result = await crudClient.product.create({
  name: "Awesome T-Shirt",
  price: 29.99,
  description: "High quality cotton shirt",
  status: "active",
});

if (result.error) {
  console.error("Error:", result.error);
} else {
  console.log("Created product:", result.data);
}

// List products with pagination
const products = await crudClient.product.list({
  page: 1,
  limit: 10,
  search: "shirt",
  sortBy: "name",
  sortOrder: "asc",
});

console.log("Products:", products.data.items);
console.log("Pagination:", products.data.pagination);
```

### Generated Endpoints

For each resource, the following endpoints are automatically created:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/product` | Create a new product |
| `GET` | `/api/product/:id` | Get a product by ID |
| `PATCH` | `/api/product/:id` | Update a product |
| `DELETE` | `/api/product/:id` | Delete a product |
| `GET` | `/api/products` | List products with pagination |

### Built-in Schemas

Adiemus includes several pre-defined schemas for common use cases:

```typescript
import { 
  productSchema, 
  categorySchema, 
  tagSchema, 
  orderSchema,
  userSchema,
  postSchema 
} from "adiemus";

const crud = adiemus({
  resources: [
    createResource({ name: "product", schema: productSchema }),
    createResource({ name: "category", schema: categorySchema }),
    createResource({ name: "tag", schema: tagSchema }),
  ],
  database: { provider: "sqlite", url: "database.db" }
});
```

### Error Handling & Response Format

Adiemus uses a consistent response format across all endpoints:

#### Success Response
```typescript
{
  data: T,           // The actual response data
  success: true
}
```

#### Error Response
```typescript
{
  error: {
    code: string,    // Error code (e.g., "VALIDATION_FAILED")
    message: string, // Human-readable error message
    details?: any    // Additional error details
  },
  success: false
}
```

#### Client Error Codes

```typescript
const CRUD_ERROR_CODES = {
  VALIDATION_FAILED: "VALIDATION_FAILED",
  FORBIDDEN: "FORBIDDEN", 
  NOT_FOUND: "NOT_FOUND",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  CONFLICT: "CONFLICT",
  HOOK_EXECUTION_FAILED: "HOOK_EXECUTION_FAILED",
} as const;
```

#### Error Handling in Client

```typescript
const result = await crudClient.product.create(productData);

if (result.error) {
  switch (result.error.code) {
    case "VALIDATION_FAILED":
      console.error("Validation error:", result.error.details);
      break;
    case "FORBIDDEN":
      console.error("Permission denied");
      break;
    case "NOT_FOUND":
      console.error("Resource not found");
      break;
    default:
      console.error("Unknown error:", result.error.message);
  }
} else {
  console.log("Success:", result.data);
}
```

---

## Database

### Supported Databases

Adiemus supports multiple database providers through the Kysely query builder:

- **SQLite**: Perfect for development and small applications
- **PostgreSQL**: Production-ready with advanced features
- **MySQL**: Wide compatibility and good performance

### Configuration

#### SQLite

```typescript
const crud = adiemus({
  resources: [/* ... */],
  database: {
    provider: "sqlite",
    url: "sqlite:./database.db",
    autoMigrate: true,
  },
});
```

#### PostgreSQL

```typescript
const crud = adiemus({
  resources: [/* ... */],
  database: {
    provider: "postgres",
    url: "postgres://user:password@localhost:5432/dbname",
    autoMigrate: true,
  },
});
```

#### MySQL

```typescript
const crud = adiemus({
  resources: [/* ... */],
  database: {
    provider: "mysql",
    url: "mysql://user:password@localhost:3306/dbname",
    autoMigrate: true,
  },
});
```

### Auto-Migration

Auto-migration automatically creates and updates database tables based on your Zod schemas:

```typescript
const crud = adiemus({
  resources: [
    createResource({
      name: "product",
      schema: z.object({
        id: z.string(),
        name: z.string(),
        price: z.number(),
        // Adding a new field will automatically add the column
        category: z.string().optional(),
      }),
    }),
  ],
  database: {
    provider: "sqlite",
    url: "database.db",
    autoMigrate: true,  // Enables automatic schema migration
  },
});
```

**How it works:**
1. Adiemus converts your Zod schemas to database field definitions
2. On startup, it compares current schema with database structure
3. Missing tables and columns are automatically created
4. Existing data is preserved during migrations

**Limitations:**
- Auto-migration only adds tables and columns
- Column deletion and type changes require manual migration
- Not recommended for production without testing

### Custom Table Names

```typescript
createResource({
  name: "product",
  schema: productSchema,
  tableName: "custom_products_table",  // Custom table name
})
```

### Adapter System

Adiemus uses an adapter pattern for database abstraction. The built-in Kysely adapter supports SQLite, PostgreSQL, and MySQL, but you can create custom adapters for other systems.

#### Custom Adapter

```typescript
import { CrudAdapter } from "adiemus";

class PrismaAdapter implements CrudAdapter {
  constructor(private prisma: PrismaClient) {}

  async create(params) {
    const { model, data } = params;
    return await this.prisma[model].create({ data });
  }

  async findFirst(params) {
    const { model, where = [] } = params;
    const whereClause = this.convertWhere(where);
    return await this.prisma[model].findFirst({ where: whereClause });
  }

  // ... implement other methods
}

// Use custom adapter
const crud = adiemus({
  resources: [/* ... */],
  database: {
    adapter: new PrismaAdapter(prisma),
  },
});
```

### Relationships

Adiemus supports defining relationships between resources:

```typescript
import { RelationshipManager } from "adiemus";

const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  categoryId: z.string(),
});

const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
});

const crud = adiemus({
  resources: [
    createResource({ name: "product", schema: productSchema }),
    createResource({ name: "category", schema: categorySchema }),
  ],
  database: { provider: "sqlite", url: "database.db" },
  relationships: {
    product: {
      category: {
        type: "belongsTo",
        target: "category",
        foreignKey: "categoryId",
      },
    },
    category: {
      products: {
        type: "hasMany",
        target: "product",
        foreignKey: "categoryId",
      },
    },
  },
});
```

---

## Hooks

Hooks allow you to execute custom logic at different stages of CRUD operations. They provide a powerful way to add business logic, validation, logging, and side effects.

### Hook Types

#### Resource-Level Hooks

Define hooks directly on your resources:

```typescript
createResource({
  name: "product",
  schema: productSchema,
  hooks: {
    // Before operations
    beforeCreate: async (context) => {
      // Add timestamps
      context.data.createdAt = new Date();
      context.data.id = generateId();
    },
    
    beforeUpdate: async (context) => {
      // Update timestamp
      context.data.updatedAt = new Date();
    },
    
    beforeDelete: async (context) => {
      // Prevent deletion of important records
      if (context.existingData.important) {
        throw new Error("Cannot delete important record");
      }
    },
    
    // After operations
    afterCreate: async (context) => {
      // Send notification
      await sendNotification(context.user, context.result);
    },
    
    afterUpdate: async (context) => {
      // Clear cache
      await clearCache(context.id);
    },
    
    afterDelete: async (context) => {
      // Cleanup related data
      await cleanupRelatedData(context.id);
    },
  },
})
```

#### Global Hooks

Apply hooks to all resources:

```typescript
const crud = adiemus({
  resources: [/* ... */],
  database: { provider: "sqlite", url: "database.db" },
  hooks: {
    beforeCreate: async (context) => {
      // Global validation
      if (!context.user) {
        throw new Error("Authentication required");
      }
    },
    afterCreate: async (context) => {
      // Global audit logging
      console.log(`${context.user.id} created ${context.resource}/${context.result.id}`);
    },
  },
});
```

### Hook Context

Each hook receives a context object with relevant information:

```typescript
interface CrudHookContext {
  // Request information
  resource: string;           // Resource name (e.g., "product")
  operation: string;          // Operation type ("create", "read", "update", "delete", "list")
  
  // Data
  data?: Record<string, any>; // Input data (for create/update)
  existingData?: Record<string, any>; // Current data (for update/delete)
  result?: any;               // Operation result (in after hooks)
  
  // Query information
  id?: string;                // Record ID (for read/update/delete)
  where?: CrudWhere[];        // Where conditions (for list/update/delete)
  
  // User context
  user?: any;                 // Current user (if available)
  headers?: Record<string, string>; // Request headers
  
  // Control flow
  skip?: boolean;             // Skip the operation (set in before hooks)
  metadata?: Record<string, any>; // Pass data between hooks
}
```

### Hook Examples

#### Audit Logging

```typescript
const auditHook = async (context: CrudHookContext) => {
  await db.auditLog.create({
    data: {
      resource: context.resource,
      operation: context.operation,
      userId: context.user?.id,
      recordId: context.id || context.result?.id,
      timestamp: new Date(),
      changes: context.data,
    },
  });
};

createResource({
  name: "product",
  schema: productSchema,
  hooks: {
    afterCreate: auditHook,
    afterUpdate: auditHook,
    afterDelete: auditHook,
  },
})
```

#### Data Validation

```typescript
createResource({
  name: "order",
  schema: orderSchema,
  hooks: {
    beforeCreate: async (context) => {
      // Business logic validation
      if (context.data.quantity <= 0) {
        throw new Error("Quantity must be positive");
      }
      
      // Check inventory
      const product = await getProduct(context.data.productId);
      if (product.stock < context.data.quantity) {
        throw new Error("Insufficient stock");
      }
      
      // Calculate total
      context.data.total = product.price * context.data.quantity;
    },
  },
})
```

#### Ownership Control

```typescript
createResource({
  name: "post",
  schema: postSchema,
  hooks: {
    beforeUpdate: async (context) => {
      // Only allow users to update their own posts
      if (context.existingData.authorId !== context.user.id) {
        throw new Error("You can only update your own posts");
      }
    },
    beforeDelete: async (context) => {
      // Only allow users to delete their own posts or admins
      const isOwner = context.existingData.authorId === context.user.id;
      const isAdmin = context.user.role === "admin";
      
      if (!isOwner && !isAdmin) {
        throw new Error("You can only delete your own posts");
      }
    },
  },
})
```

#### Side Effects

```typescript
createResource({
  name: "user",
  schema: userSchema,
  hooks: {
    afterCreate: async (context) => {
      // Send welcome email
      await sendWelcomeEmail(context.result.email);
      
      // Create default settings
      await createDefaultSettings(context.result.id);
      
      // Update analytics
      await incrementUserCount();
    },
  },
})
```

### Built-in Hook Utilities

Adiemus provides utility functions for common hook patterns:

```typescript
import { HookUtils } from "adiemus";

createResource({
  name: "product",
  schema: productSchema,
  hooks: {
    beforeCreate: HookUtils.timestampHook,          // Adds createdAt/updatedAt
    beforeUpdate: HookUtils.updateTimestampHook,    // Updates updatedAt
    beforeCreate: HookUtils.userTrackingHook("createdBy"),  // Adds user tracking
    beforeDelete: HookUtils.softDeleteHook,         // Soft delete instead of hard delete
    afterCreate: HookUtils.notificationHook(sendEmail),     // Send notifications
  },
})
```

### Hook Execution Order

Hooks are executed in the following order:

1. **Global before hooks**
2. **Plugin before hooks**
3. **Resource before hooks**
4. **Database operation**
5. **Resource after hooks**
6. **Plugin after hooks**
7. **Global after hooks**

If any before hook throws an error or sets `context.skip = true`, the operation is aborted.

---

## Plugins

The plugin system allows you to extend Adiemus functionality without modifying the core library. Plugins can add endpoints, extend schemas, provide hooks, and integrate with external services.

### Plugin Architecture

All plugins implement the `Plugin` interface:

```typescript
interface Plugin {
  id: string;                          // Unique plugin identifier
  endpoints?: Record<string, Endpoint>; // Additional API endpoints
  schema?: PluginSchema;               // Database schema extensions
  resources?: CrudResourceConfig[];    // Additional CRUD resources
  middleware?: CrudMiddleware[];       // Global middleware
  hooks?: PluginHooks;                // Lifecycle hooks
  init?: (context: PluginInitContext) => Promise<void> | void;
  destroy?: () => Promise<void> | void;
}
```

### Built-in Plugins

#### Audit Plugin

Automatically logs all CRUD operations:

```typescript
import { auditPlugin } from "adiemus/plugins";

const crud = adiemus({
  resources: [/* ... */],
  database: { provider: "sqlite", url: "database.db" },
  plugins: [
    auditPlugin({
      enabled: true,
      operations: ["create", "update", "delete"],
      includeRequestData: true,
      includeResponseData: false,
      logger: (event) => {
        console.log(`[AUDIT] ${event.operation.toUpperCase()} on ${event.resource}`);
        console.log(`User: ${event.userId}, Time: ${event.timestamp}`);
      },
    }),
  ],
});
```

**Features:**
- Automatic audit trail creation
- Configurable operation filtering
- Custom audit loggers
- Built-in audit logs API endpoint: `GET /api/audit/logs`

**Generated Endpoints:**
- `GET /api/audit/logs` - Retrieve audit logs with filtering
- `GET /api/audit/stats` - Get audit statistics

#### Validation Plugin

Enhanced validation with sanitization:

```typescript
import { validationPlugin } from "adiemus/plugins";

const crud = adiemus({
  resources: [/* ... */],
  plugins: [
    validationPlugin({
      strict: true,
      globalRules: {
        trimStrings: true,
        sanitizeHtml: true,
        validateEmails: true,
      },
      resourceRules: {
        product: {
          name: [{ type: "trim" }, { type: "minLength", value: 2 }],
          description: [{ type: "strip" }],
        },
      },
    }),
  ],
});
```

**Features:**
- Enhanced Zod validation
- Automatic data sanitization
- Custom validation rules per resource
- HTML sanitization and XSS prevention

#### Cache Plugin

Intelligent caching for read operations:

```typescript
import { cachePlugin } from "adiemus/plugins";

const crud = adiemus({
  resources: [/* ... */],
  plugins: [
    cachePlugin({
      enabled: true,
      defaultTTL: 300,  // 5 minutes
      resources: {
        product: { readTTL: 600, listTTL: 300 },
        category: { readTTL: 1200, listTTL: 600 },
      },
      invalidateOnUpdate: true,
      storage: "memory", // "memory" | "redis"
    }),
  ],
});
```

**Features:**
- Automatic cache invalidation
- Per-resource TTL configuration
- Memory and Redis storage options
- Cache statistics endpoint

**Generated Endpoints:**
- `GET /api/cache/stats` - Get cache statistics
- `DELETE /api/cache/clear` - Clear cache

#### OpenAPI Plugin

Automatic API documentation generation:

```typescript
import { openApiPlugin } from "adiemus/plugins";

const crud = adiemus({
  resources: [/* ... */],
  plugins: [
    openApiPlugin({
      path: "/docs",
      theme: "default",
      disableDefaultReference: false,
    }),
  ],
});
```

**Features:**
- Automatic OpenAPI schema generation
- Interactive documentation with Scalar
- Schema validation integration
- Customizable themes

**Generated Endpoints:**
- `GET /api/openapi/schema` - OpenAPI schema JSON
- `GET /docs` - Interactive documentation page

### Creating Custom Plugins

#### Basic Plugin

```typescript
import { createPlugin } from "adiemus";

const timestampPlugin = createPlugin({
  id: "timestamp",
  hooks: {
    beforeCreate: async (context) => {
      context.data.createdAt = new Date();
      context.data.updatedAt = new Date();
    },
    beforeUpdate: async (context) => {
      context.data.updatedAt = new Date();
    },
  },
});
```

#### Plugin with Endpoints

```typescript
const analyticsPlugin = createPlugin({
  id: "analytics",
  endpoints: {
    getStats: createCrudEndpoint(
      "/analytics/stats",
      { method: "GET" },
      async (ctx) => {
        const stats = await calculateStats();
        return ctx.json(stats);
      }
    ),
  },
  hooks: {
    afterCreate: async (context) => {
      await recordAnalyticsEvent("create", context.resource);
    },
  },
});
```

#### Plugin with Schema Extension

```typescript
const auditTrailPlugin = createPlugin({
  id: "audit-trail",
  schema: {
    audit_logs: {
      fields: {
        id: { type: "text", primaryKey: true },
        resource: { type: "text", required: true },
        operation: { type: "text", required: true },
        userId: { type: "text" },
        timestamp: { type: "integer", required: true },
        data: { type: "text" },
      },
    },
  },
  endpoints: {
    getAuditLogs: createCrudEndpoint(
      "/audit/logs",
      { method: "GET" },
      async (ctx) => {
        const logs = await ctx.context.adapter.findMany({
          model: "audit_logs",
          orderBy: [{ field: "timestamp", direction: "desc" }],
        });
        return ctx.json(logs);
      }
    ),
  },
});
```

### Plugin Composition

Plugins can be composed and configured together:

```typescript
const crud = adiemus({
  resources: [/* ... */],
  database: { provider: "sqlite", url: "database.db" },
  plugins: [
    // Order matters for hooks
    validationPlugin({ strict: true }),
    auditPlugin({ enabled: true }),
    cachePlugin({ defaultTTL: 300 }),
    openApiPlugin({ path: "/docs" }),
    
    // Custom plugins
    timestampPlugin(),
    analyticsPlugin(),
  ],
});
```

### Plugin Development Best Practices

1. **Unique Plugin IDs**: Use descriptive, unique identifiers
2. **Error Handling**: Always handle errors in hooks gracefully
3. **Performance**: Consider the performance impact of hooks
4. **Configuration**: Make plugins configurable for different use cases
5. **Documentation**: Document your custom plugins well
6. **Testing**: Write tests for plugin functionality

### Plugin Examples

#### File Upload Plugin

```typescript
const fileUploadPlugin = createPlugin({
  id: "file-upload",
  endpoints: {
    uploadFile: createCrudEndpoint(
      "/upload",
      { method: "POST" },
      async (ctx) => {
        const formData = await ctx.request.formData();
        const file = formData.get("file") as File;
        
        if (!file) {
          return ctx.json({ error: "No file provided" }, 400);
        }
        
        const uploadedFile = await saveFile(file);
        return ctx.json({ url: uploadedFile.url });
      }
    ),
  },
});
```

#### Rate Limiting Plugin

```typescript
const rateLimitPlugin = createPlugin({
  id: "rate-limit",
  middleware: [
    async (context, next) => {
      const userId = context.user?.id || context.headers["x-forwarded-for"];
      const limit = await checkRateLimit(userId);
      
      if (limit.exceeded) {
        throw new Error("Rate limit exceeded");
      }
      
      return next();
    },
  ],
});
```

#### Notification Plugin

```typescript
const notificationPlugin = createPlugin({
  id: "notifications",
  hooks: {
    afterCreate: async (context) => {
      const subscribers = await getSubscribers(context.resource);
      for (const subscriber of subscribers) {
        await sendNotification(subscriber, {
          type: "created",
          resource: context.resource,
          data: context.result,
        });
      }
    },
  },
});
```

### Type Safety

The plugin system is fully typed and provides excellent TypeScript support:

```typescript
// Plugin endpoints are automatically typed
const crud = adiemus({
  plugins: [auditPlugin(), cachePlugin()],
});

// These endpoints exist and are typed
crud.api.getAuditLogs({ query: { resource: "user" } });
crud.api.getCacheStats();
```

---

## Examples

### React Application Example

```typescript
// hooks/useProducts.ts
import { useState, useEffect } from 'react';
import { crudClient } from '@/lib/crud-client';

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await crudClient.product.list(params);
      
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
      const result = await crudClient.product.create(productData);
      
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

### Complete Setup Example

```typescript
// lib/crud.ts
import { adiemus, createResource, auditPlugin, cachePlugin } from "adiemus";
import { z } from "zod";

const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  price: z.number().positive(),
  description: z.string().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
  categoryId: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
});

export const crud = adiemus({
  resources: [
    createResource({
      name: "product",
      schema: productSchema,
      permissions: {
        create: async (context) => !!context.user,
        read: () => true,
        update: async (context) => {
          return context.user?.role === "admin" || 
                 context.existingData?.createdBy === context.user?.id;
        },
        delete: async (context) => context.user?.role === "admin",
        list: () => true,
      },
      hooks: {
        beforeCreate: async (context) => {
          context.data.createdBy = context.user?.id;
        },
      },
    }),
    createResource({
      name: "category",
      schema: categorySchema,
      permissions: {
        create: async (context) => context.user?.role === "admin",
        read: () => true,
        update: async (context) => context.user?.role === "admin",
        delete: async (context) => context.user?.role === "admin",
        list: () => true,
      },
    }),
  ],
  database: {
    provider: "sqlite",
    url: "sqlite:./ecommerce.db",
    autoMigrate: true,
  },
  plugins: [
    auditPlugin({
      enabled: true,
      operations: ["create", "update", "delete"],
    }),
    cachePlugin({
      enabled: true,
      defaultTTL: 300,
      resources: {
        category: { readTTL: 600, listTTL: 300 },
      },
    }),
  ],
});

// lib/crud-client.ts
import { createCrudClient } from "adiemus";
import type { crud } from "./crud";

export const crudClient = createCrudClient<typeof crud>({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api",
});
```

---

## Testing & Development

### Running Tests

Adiemus includes a comprehensive test suite:

```bash
cd packages/better-crud
npm test
# or for watch mode
npm run test:watch
```

### Development Environment

For local development:

```bash
# Install dependencies
npm install

# Start development mode (watch)
npm run dev

# Type checking
npm run typecheck

# Build the package
npm run build
```

### Environment Variables

Adiemus supports automatic base URL inference from environment variables:

```env
# For standalone usage
CRUD_URL=http://localhost:3000/api

# For Next.js applications
NEXT_PUBLIC_CRUD_URL=http://localhost:3000/api

# For Vercel deployments
VERCEL_URL=https://your-app.vercel.app
NEXT_PUBLIC_VERCEL_URL=https://your-app.vercel.app
```

### Browser Compatibility

Adiemus works in any environment that supports:
- Modern JavaScript (ES2020+)
- Fetch API or polyfill
- Web API Request/Response objects

This includes:
- Node.js 16+ (with polyfills)
- All modern browsers
- Edge runtime environments (Vercel Edge, Cloudflare Workers)
- Bun and Deno runtime environments

---

## Contributing

Adiemus follows the patterns established by Better-Auth. When contributing:

1. **Code Style**: Follow the existing TypeScript patterns and use Biome for formatting
2. **Testing**: Add tests for new functionality using Vitest
3. **Documentation**: Update documentation for new features
4. **Type Safety**: Ensure full TypeScript compatibility
5. **Database Testing**: Test with multiple database adapters when applicable

### Project Structure

```
packages/better-crud/
├── src/
│   ├── adapters/          # Database adapters
│   ├── client/            # Client SDK
│   ├── endpoints/         # Endpoint generators
│   ├── plugins/           # Built-in plugins
│   ├── schemas/           # Pre-defined schemas
│   ├── types/             # TypeScript types
│   ├── utils/             # Utility functions
│   ├── crud.ts            # Main factory function
│   └── index.ts           # Package exports
├── examples/              # Usage examples
├── tests/                 # Test files
└── package.json
```

---

## License

MIT License - same as the Better-Auth project.

---

This documentation provides a comprehensive overview of Adiemus, covering all the essential concepts, setup, and usage patterns. The modular structure makes it easy to navigate and find specific information, while the examples provide practical guidance for implementation.