# Better Admin Example with Next.js

This example demonstrates how to use Better Admin to create a complete admin panel with minimal code.

## Features

- 🚀 Auto-generated admin UI from Better Query resources
- 🔐 Authentication with Better Auth
- ✅ Full CRUD operations for multiple resources
- 📊 List view with pagination, sorting, and search
- 🎨 Modern UI with Tailwind CSS
- 🔒 Permission-based access control

## Resources

This example includes the following resources:

- **Products**: Manage products with name, description, price, and status
- **Users**: View and manage user accounts
- **Dashboard**: Overview statistics and charts

## Getting Started

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file:

```bash
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=http://localhost:3001
```

### 3. Run the Development Server

```bash
pnpm dev
```

Open [http://localhost:3001](http://localhost:3001) to see the admin panel.

### 4. Default Login

Use these credentials to log in:
- Email: `admin@example.com`
- Password: `admin123`

## Project Structure

```
├── lib/
│   ├── query.ts          # Better Query configuration
│   ├── admin.ts          # Better Admin configuration
│   ├── auth.ts           # Better Auth configuration
│   ├── admin-client.ts   # Admin client for frontend
│   └── auth-client.ts    # Auth client for frontend
├── app/
│   ├── api/
│   │   ├── query/        # Query API routes
│   │   └── auth/         # Auth API routes
│   ├── admin/
│   │   ├── dashboard/    # Dashboard page
│   │   ├── products/     # Products management
│   │   └── users/        # Users management
│   └── layout.tsx        # Root layout
└── components/
    ├── AdminLayout.tsx   # Admin panel layout
    ├── AdminNav.tsx      # Navigation component
    └── ...               # Other components
```

## Key Files

### Backend Configuration

**lib/query.ts** - Defines resources with Better Query:

```typescript
import { betterQuery, createResource } from "better-query";
import { z } from "zod";

const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().min(0),
  status: z.enum(["draft", "active", "inactive"]).default("draft"),
});

export const query = betterQuery({
  basePath: "/api/query",
  database: {
    provider: "sqlite",
    url: "admin.db",
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

**lib/admin.ts** - Configure admin panel:

```typescript
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
      list: {
        fields: ["name", "price", "status"],
        searchFields: ["name", "description"],
      },
      fieldMetadata: {
        price: {
          label: "Price",
          formatter: (value) => `$${value.toFixed(2)}`,
        },
      },
    }),
  ],
  config: {
    title: "Admin Panel",
    basePath: "/admin",
  },
});
```

### Frontend Usage

**app/admin/products/page.tsx** - Products list page:

```typescript
"use client";
import { useAdminList } from "better-admin/react";
import { adminClient } from "@/lib/admin-client";

export default function ProductsPage() {
  const { data, loading, page, totalPages, setPage } =
    useAdminList(adminClient, "product");

  // ... render your UI
}
```

## Customization

### Custom Components

Override default components per resource:

```typescript
createAdminResource({
  name: "product",
  list: {
    component: CustomProductList,
  },
});
```

### Custom Field Rendering

Add custom formatters:

```typescript
fieldMetadata: {
  status: {
    formatter: (value) => {
      const badges = {
        draft: "🟡 Draft",
        active: "🟢 Active",
        inactive: "🔴 Inactive",
      };
      return badges[value];
    },
  },
}
```

## Learn More

- [Better Admin Documentation](../../packages/better-admin/README.md)
- [Better Query Documentation](../../packages/better-query/README.md)
- [Better Auth Documentation](https://www.better-auth.com/)

## License

MIT
