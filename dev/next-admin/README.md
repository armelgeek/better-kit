# Better Admin Example with Next.js

This example demonstrates how to use Better Admin to create a complete admin panel with minimal code.

## Features

- 🚀 Auto-generated admin UI from Better Query resources
- 🔐 Authentication with Better Auth
- ✅ Full CRUD operations for multiple resources
- 📝 Complete form examples (create, edit, view)
- 📊 List view with pagination, sorting, and search
- 🎨 Modern UI with Tailwind CSS
- 🔒 Permission-based access control

## Form Examples

This demo includes comprehensive form examples for product management:

### Create Form (`/admin/products/new`)
- Uses `useAdminCreate` hook
- Form validation with required fields
- Error handling and loading states
- Auto-populated default values (status: draft, stock: 0)
- Navigates back to product list on success

### Edit Form (`/admin/products/[id]/edit`)
- Uses `useAdminGet` to fetch existing product data
- Uses `useAdminUpdate` to save changes
- Auto-populates form with current values
- Handles loading states while fetching data
- Error handling for non-existent products

### View Page (`/admin/products/[id]`)
- Uses `useAdminGet` to display product details
- Organized sections (Basic Info, Pricing & Inventory, Status, Timestamps)
- Formatted display values (price, dates, status badges)
- Quick navigation to edit form

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
│   │   │   ├── page.tsx          # List products
│   │   │   ├── new/
│   │   │   │   └── page.tsx      # Create product form
│   │   │   └── [id]/
│   │   │       ├── page.tsx      # View product details
│   │   │       └── edit/
│   │   │           └── page.tsx  # Edit product form
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

**app/admin/products/new/page.tsx** - Create product form:

```typescript
"use client";
import { useAdminCreate } from "better-admin/react";
import { adminClient } from "@/lib/admin-client";

export default function NewProductPage() {
  const { create, loading, error } = useAdminCreate(adminClient, "product");
  
  const handleSubmit = async (formData) => {
    const result = await create(formData);
    if (result) {
      // Navigate to products list or show success message
    }
  };

  // ... render your form
}
```

**app/admin/products/[id]/edit/page.tsx** - Edit product form:

```typescript
"use client";
import { useAdminGet, useAdminUpdate } from "better-admin/react";
import { adminClient } from "@/lib/admin-client";

export default function EditProductPage({ params }) {
  const { data: product, loading } = useAdminGet(adminClient, "product", params.id);
  const { update, loading: updating } = useAdminUpdate(adminClient, "product");
  
  const handleSubmit = async (formData) => {
    const result = await update(params.id, formData);
    if (result) {
      // Navigate or show success message
    }
  };

  // ... render your form with product data
}
```

**app/admin/products/[id]/page.tsx** - View product details:

```typescript
"use client";
import { useAdminGet } from "better-admin/react";
import { adminClient } from "@/lib/admin-client";

export default function ViewProductPage({ params }) {
  const { data: product, loading, error } = useAdminGet(
    adminClient,
    "product",
    params.id
  );

  // ... render product details
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
