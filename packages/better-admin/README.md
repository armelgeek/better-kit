# Better Admin

> Full-stack admin kit built on Better Query - auto-generated admin UI with CRUD operations

[![npm version](https://img.shields.io/npm/v/better-admin.svg)](https://www.npmjs.com/package/better-admin)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Better Admin is a comprehensive admin panel solution that combines the power of Better Query's backend with an auto-generated admin UI. It provides a complete CRUD interface for your resources with minimal configuration.

## Features

- 🚀 **Auto-Generated Admin UI**: Define your resources once, get a full admin interface
- 🔐 **Better Auth Integration**: Seamless integration with Better Auth for authentication and permissions
- ✅ **Type-Safe**: Full TypeScript support with automatic type inference from Better Query
- 🎨 **Headless UI**: Framework-agnostic components that work with any UI library
- 🔧 **Fully Customizable**: Override any component or behavior for specific resources
- 📊 **Rich Features**: Pagination, sorting, filtering, search, bulk operations out of the box
- 🎯 **Permission-Aware**: Respects Better Query permissions for all operations
- 🌐 **Framework Agnostic**: Works with Next.js, Remix, React, and more

## Inspiration

Better Admin combines the best of both worlds:

- **shadcn-admin-kit** (Marmelab) - UI structure and admin patterns
- **Better Query** (armelgeek) - Type-safe CRUD generation and backend

Unlike shadcn-admin-kit which uses ra-core, Better Admin is built on Better Query for a lighter, more flexible solution with full type safety.

## Installation

```bash
npm install better-admin better-query
# or
pnpm add better-admin better-query
# or
yarn add better-admin better-query
```

## Quick Start

### 1. Define Your Backend with Better Query

```typescript
// lib/query.ts
import { betterQuery, createResource } from "better-query";
import { z } from "zod";

const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().min(0),
  status: z.enum(["draft", "active", "inactive"]).default("draft"),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

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
      permissions: {
        create: () => true,
        read: () => true,
        update: () => true,
        delete: () => true,
        list: () => true,
      },
    }),
  ],
});
```

### 2. Create Your Admin Configuration

```typescript
// lib/admin.ts
import { betterAdmin, createAdminResource } from "better-admin";
import { query } from "./query";

export const admin = betterAdmin({
  query,
  resources: [
    createAdminResource({
      name: "product",
      label: "Product",
      labelPlural: "Products",
      icon: "📦",
      description: "Manage products",
      list: {
        fields: ["name", "price", "status"],
        defaultSort: "name",
        searchFields: ["name", "description"],
      },
      show: {
        fields: ["name", "description", "price", "status", "createdAt"],
      },
      create: {
        fields: ["name", "description", "price", "status"],
      },
      edit: {
        fields: ["name", "description", "price", "status"],
      },
      fieldMetadata: {
        name: {
          label: "Product Name",
          inputType: "text",
        },
        description: {
          label: "Description",
          inputType: "textarea",
        },
        price: {
          label: "Price",
          inputType: "number",
        },
        status: {
          label: "Status",
          inputType: "select",
          options: [
            { label: "Draft", value: "draft" },
            { label: "Active", value: "active" },
            { label: "Inactive", value: "inactive" },
          ],
        },
      },
    }),
  ],
  config: {
    title: "My Admin Panel",
    basePath: "/admin",
    theme: {
      defaultMode: "light",
      enableModeToggle: true,
    },
  },
});
```

### 3. Create Your Admin Client (Frontend)

```typescript
// lib/admin-client.ts
"use client";
import { createQueryClient } from "better-query/client";
import { createAdminClient } from "better-admin/client";

const queryClient = createQueryClient({
  baseURL: "http://localhost:3000/api/query",
});

export const adminClient = createAdminClient(queryClient);
```

### 4. Use Admin Hooks in Your Components

```typescript
// app/admin/products/page.tsx
"use client";
import { useAdminList } from "better-admin/react";
import { adminClient } from "@/lib/admin-client";

export default function ProductsPage() {
  const {
    data,
    loading,
    error,
    page,
    totalPages,
    setPage,
    setSearch,
  } = useAdminList(adminClient, "product");

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>Products</h1>
      
      {/* Search */}
      <input
        type="text"
        placeholder="Search products..."
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* List */}
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Price</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((product) => (
            <tr key={product.id}>
              <td>{product.name}</td>
              <td>${product.price}</td>
              <td>{product.status}</td>
              <td>
                <a href={`/admin/products/${product.id}`}>View</a>
                <a href={`/admin/products/${product.id}/edit`}>Edit</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div>
        Page {page} of {totalPages}
        <button onClick={() => setPage(page - 1)} disabled={page === 1}>
          Previous
        </button>
        <button onClick={() => setPage(page + 1)} disabled={page === totalPages}>
          Next
        </button>
      </div>
    </div>
  );
}
```

## Architecture

Better Admin follows a clean architecture with clear separation of concerns:

```
┌─────────────────────────────────────────┐
│           Better Admin UI                │
│  (React Components, Hooks, State)       │
├─────────────────────────────────────────┤
│        Better Admin Client               │
│  (Admin-specific API client methods)    │
├─────────────────────────────────────────┤
│         Better Query Client              │
│    (Type-safe API client, fetch)        │
└─────────────────────────────────────────┘
                    ↕ HTTP
┌─────────────────────────────────────────┐
│      Better Query Backend                │
│  (CRUD endpoints, permissions, DB)      │
└─────────────────────────────────────────┘
```

## API Reference

### Core API

#### `betterAdmin(options)`

Creates an admin configuration from a Better Query instance.

```typescript
const admin = betterAdmin({
  query: betterQueryInstance,
  resources: [/* admin resources */],
  config: {/* admin config */},
});
```

#### `createAdminResource(config)`

Creates an admin resource configuration.

```typescript
const resource = createAdminResource({
  name: "product",
  label: "Product",
  list: { fields: ["name", "price"] },
  // ... other config
});
```

### Client API

#### `createAdminClient(queryClient)`

Creates an admin client from a Better Query client.

```typescript
const adminClient = createAdminClient(queryClient);
```

### React Hooks

#### `useAdminList(client, resource, params?)`

Hook for list operations with pagination, sorting, and filtering.

```typescript
const {
  data,        // Array of items
  total,       // Total count
  page,        // Current page
  totalPages,  // Total pages
  loading,     // Loading state
  error,       // Error state
  setPage,     // Change page
  setSort,     // Change sort
  setSearch,   // Set search query
  refetch,     // Refetch data
} = useAdminList(adminClient, "product");
```

#### `useAdminGet(client, resource, id?)`

Hook for fetching a single resource.

```typescript
const {
  data,     // Resource data
  loading,  // Loading state
  error,    // Error state
  refetch,  // Refetch data
} = useAdminGet(adminClient, "product", "product-id");
```

#### `useAdminCreate(client, resource)`

Hook for creating resources.

```typescript
const {
  create,   // Create function
  loading,  // Loading state
  error,    // Error state
} = useAdminCreate(adminClient, "product");

// Usage
const newProduct = await create({ name: "New Product", price: 99.99 });
```

#### `useAdminUpdate(client, resource)`

Hook for updating resources.

```typescript
const {
  update,   // Update function
  loading,  // Loading state
  error,    // Error state
} = useAdminUpdate(adminClient, "product");

// Usage
const updated = await update("product-id", { price: 149.99 });
```

#### `useAdminDelete(client, resource)`

Hook for deleting resources.

```typescript
const {
  delete: deleteItem,  // Delete function
  bulkDelete,          // Bulk delete function
  loading,             // Loading state
  error,               // Error state
} = useAdminDelete(adminClient, "product");

// Usage
await deleteItem("product-id");
await bulkDelete(["id1", "id2", "id3"]);
```

## Advanced Usage

### Custom Components

Override default components for specific resources:

```typescript
createAdminResource({
  name: "product",
  list: {
    component: CustomProductList,
  },
  create: {
    component: CustomProductForm,
  },
});
```

### Custom Field Rendering

Add custom formatters for fields:

```typescript
createAdminResource({
  name: "product",
  fieldMetadata: {
    price: {
      label: "Price",
      formatter: (value) => `$${value.toFixed(2)}`,
    },
    status: {
      label: "Status",
      formatter: (value) => {
        const badges = {
          draft: "🟡 Draft",
          active: "🟢 Active",
          inactive: "🔴 Inactive",
        };
        return badges[value] || value;
      },
    },
  },
});
```

### Permission Integration

Better Admin respects Better Query permissions:

```typescript
// Backend (Better Query)
createResource({
  name: "product",
  permissions: {
    create: async (context) => context.user?.role === "admin",
    delete: async (context) => context.user?.role === "admin",
    update: async (context) => !!context.user,
    read: async () => true,
    list: async () => true,
  },
});

// Frontend - automatically respects permissions
const admin = betterAdmin({
  query,
  resources: [createAdminResource({ name: "product" })],
});

// Check if user can perform an operation
const canDelete = await admin.canPerform("product", "delete", {
  user: currentUser,
});
```

## Design Philosophy

### Headless UI

Better Admin provides **headless components** - they handle logic and state but don't impose styling. This means:

- ✅ Use with any UI library (Tailwind, Material-UI, Ant Design, etc.)
- ✅ Complete control over appearance
- ✅ No CSS conflicts or unwanted styles
- ✅ Accessible by default

### Type Safety

Full TypeScript support with automatic type inference:

```typescript
// Types are automatically inferred from Better Query schemas
const { data } = useAdminList(adminClient, "product");
// `data` has the correct type based on productSchema
```

### Framework Agnostic

Works with:
- Next.js (App Router & Pages Router)
- Remix
- React SPA
- Any framework that supports React

## Comparison with Alternatives

| Feature | Better Admin | shadcn-admin-kit | React Admin |
|---------|--------------|------------------|-------------|
| Type Safety | ✅ Full | ⚠️ Partial | ⚠️ Partial |
| Backend | Better Query | ra-core | REST/GraphQL |
| UI Library | Headless | shadcn/ui | Material-UI |
| Bundle Size | Small | Medium | Large |
| Learning Curve | Low | Medium | High |
| Customization | Complete | High | Medium |

## Examples

See the `/dev` directory for complete examples:

- Next.js Admin (coming soon)
- Remix Admin (coming soon)
- React SPA Admin (coming soon)

## Roadmap

- [ ] CLI for scaffolding admin panels (`npx create-better-admin`)
- [ ] Pre-built UI component library (optional)
- [ ] Advanced filtering UI
- [ ] File upload components
- [ ] Rich text editor integration
- [ ] Charts and analytics components
- [ ] Export/Import functionality
- [ ] Audit log UI
- [ ] Multi-language support

## Contributing

Contributions are welcome! Please read our [Contributing Guide](../../CONTRIBUTING.md) for details.

## License

MIT © Better Kit Contributors

## Related Projects

- [Better Query](../better-query) - Type-safe CRUD generator
- [Better Auth](https://github.com/better-auth/better-auth) - Authentication solution
- [shadcn-admin-kit](https://github.com/marmelab/shadcn-admin-kit) - Inspiration for UI patterns

## Support

- 📖 [Documentation](https://armelgeek.github.io/better-kit/docs/admin/)
- 💬 [Discussions](https://github.com/armelgeek/better-kit/discussions)
- 🐛 [Issues](https://github.com/armelgeek/better-kit/issues)
