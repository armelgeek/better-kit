# React Client for Better Query

The React client provides true client-side API calls, unlike the standard `createQueryClient` which uses server actions.

## Key Differences

| Feature | Standard Client | React Client |
|---------|----------------|--------------|
| Execution | Server-side (server actions) | Client-side (fetch) |
| Network Calls | Hidden | Visible in browser DevTools |
| State Management | No built-in support | React hooks included |
| Bundle Size | Smaller | Larger (includes React deps) |
| Use Case | SSR/SSG | CSR/SPA interactions |

## Basic Usage

### 1. Create the React Client

```typescript
import { createReactQueryClient } from "better-query/react";
import type { query } from "./your-query-config";

export const reactClient = createReactQueryClient<typeof query>({
  baseURL: "http://localhost:3000/api/query",
  headers: {
    "Content-Type": "application/json",
  },
});
```

### 2. Use in React Components

```typescript
"use client";

import { useState } from "react";
import { reactClient } from "./client";

export function ProductForm() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (data) => {
    setLoading(true);
    try {
      // This makes a real client-side fetch call
      const response = await reactClient.product.create(data);
      setResult(response);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Your form fields */}
      <button disabled={loading}>
        {loading ? "Creating..." : "Create Product"}
      </button>
    </form>
  );
}
```

## React Hooks

The React client includes built-in hooks for better state management:

### useResource Hook

```typescript
import { useResource } from "better-query/react";
import { reactClient } from "./client";

export function ProductList() {
  const productHooks = useResource(reactClient, "product");
  
  // Auto-fetch products on mount
  const { data: products, loading, error, refetch } = productHooks.useList({
    page: 1,
    limit: 10,
  });

  // Create hook with loading state
  const { create, loading: createLoading } = productHooks.useCreate();

  const handleCreate = async (productData) => {
    const result = await create(productData);
    if (result.data) {
      refetch(); // Refresh the list
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {products?.items?.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
}
```

### useQuery Hook

For more flexibility, use the general `useQuery` hook:

```typescript
import { useQuery } from "better-query/react";
import { reactClient } from "./client";

export function CustomComponent() {
  const hooks = useQuery(reactClient);
  
  const { create } = hooks.useCreate("product");
  const { data, read } = hooks.useRead("product", "product-id");
  const { update } = hooks.useUpdate("product");
  const { delete: deleteProduct } = hooks.useDelete("product");
  const { data: products, list } = hooks.useList("product");

  // Use the hooks as needed
}
```

## API Methods

All standard CRUD methods are available:

```typescript
// Create
const result = await reactClient.product.create({
  name: "New Product",
  price: 29.99,
});

// Read
const product = await reactClient.product.read("product-id");

// Update  
const updated = await reactClient.product.update("product-id", {
  price: 24.99,
});

// Delete
const deleted = await reactClient.product.delete("product-id");

// List with filters
const products = await reactClient.product.list({
  page: 1,
  limit: 10,
  search: "query",
  sortBy: "name",
  sortOrder: "asc",
});
```

## Custom Headers

Pass authentication tokens or other headers:

```typescript
// Global headers (set on client creation)
const client = createReactQueryClient({
  baseURL: "http://localhost:3000/api/query",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": "your-api-key",
  },
});

// Per-request headers
const result = await client.product.create(
  { name: "Product" },
  { 
    headers: { 
      "Authorization": `Bearer ${token}` 
    } 
  }
);
```

## Error Handling

The React client provides consistent error handling:

```typescript
const result = await reactClient.product.create(data);

if (result.error) {
  console.error("Error:", result.error.message);
  console.error("Code:", result.error.code);
} else {
  console.log("Success:", result.data);
}
```

## When to Use

**Use React Client when:**
- Building interactive SPAs
- Need real client-side API calls
- Want to see network requests in DevTools  
- Building React components with state management
- Need authentication headers per request

**Use Standard Client when:**
- Building SSR/SSG applications
- Want server-side rendering benefits
- Don't need client-side interactivity
- Optimizing for performance and SEO

## TypeScript Support

The React client provides full TypeScript support with inferred types from your query configuration:

```typescript
import type { query } from "./query-config";

const client = createReactQueryClient<typeof query>();

// All methods are fully typed based on your schemas
const product = await client.product.create({
  name: "Product", // ✅ Required field
  price: 29.99,    // ✅ Correct type
  invalid: "field" // ❌ TypeScript error
});
```