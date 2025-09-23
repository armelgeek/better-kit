# Better Query Demo - Next.js Integration Guide

This document provides a comprehensive guide for integrating Better Query with a Next.js application, showcasing all features and capabilities.

## Overview

The Better Query integration in this Next.js app demonstrates how to:
- Configure Better Query as a standalone CRUD generator
- Create and manage complex resources (products, categories, orders, reviews, user profiles)
- Implement comprehensive CRUD operations with React components
- Handle authentication, permissions, and validation
- Use advanced features like search, pagination, and filtering
- Apply type safety throughout the entire stack

## Features Demonstrated

### 🚀 Core Features
- **Automatic CRUD Generation**: Full Create, Read, Update, Delete, List operations
- **Type Safety**: Full TypeScript support with Zod schema validation
- **Granular Permissions**: Configure permissions per operation with context-aware logic
- **Database Agnostic**: SQLite backend with auto-migration support
- **Hooks System**: Before/after hooks for business logic and data transformation

### ⚡ Advanced Features
- **Search & Filtering**: Built-in search with custom filters and price ranges
- **Pagination**: Automatic pagination with cursor support and page navigation
- **Complex Schemas**: Nested objects, arrays, optional fields, and relationships
- **Error Handling**: Comprehensive error handling with typed error codes
- **React Integration**: Custom hooks and components with optimistic updates

### 📊 Resource Types
1. **Products**: E-commerce products with inventory, SEO, pricing, and metadata
2. **Categories**: Hierarchical categories with parent-child relationships
3. **Orders**: Complex orders with items, addresses, and calculations
4. **Reviews**: User-generated content with ratings and moderation
5. **User Profiles**: Extended user data with preferences and addresses

## Quick Start

### 1. Installation

```bash
npm install better-query better-sqlite3 zod
# or
pnpm add better-query better-sqlite3 zod
```

### 2. Database Configuration

The app uses SQLite with auto-migration enabled. The database file (`data.db`) is created automatically.

```typescript
// lib/crud-auth.ts
export const query = betterQuery({
  basePath: "/api/query",
  database: {
    provider: "sqlite",
    url: "data.db",
    autoMigrate: true,
  },
  // ... resources configuration
});
```

### 3. API Routes Setup

Create the catch-all API route for Better Query:

```typescript
// app/api/query/[...any]/route.ts
import { query } from "@/lib/crud-auth";
import { NextRequest } from "next/server";

const handler = query.handler;

export const POST = async (req: NextRequest) => handler(req);
export const PATCH = async (req: NextRequest) => handler(req);
export const DELETE = async (req: NextRequest) => handler(req);
export const GET = handler;
```

### 4. Client Configuration

Set up the type-safe client for API calls:

```typescript
// lib/crud-auth.ts
export const queryClient = createQueryClient<typeof query>({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/query",
});
```

## Available Endpoints

The Better Query setup automatically generates the following endpoints for each resource:

### Product Endpoints
- `POST /api/query/product` - Create a new product
- `GET /api/query/product/:id` - Get a product by ID
- `PATCH /api/query/product/:id` - Update a product
- `DELETE /api/query/product/:id` - Delete a product
- `GET /api/query/products` - List all products (with pagination and search)

### Category Endpoints
- `POST /api/query/category` - Create a new category
- `GET /api/query/category/:id` - Get a category by ID
- `PATCH /api/query/category/:id` - Update a category
- `DELETE /api/query/category/:id` - Delete a category
- `GET /api/query/categories` - List all categories

### Order Endpoints
- `POST /api/query/order` - Create a new order
- `GET /api/query/order/:id` - Get an order by ID
- `PATCH /api/query/order/:id` - Update an order
- `DELETE /api/query/order/:id` - Delete an order
- `GET /api/query/orders` - List orders (filtered by user permissions)

### Review Endpoints
- `POST /api/query/review` - Create a new review
- `GET /api/query/review/:id` - Get a review by ID
- `PATCH /api/query/review/:id` - Update a review
- `DELETE /api/query/review/:id` - Delete a review
- `GET /api/query/reviews` - List all reviews

### User Profile Endpoints
- `POST /api/query/userProfile` - Create a user profile
- `GET /api/query/userProfile/:id` - Get a user profile
- `PATCH /api/query/userProfile/:id` - Update a user profile
- `DELETE /api/query/userProfile/:id` - Delete a user profile
- `GET /api/query/userProfiles` - List user profiles (admin only)

## Schema Examples

### Product Schema
```typescript
export const productSchema = withId({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  price: z.number().positive("Price must be positive"),
  originalPrice: z.number().positive().optional(),
  status: z.enum(["active", "inactive", "draft"]).default("draft"),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  inventory: z.object({
    quantity: z.number().min(0).default(0),
    lowStockThreshold: z.number().min(0).default(10),
    trackQuantity: z.boolean().default(true),
  }),
  profile: z.object({
    featured: z.boolean().default(false),
    category: z.string().optional(),
    dimensions: z.object({
      length: z.number().optional(),
      width: z.number().optional(),
      height: z.number().optional(),
    }).optional(),
  }),
  seo: z.object({
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    slug: z.string().optional(),
  }).optional(),
});
```

## React Component Usage

### Basic CRUD Operations with Custom Hooks

```typescript
// hooks/useCrud.ts
import { useProducts } from '@/hooks/useCrud';

export function ProductManager() {
  const {
    items: products,
    loading,
    error,
    create,
    update,
    remove,
    refresh
  } = useProducts();

  const handleCreate = async (productData) => {
    try {
      await create(productData);
      refresh();
    } catch (err) {
      console.error('Failed to create product:', err);
    }
  };

  // ... component implementation
}
```

### Advanced Search and Filtering

```typescript
import { useProductSearch } from '@/hooks/useCrud';

export function ProductSearch() {
  const {
    products,
    loading,
    pagination,
    searchParams,
    updateSearch,
    search,
  } = useProductSearch();

  const handleSearch = () => {
    search({
      search: 'laptop',
      minPrice: 100,
      maxPrice: 1000,
      status: 'active',
      sortBy: 'price',
      sortOrder: 'asc',
    });
  };

  // ... component implementation
}
```

## Permissions & Security

Better Query includes granular permission controls for each operation:

```typescript
createResource({
  name: "product",
  schema: productSchema,
  permissions: {
    read: async () => true,  // Public read access
    list: async () => true,  // Public listing
    create: async (context) => !!context.user, // Authenticated users only
    update: async (context) => {
      // Users can update their own products, admins can update any
      return context.user?.role === "admin" || 
             context.existingData?.createdBy === context.user?.id;
    },
    delete: async (context) => context.user?.role === "admin", // Admin only
  },
});
```

## Business Logic with Hooks

Implement custom business logic using before/after hooks:

```typescript
createResource({
  name: "product",
  schema: productSchema,
  hooks: {
    beforeCreate: async (context) => {
      // Auto-generate slug from name
      if (!context.data.seo?.slug && context.data.name) {
        context.data.seo = {
          ...context.data.seo,
          slug: context.data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        };
      }
    },
    afterCreate: async (context) => {
      console.log(`Product created: ${context.result.name}`);
    },
    beforeUpdate: async (context) => {
      // Always update the updatedAt timestamp
      context.data.updatedAt = new Date();
    },
  },
});
```

## Error Handling

Better Query provides comprehensive error handling:

```typescript
const result = await queryClient.product.create(data);

if (result.error) {
  switch (result.error.code) {
    case queryClient.$ERROR_CODES.VALIDATION_FAILED:
      console.log("Invalid input data");
      break;
    case queryClient.$ERROR_CODES.UNAUTHORIZED:
      console.log("Please log in");
      break;
    case queryClient.$ERROR_CODES.FORBIDDEN:
      console.log("Permission denied");
      break;
    default:
      console.log("Unknown error:", result.error.message);
  }
}
```

## Advanced Features

### Pagination with Navigation

```typescript
const result = await queryClient.product.list({
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

### Search with Filters

```typescript
const result = await queryClient.product.list({
  search: "electronics",
  where: {
    status: "active",
    categoryId: "electronics-123",
  },
  filters: {
    priceRange: { min: 10, max: 100 },
  },
  sortBy: "price",
  sortOrder: "asc",
});
```

### Complex Data Types

```typescript
// Create a product with nested objects and arrays
await queryClient.product.create({
  name: "Gaming Laptop",
  price: 1299.99,
  tags: ["gaming", "laptop", "electronics"],
  inventory: {
    quantity: 50,
    lowStockThreshold: 5,
    trackQuantity: true,
  },
  profile: {
    featured: true,
    category: "electronics",
    dimensions: {
      length: 35.5,
      width: 25.0,
      height: 2.5,
    },
  },
  seo: {
    metaTitle: "Best Gaming Laptop 2024",
    metaDescription: "High-performance gaming laptop...",
    slug: "gaming-laptop-2024",
  },
});
```

## Dashboard Features

The demo includes a comprehensive dashboard showcasing:

1. **Overview Tab**: Statistics and feature summary
2. **Product Management**: Full CRUD with complex forms
3. **Search & Filter**: Advanced search capabilities
4. **Categories**: Hierarchical data management
5. **Orders**: Complex business logic
6. **Reviews**: User-generated content

## Development

### Running the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the demo.

### Building for Production

```bash
npm run build
npm start
```

### Testing

The app includes comprehensive examples of:
- Form validation with real-time feedback
- Optimistic updates with rollback on error
- Loading states and error boundaries
- Type-safe API calls with full IntelliSense

## File Structure

```
src/
├── app/
│   ├── api/
│   │   └── query/[...any]/route.ts    # Better Query API routes
│   ├── globals.css                     # Global styles
│   ├── layout.tsx                      # Root layout
│   └── page.tsx                        # Main dashboard page
├── components/
│   └── examples/                       # Demo components
│       ├── BetterQueryDashboard.tsx    # Main dashboard
│       ├── ProductManager.tsx          # Full CRUD demo
│       └── ProductSearchDemo.tsx       # Search & pagination demo
├── hooks/
│   └── useCrud.ts                      # Custom React hooks
└── lib/
    ├── crud-auth.ts                    # Better Query configuration
    └── schemas.ts                      # Zod schemas
```

## Best Practices

1. **Use TypeScript**: Get full type safety for your CRUD operations
2. **Handle Errors**: Always include proper error handling in your components
3. **Validate Data**: Use Zod schemas for robust data validation
4. **Secure Permissions**: Implement proper authentication and authorization
5. **Test Thoroughly**: Test all CRUD operations and edge cases
6. **Optimize Performance**: Use pagination and search to handle large datasets

## Troubleshooting

### Common Issues

1. **Module not found errors**: Ensure better-query is properly built
2. **Type errors**: Make sure the client is properly typed with the query instance
3. **Permission errors**: Check that permissions are correctly configured
4. **Database errors**: Verify database connection and migration settings

### Environment Variables

```bash
# .env.local
BETTER_AUTH_SECRET=your-secret-key-here
DATABASE_URL=sqlite:./data.db
NEXT_PUBLIC_API_URL=http://localhost:3000/api/query
```

## Next Steps

- Explore the different tabs in the dashboard
- Try creating, editing, and deleting products
- Test the search and filtering functionality
- Examine the source code for implementation details
- Customize schemas and permissions for your use case

---

This comprehensive demo showcases all the capabilities of Better Query in a real-world Next.js application. Use it as a reference for implementing Better Query in your own projects.