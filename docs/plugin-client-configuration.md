# Plugin Client Configuration

This guide explains how to configure and use plugin clients with better-auth, following the same patterns as the main client configuration.

## Overview

The plugin client configuration feature allows plugins to provide client-side functionality that integrates seamlessly with the better-auth ecosystem. This follows the same patterns established by the main `createAuthClient` function.

## Architecture

### 1. Plugin Client Interface

Plugins can now extend the base `Plugin` interface to include client configuration:

```typescript
interface PluginWithClient extends Plugin {
  client?: PluginClientConfig;
}
```

### 2. Client Configuration Options

The main auth client now supports plugin-specific configurations:

```typescript
interface ClientOptions extends BetterFetchOption {
  pluginConfigs?: {
    crud?: {
      baseURL?: string;
      resources?: any[];
    };
    [key: string]: any;
  };
}
```

## CRUD Plugin Client

The CRUD plugin demonstrates the plugin client pattern with a fully-featured, type-safe client.

### Standalone Usage

Create a standalone CRUD client that works independently:

```typescript
import { createCrudClient } from "better-auth/plugins";

const crudClient = createCrudClient({
  baseURL: "http://localhost:3000/api/auth",
  resources: [
    { name: "product", schema: productSchema },
    { name: "category", schema: categorySchema },
  ],
});

// Type-safe operations
await crudClient.product.create({
  name: "New Product",
  price: 29.99,
  description: "A great product",
});

await crudClient.product.list({
  page: 1,
  limit: 10,
  sortBy: "createdAt",
  sortOrder: "desc",
});

await crudClient.product.update("product-id", {
  price: 24.99,
});

await crudClient.product.delete("product-id");
```

### Integrated with Auth Client

Configure the CRUD client to work with the main auth client:

```typescript
import { createReactAuthClient } from "better-auth/react";

const authClient = createReactAuthClient({
  baseURL: "http://localhost:3000/api/auth",
  pluginConfigs: {
    crud: {
      baseURL: "http://localhost:3000/api/auth",
      resources: [
        { name: "product", schema: productSchema },
        { name: "category", schema: categorySchema },
      ],
    },
  },
});

// Future: Integrated usage (when fully implemented)
// await authClient.crud.product.create(data);
```

## Type Safety

The plugin client configuration provides full TypeScript support:

### 1. Schema-based Typing

Resource operations are typed based on Zod schemas:

```typescript
// Input type inferred from productSchema
const product = await crudClient.product.create({
  name: "Product", // string (required)
  price: 29.99,    // number (required)
  description: "Optional description", // string (optional)
  // TypeScript will catch missing required fields
});

// Output type also inferred
console.log(product.data?.id); // string
console.log(product.data?.createdAt); // Date
```

### 2. Error Handling

Typed error codes similar to better-auth:

```typescript
const result = await crudClient.product.create(data);

if (result.error) {
  switch (result.error.code) {
    case crudClient.$ERROR_CODES.VALIDATION_FAILED:
      console.log("Invalid input data");
      break;
    case crudClient.$ERROR_CODES.UNAUTHORIZED:
      console.log("Please log in");
      break;
    case crudClient.$ERROR_CODES.FORBIDDEN:
      console.log("Permission denied");
      break;
  }
}
```

## React Integration

Use the plugin client with React hooks:

```typescript
import { useState, useEffect } from "react";

function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const result = await crudClient.product.list();
        if (result.error) {
          setError(result.error.message);
        } else {
          setProducts(result.data?.items || []);
        }
      } catch (err) {
        setError("Failed to fetch products");
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  return { products, loading, error };
}

// Usage in components
function ProductList() {
  const { products, loading, error } = useProducts();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {products.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
}
```

## Advanced Features

### 1. Pagination

```typescript
const result = await crudClient.product.list({
  page: 1,
  limit: 10,
  sortBy: "createdAt",
  sortOrder: "desc",
});

console.log(result.data?.pagination);
// {
//   page: 1,
//   limit: 10,
//   total: 150,
//   totalPages: 15,
//   hasNext: true,
//   hasPrev: false
// }
```

### 2. Filtering and Search

```typescript
const result = await crudClient.product.list({
  search: "electronics",
  where: {
    status: "active",
    categoryId: "electronics-123",
  },
  filters: {
    priceRange: { min: 10, max: 100 },
  },
});
```

### 3. Custom Headers

```typescript
await crudClient.product.create(data, {
  headers: {
    "Authorization": "Bearer your-token",
    "X-Custom-Header": "value",
  },
});
```

## Server Configuration

Configure the CRUD plugin on the server to match client expectations:

```typescript
import { betterAuth } from "better-auth";
import { crud, createResource, productSchema, categorySchema } from "better-auth/plugins";

export const auth = betterAuth({
  // ... other config
  plugins: [
    crud({
      resources: [
        createResource({
          name: "product",
          schema: productSchema,
          permissions: {
            create: async () => true,
            read: async () => true,
            update: async () => true,
            delete: async () => true,
            list: async () => true,
          },
        }),
        createResource({
          name: "category",
          schema: categorySchema,
        }),
      ],
    }),
  ],
});
```

## Best Practices

### 1. Environment Configuration

Use environment variables for base URLs:

```typescript
const crudClient = createCrudClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/auth",
});
```

### 2. Error Boundaries

Wrap plugin client usage in error boundaries:

```typescript
async function handleCreateProduct(data: any) {
  try {
    const result = await crudClient.product.create(data);
    if (result.error) {
      throw new Error(result.error.message);
    }
    return result.data;
  } catch (error) {
    console.error("Product creation failed:", error);
    throw error;
  }
}
```

### 3. Type Guards

Use type guards for runtime safety:

```typescript
function isValidProduct(data: any): data is ProductInput {
  return typeof data === 'object' && 
         typeof data.name === 'string' && 
         typeof data.price === 'number';
}

if (isValidProduct(formData)) {
  await crudClient.product.create(formData);
}
```

## Future Enhancements

The plugin client configuration framework is designed to support future enhancements:

1. **Deep Integration**: Full integration with the main auth client
2. **Middleware Support**: Plugin-specific middleware for requests
3. **Cache Integration**: Built-in caching for plugin operations
4. **Real-time Updates**: WebSocket support for live data updates
5. **Optimistic Updates**: Client-side optimistic updates with rollback

## Migration Guide

### From Custom Clients

If you have existing custom CRUD clients, migration is straightforward:

```typescript
// Before: Custom client
const customClient = {
  async createProduct(data) {
    return fetch('/api/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
};

// After: Plugin client
const crudClient = createCrudClient({
  baseURL: "http://localhost:3000/api",
});

await crudClient.product.create(data);
```

### Benefits of Migration

1. **Type Safety**: Full TypeScript support
2. **Error Handling**: Consistent error patterns
3. **Better DX**: Auto-completion and documentation
4. **Integration**: Works with better-auth ecosystem
5. **Maintenance**: Centralized updates and improvements

## Conclusion

The plugin client configuration feature brings the power and consistency of better-auth's client patterns to all plugins. It provides type safety, excellent developer experience, and seamless integration while maintaining flexibility for different use cases.