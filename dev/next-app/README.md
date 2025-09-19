# BetterCRUD Demo - Next.js Integration Guide

This document provides a comprehensive guide for integrating BetterCRUD with a Next.js application using the better-auth CRUD plugin.

## Overview

The BetterCRUD integration in this Next.js app demonstrates how to:
- Configure better-auth with the CRUD plugin
- Create and manage resources (products, categories)
- Implement a complete CRUD interface with React components
- Handle authentication and permissions

## Quick Start

### 1. Installation

```bash
npm install better-auth better-sqlite3
# or
pnpm add better-auth better-sqlite3
```

### 2. Authentication Configuration

Create your auth configuration with the CRUD plugin:

```typescript
// lib/crud-auth.ts
import { betterAuth } from "better-auth";
import {
  categorySchema,
  createResource,
  crud,
  productSchema,
} from "better-auth/plugins";

export const auth = betterAuth({
  database: {
    provider: "sqlite",
    url: "data.db",
  },
  secret: process.env.BETTER_AUTH_SECRET ?? "secret",
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    crud({
      resources: [
        createResource({
          name: "product",
          schema: productSchema,
          permissions: {
            create: async (user) => !!user, // Require authentication
            read: async () => true,         // Public read access
            update: async (user) => !!user, // Require authentication
            delete: async (user) => !!user, // Require authentication
            list: async () => true,         // Public list access
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

export type Auth = typeof auth;
```

### 3. API Routes Setup

Create the catch-all API route for better-auth:

```typescript
// app/api/[...auth]/route.ts
import { auth } from "@/lib/crud-auth";
import { NextRequest } from "next/server";

const handler = auth.handler;

export const POST = async (req: NextRequest) => {
  return handler(req);
};

export const PATCH = async (req: NextRequest) => {
  return handler(req);
};

export const DELETE = async (req: NextRequest) => {
  return handler(req);
};

export { handler as GET };
```

### 4. Client Configuration

Set up the React client for type-safe API calls:

```typescript
// lib/client.ts
import { createReactAuthClient } from "better-auth/react";
import type { auth } from "./crud-auth";

export const authClient = createReactAuthClient<typeof auth>({
  baseURL: "http://localhost:3000/api/auth",
});

export const client = authClient;
```

## Available Endpoints

The CRUD plugin automatically generates the following endpoints for each resource:

### Product Endpoints

- `POST /api/auth/product` - Create a new product
- `GET /api/auth/product/:id` - Get a product by ID
- `PATCH /api/auth/product/:id` - Update a product
- `DELETE /api/auth/product/:id` - Delete a product
- `GET /api/auth/products` - List all products (with pagination)

### Category Endpoints

- `POST /api/auth/category` - Create a new category
- `GET /api/auth/category/:id` - Get a category by ID
- `PATCH /api/auth/category/:id` - Update a category
- `DELETE /api/auth/category/:id` - Delete a category
- `GET /api/auth/categories` - List all categories

## Product Schema

The product schema includes the following fields:

```typescript
{
  id?: string;              // Auto-generated
  name: string;             // Required
  description?: string;     // Optional
  price: number;            // Required, minimum 0
  categoryId?: string;      // Optional
  tags?: string[];          // Optional, defaults to []
  status: "active" | "inactive" | "draft"; // Defaults to "draft"
  sku?: string;             // Optional
  stock?: number;           // Optional, defaults to 0
  createdAt?: Date;         // Auto-generated
  updatedAt?: Date;         // Auto-generated
}
```

## React Component Usage

### Basic CRUD Operations

```typescript
// components/CrudDemo.tsx
"use client";

import { useState, useEffect } from "react";

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  status: "active" | "inactive" | "draft";
  // ... other fields
}

export function CrudDemo() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch products
  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/products");
      if (response.ok) {
        const data = await response.json();
        setProducts(data.items || data || []);
      } else {
        setError(\`Failed to fetch: \${response.statusText}\`);
      }
    } catch (error) {
      setError(\`Error: \${error instanceof Error ? error.message : "Unknown"}\`);
    } finally {
      setLoading(false);
    }
  };

  // Create product
  const createProduct = async (productData: Partial<Product>) => {
    try {
      const response = await fetch("/api/auth/product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });
      
      if (response.ok) {
        const newProduct = await response.json();
        setProducts([...products, newProduct]);
        return newProduct;
      } else {
        throw new Error(\`Failed to create: \${response.statusText}\`);
      }
    } catch (error) {
      setError(\`Create error: \${error instanceof Error ? error.message : "Unknown"}\`);
    }
  };

  // Update product
  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      const response = await fetch(\`/api/auth/product/\${id}\`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      
      if (response.ok) {
        const updatedProduct = await response.json();
        setProducts(products.map(p => p.id === id ? updatedProduct : p));
        return updatedProduct;
      } else {
        throw new Error(\`Failed to update: \${response.statusText}\`);
      }
    } catch (error) {
      setError(\`Update error: \${error instanceof Error ? error.message : "Unknown"}\`);
    }
  };

  // Delete product
  const deleteProduct = async (id: string) => {
    try {
      const response = await fetch(\`/api/auth/product/\${id}\`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        setProducts(products.filter(p => p.id !== id));
      } else {
        throw new Error(\`Failed to delete: \${response.statusText}\`);
      }
    } catch (error) {
      setError(\`Delete error: \${error instanceof Error ? error.message : "Unknown"}\`);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Component JSX...
}
```

## Error Handling

The component includes comprehensive error handling:

- Network errors are caught and displayed
- HTTP error responses are handled gracefully
- User-friendly error messages are shown
- Loading states prevent multiple concurrent requests

## Permissions

Permissions are configurable per operation:

```typescript
permissions: {
  create: async (user) => !!user,     // Must be logged in
  read: async () => true,             // Public access
  update: async (user) => !!user,     // Must be logged in
  delete: async (user) => !!user,     // Must be logged in
  list: async () => true,             // Public access
}
```

## Advanced Features

### Custom Validation

```typescript
createResource({
  name: "product",
  schema: productSchema.refine(
    (data) => data.price > 0,
    { message: "Price must be positive" }
  ),
});
```

### Custom Table Names

```typescript
createResource({
  name: "product",
  schema: productSchema,
  tableName: "custom_products", // Use custom table name
});
```

### Selective Endpoints

```typescript
createResource({
  name: "product",
  schema: productSchema,
  endpoints: {
    create: true,
    read: true,
    update: false,  // Disable update
    delete: false,  // Disable delete
    list: true,
  },
});
```

## Troubleshooting

### Common Issues

1. **Module not found errors**: Ensure better-auth is properly built
2. **Type errors**: Make sure the client is properly typed with the auth instance
3. **Permission errors**: Check that permissions are correctly configured
4. **Database errors**: Verify database connection and migration settings

### Environment Variables

```bash
# .env.local
BETTER_AUTH_SECRET=your-secret-key-here
DATABASE_URL=sqlite:./data.db
```

## Best Practices

1. **Use TypeScript**: Get full type safety for your CRUD operations
2. **Handle Errors**: Always include proper error handling in your components
3. **Validate Data**: Use Zod schemas for robust data validation
4. **Secure Permissions**: Implement proper authentication and authorization
5. **Test Thoroughly**: Test all CRUD operations and edge cases

## Next Steps

- Add pagination to list endpoints
- Implement search and filtering
- Add file upload capabilities
- Create custom validation rules
- Implement audit logging

---

## Development

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.
