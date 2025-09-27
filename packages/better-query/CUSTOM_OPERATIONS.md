# Custom Operations for ORM Adapters

The Better Query library now supports **custom operations** that allow you to leverage ORM-specific functionality without overloading the core library. This feature enables you to define operations that are specific to your ORM (Drizzle, Prisma, etc.) while maintaining type safety and integration with the Better Query system.

## Overview

Custom operations provide a way to:
- Use advanced ORM-specific features (batch operations, raw SQL, complex joins, etc.)
- Avoid bloating the core library with ORM-specific functionality
- Maintain type safety and consistent patterns
- Keep performance optimizations specific to your ORM

## Basic Usage

### 1. Create an Adapter with Custom Operations

```typescript
import { betterQuery, DrizzleCrudAdapter } from "better-query";
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';

const sqlite = new Database('database.db');
const db = drizzle(sqlite);

// The DrizzleCrudAdapter comes with built-in custom operations
const adapter = new DrizzleCrudAdapter(db, schema);

const query = betterQuery({
  resources: [
    // your resources
  ],
  database: {
    adapter: adapter,
  },
});
```

### 2. Using Custom Operations

```typescript
// Check if an operation exists
if (query.hasCustomOperation('batchInsert')) {
  // Execute the custom operation
  const result = await query.customOperation('batchInsert', {
    model: 'product',
    data: [
      { name: 'Product 1', price: 100 },
      { name: 'Product 2', price: 200 },
    ],
  });
}

// Get all available custom operations
const availableOperations = query.getCustomOperations();
console.log(Object.keys(availableOperations)); // ['batchInsert', 'upsert', 'rawQuery', ...]
```

## Built-in Custom Operations

### Drizzle Adapter Custom Operations

The `DrizzleCrudAdapter` includes these custom operations:

#### `rawQuery`
Execute raw SQL queries directly:
```typescript
const results = await query.customOperation('rawQuery', {
  sql: 'SELECT COUNT(*) as total FROM products WHERE price > ?',
  values: [100]
});
```

#### `batchInsert`
Efficiently insert multiple records:
```typescript
const products = await query.customOperation('batchInsert', {
  model: 'product',
  data: [
    { name: 'Product 1', price: 100 },
    { name: 'Product 2', price: 200 },
    { name: 'Product 3', price: 300 },
  ]
});
```

#### `upsert`
Insert or update on conflict:
```typescript
const product = await query.customOperation('upsert', {
  model: 'product',
  data: { name: 'Unique Product', price: 150 },
  conflictColumns: ['name'],
  updateColumns: ['price', 'updatedAt']
});
```

#### `aggregate`
Perform advanced aggregations:
```typescript
const stats = await query.customOperation('aggregate', {
  model: 'product',
  aggregations: [
    { field: 'price', operation: 'sum' },
    { field: 'price', operation: 'avg' },
    { field: 'id', operation: 'count' }
  ],
  where: [{ field: 'status', value: 'active' }],
  groupBy: ['category']
});
```

#### `customJoin`
Perform complex joins with custom logic:
```typescript
const results = await query.customOperation('customJoin', {
  baseModel: 'order',
  joins: [
    {
      model: 'user',
      type: 'inner',
      on: { left: 'userId', right: 'id' }
    },
    {
      model: 'product',
      type: 'left',
      on: { left: 'productId', right: 'id' }
    }
  ],
  select: {
    order: ['id', 'total'],
    user: ['name', 'email'],
    product: ['name', 'price']
  },
  where: {
    order: [{ field: 'status', value: 'completed' }],
    user: [{ field: 'active', value: true }]
  }
});
```

### Prisma Adapter Custom Operations

The `PrismaCrudAdapter` includes these custom operations:

#### `rawQuery`
Execute raw SQL with proper typing:
```typescript
const results = await query.customOperation('rawQuery', {
  sql: 'SELECT * FROM products WHERE price > $1',
  values: [100]
});
```

#### `transaction`
Execute multiple operations in a transaction:
```typescript
const results = await query.customOperation('transaction', {
  operations: [
    { model: 'user', operation: 'create', data: { name: 'John', email: 'john@example.com' } },
    { model: 'product', operation: 'update', data: { where: { id: '1' }, data: { stock: 10 } } }
  ]
});
```

#### `createMany`
Batch create with skip duplicates:
```typescript
const result = await query.customOperation('createMany', {
  model: 'product',
  data: [
    { name: 'Product 1', price: 100 },
    { name: 'Product 2', price: 200 }
  ],
  skipDuplicates: true
});
```

#### `upsert`
Prisma's native upsert operation:
```typescript
const user = await query.customOperation('upsert', {
  model: 'user',
  where: { email: 'john@example.com' },
  update: { name: 'John Updated' },
  create: { name: 'John', email: 'john@example.com' },
  include: { posts: true }
});
```

#### `aggregate`
Use Prisma's aggregation functions:
```typescript
const stats = await query.customOperation('aggregate', {
  model: 'product',
  where: { status: 'active' },
  _sum: { price: true },
  _avg: { price: true },
  _count: { id: true }
});
```

#### `groupBy`
Group by with aggregations:
```typescript
const grouped = await query.customOperation('groupBy', {
  model: 'order',
  by: ['status'],
  _count: { id: true },
  _sum: { total: true },
  having: {
    total: {
      _sum: { gt: 1000 }
    }
  }
});
```

## Creating Your Own Custom Operations

### 1. Extend an Existing Adapter

```typescript
import { DrizzleCrudAdapter } from "better-query";

class MyDrizzleAdapter extends DrizzleCrudAdapter {
  constructor(db: any, schema: any) {
    super(db, schema);
    
    // Add your custom operations
    this.customOperations.myCustomOperation = async (params: { model: string; customParam: string }) => {
      const { model, customParam } = params;
      // Your custom logic here
      const table = this.schema[model];
      return await this.db.select().from(table).where(/* your custom logic */);
    };
  }
}

// Use your extended adapter
const query = betterQuery({
  resources: [/* ... */],
  database: {
    adapter: new MyDrizzleAdapter(db, schema),
  },
});
```

### 2. Create a Completely Custom Adapter

```typescript
import { CrudAdapter, CustomOperations } from "better-query";

class MyCustomAdapter implements CrudAdapter {
  public customOperations: CustomOperations = {};

  constructor(private myOrm: any) {
    this.initializeCustomOperations();
  }

  private initializeCustomOperations() {
    this.customOperations = {
      // Your ORM-specific operations
      complexQuery: async (params: { query: string; parameters: any[] }) => {
        return await this.myOrm.execute(params.query, params.parameters);
      },
      
      bulkOperations: async (params: { operations: any[] }) => {
        return await this.myOrm.batch(params.operations);
      },
      
      // Add as many as you need...
    };
  }

  async executeCustomOperation(operationName: string, params: any, context?: any): Promise<any> {
    const operation = this.customOperations[operationName];
    if (!operation) {
      throw new Error(`Custom operation '${operationName}' not found`);
    }
    return await operation(params, context);
  }

  // Implement required CRUD methods
  async create(params) { /* ... */ }
  async findFirst(params) { /* ... */ }
  async findMany(params) { /* ... */ }
  async update(params) { /* ... */ }
  async delete(params) { /* ... */ }
  async count(params) { /* ... */ }
}
```

### 3. Add Custom Operations to Resources

You can also create resource-specific custom operations through plugins:

```typescript
import { createPlugin } from "better-query";

const myResourcePlugin = createPlugin({
  name: "my-resource-plugin",
  init: async (context) => {
    // Add custom operations specific to your use case
    if (context.adapter.customOperations) {
      context.adapter.customOperations.resourceSpecificOperation = async (params) => {
        // Custom logic for this resource
        return await context.adapter.findMany({
          model: params.model,
          // Apply resource-specific logic
        });
      };
    }
  }
});

const query = betterQuery({
  resources: [/* ... */],
  database: { /* ... */ },
  plugins: [myResourcePlugin],
});
```

## Type Safety

Custom operations maintain type safety through the adapter interface:

```typescript
// The return type is inferred from your operation
const result = await query.customOperation('batchInsert', {
  model: 'product',
  data: products, // TypeScript will validate this matches your schema
});

// TypeScript knows the shape of available operations
const operations = query.getCustomOperations();
// operations is typed as Record<string, (params: any, context?: any) => Promise<any>>

// Boolean checks are type-safe
if (query.hasCustomOperation('upsert')) {
  // TypeScript knows this operation exists
  await query.customOperation('upsert', { /* properly typed params */ });
}
```

## Best Practices

### 1. Naming Conventions
- Use descriptive names that indicate the ORM and purpose: `drizzleBatchInsert`, `prismaUpsert`
- Avoid conflicts with standard CRUD operations
- Use camelCase for consistency

### 2. Error Handling
```typescript
try {
  const result = await query.customOperation('complexOperation', params);
} catch (error) {
  if (error.message.includes('not found')) {
    console.log('Operation not supported by this adapter');
  } else {
    console.error('Operation failed:', error);
  }
}
```

### 3. Parameter Validation
```typescript
// In your custom operation
myCustomOperation: async (params: { model: string; requiredParam: string }) => {
  if (!params.model || !params.requiredParam) {
    throw new Error('Missing required parameters: model, requiredParam');
  }
  // ... your logic
}
```

### 4. Documentation
Always document your custom operations:

```typescript
this.customOperations = {
  /**
   * Performs a batch insert optimized for large datasets
   * @param params.model - The target model name
   * @param params.data - Array of records to insert
   * @param params.batchSize - Optional batch size (default: 1000)
   * @returns Promise<Array<InsertedRecord>>
   */
  batchInsert: async (params: { model: string; data: Record<string, any>[]; batchSize?: number }) => {
    // Implementation...
  }
};
```

## Migration Guide

If you're upgrading from a previous version:

### Before (Limited to basic CRUD)
```typescript
// You were limited to basic operations
const products = await crud.api.product.list();
// No way to use ORM-specific features
```

### After (With Custom Operations)
```typescript
// You can now use ORM-specific features
const products = await query.customOperation('complexJoin', {
  baseModel: 'product',
  joins: [/* complex joins */],
  aggregations: [/* custom aggregations */]
});

// Or use built-in optimized operations
const bulkInserted = await query.customOperation('batchInsert', {
  model: 'product',
  data: largeProductArray
});
```

## Examples

### Complete Drizzle Example

```typescript
import { betterQuery, DrizzleCrudAdapter, createResource } from "better-query";
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { z } from 'zod';

// Setup
const sqlite = new Database('ecommerce.db');
const db = drizzle(sqlite);
const adapter = new DrizzleCrudAdapter(db, schema);

const query = betterQuery({
  resources: [
    createResource({
      name: 'product',
      schema: z.object({
        id: z.string(),
        name: z.string(),
        price: z.number(),
        categoryId: z.string(),
      })
    })
  ],
  database: { adapter },
});

// Use built-in custom operations
const products = await query.customOperation('batchInsert', {
  model: 'product',
  data: [
    { name: 'Laptop', price: 1000, categoryId: '1' },
    { name: 'Mouse', price: 25, categoryId: '2' },
    { name: 'Keyboard', price: 75, categoryId: '2' }
  ]
});

// Use aggregation
const stats = await query.customOperation('aggregate', {
  model: 'product',
  aggregations: [
    { field: 'price', operation: 'avg' },
    { field: 'price', operation: 'sum' },
    { field: 'id', operation: 'count' }
  ],
  groupBy: ['categoryId']
});

// Raw query when you need maximum control
const expensiveProducts = await query.customOperation('rawQuery', {
  sql: 'SELECT * FROM products WHERE price > ? ORDER BY price DESC LIMIT 10',
  values: [500]
});
```

### Complete Prisma Example

```typescript
import { betterQuery, PrismaCrudAdapter } from "better-query";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const adapter = new PrismaCrudAdapter(prisma);

const query = betterQuery({
  resources: [/* your resources */],
  database: { adapter },
});

// Transaction example
const orderWithItems = await query.customOperation('transaction', {
  operations: [
    {
      model: 'order',
      operation: 'create',
      data: { userId: '1', total: 150 }
    },
    {
      model: 'orderItem',
      operation: 'create', 
      data: { orderId: 'order-id', productId: '1', quantity: 2 }
    }
  ]
});

// Upsert with relations
const user = await query.customOperation('upsert', {
  model: 'user',
  where: { email: 'user@example.com' },
  update: { lastLogin: new Date() },
  create: {
    email: 'user@example.com',
    name: 'New User',
    profile: {
      create: { bio: 'New user bio' }
    }
  },
  include: {
    profile: true,
    orders: { take: 5 }
  }
});
```

This feature allows you to leverage the full power of your chosen ORM while maintaining the convenience and consistency of the Better Query system.