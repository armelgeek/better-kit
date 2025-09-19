# BetterAuth CRUD Plugin

A powerful, type-safe CRUD (Create, Read, Update, Delete) plugin for BetterAuth that automatically generates REST API endpoints for your resources, inspired by the modular architecture of BetterAuth itself.

## Features

- 🔧 **Automatic Endpoint Generation**: Creates full CRUD endpoints for any resource
- 🛡️ **Built-in Authentication**: Integrates seamlessly with BetterAuth's session management
- 🔒 **Granular Permissions**: Configure permissions per operation (create, read, update, delete, list)
- ✅ **Type-Safe**: Full TypeScript support with Zod schema validation
- 🎛️ **Configurable**: Enable/disable specific endpoints per resource
- 📊 **Pagination**: Built-in pagination support for list endpoints
- 🔍 **Search**: Basic search functionality for list operations
- 🏗️ **Database Agnostic**: Works with BetterAuth's adapter system

## Quick Start

### 1. Install and Setup

```typescript
import { betterAuth } from "better-auth";
import { crud, createResource, productSchema, categorySchema } from "better-auth/plugins";

export const auth = betterAuth({
  database: {
    provider: "sqlite", // or postgres, mysql
    url: "your-database-url",
  },
  plugins: [
    crud({
      resources: [
        createResource({
          name: "product",
          schema: productSchema,
          permissions: {
            create: async (user) => !!user, // Only authenticated users
            read: async () => true,         // Public read access
            update: async (user) => !!user,
            delete: async (user) => !!user,
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

### 2. API Routes (Next.js)

```typescript
// app/api/[...auth]/route.ts
import { auth } from "@/lib/auth";

export const GET = auth.handler;
export const POST = auth.handler;
export const PATCH = auth.handler;
export const DELETE = auth.handler;
```

### 3. Generated Endpoints

The plugin automatically creates these endpoints for each resource:

- `POST /api/product` - Create a product
- `GET /api/product/:id` - Get a product by ID
- `PATCH /api/product/:id` - Update a product
- `DELETE /api/product/:id` - Delete a product
- `GET /api/products` - List products (with pagination)

## Built-in Schemas

### Product Schema
```typescript
const productSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be positive"),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  status: z.enum(["active", "inactive", "draft"]).default("draft"),
  sku: z.string().optional(),
  stock: z.number().int().min(0).default(0),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});
```

### Category Schema
```typescript
const categorySchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
  parentId: z.string().optional(),
  slug: z.string().min(1, "Slug is required"),
  status: z.enum(["active", "inactive"]).default("active"),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});
```

### Tag Schema
```typescript
const tagSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Tag name is required"),
  color: z.string().optional(),
  description: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});
```

## Configuration Options

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
    create?: (user: any, data: any) => Promise<boolean> | boolean;
    read?: (user: any, id?: string) => Promise<boolean> | boolean;
    update?: (user: any, id?: string, data?: any) => Promise<boolean> | boolean;
    delete?: (user: any, id?: string) => Promise<boolean> | boolean;
    list?: (user: any) => Promise<boolean> | boolean;
  };
}
```

### Plugin Options

```typescript
interface CrudOptions {
  resources: CrudResourceConfig[];  // Array of resources
  basePath?: string;               // Base path for all endpoints (optional)
  requireAuth?: boolean;           // Global auth requirement (default: false)
}
```

## Usage Examples

### Creating a Product

```typescript
// Client-side
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

### Fetching Products with Pagination

```typescript
const response = await fetch('/api/products?page=1&limit=10&search=awesome');
const { items, pagination } = await response.json();

console.log(pagination); 
// { page: 1, limit: 10, total: 25, totalPages: 3 }
```

### Updating a Product

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

### Custom Permissions

```typescript
createResource({
  name: "order",
  schema: orderSchema,
  permissions: {
    create: async (user, data) => {
      // Only allow users to create orders for themselves
      return user && data.userId === user.id;
    },
    read: async (user, id) => {
      // Users can only read their own orders
      if (!user) return false;
      const order = await findOrder(id);
      return order?.userId === user.id;
    },
    update: async (user, id) => {
      // Only admin users can update orders
      return user?.role === 'admin';
    },
    delete: async (user, id) => {
      // No one can delete orders
      return false;
    },
    list: async (user) => {
      // Only authenticated users can list orders
      return !!user;
    },
  },
})
```

## Frontend Integration

### React Hook Example

```typescript
function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchProducts = async (params = {}) => {
    setLoading(true);
    try {
      const url = new URL('/api/products', window.location.origin);
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
      
      const response = await fetch(url.toString());
      const data = await response.json();
      setProducts(data.items);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async (productData) => {
    const response = await fetch('/api/product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData),
    });
    
    if (response.ok) {
      const newProduct = await response.json();
      setProducts(prev => [...prev, newProduct]);
      return newProduct;
    }
    throw new Error('Failed to create product');
  };

  return { products, loading, fetchProducts, createProduct };
}
```

## Architecture

The CRUD plugin follows BetterAuth's modular architecture:

1. **Plugin Factory**: `crud()` function creates the plugin
2. **Resource Factory**: `createResource()` creates individual resource configs
3. **Endpoint Generation**: Automatic REST endpoint creation
4. **Schema Integration**: Database schema generation from Zod schemas
5. **Permission System**: Granular access control per operation
6. **Adapter Integration**: Uses BetterAuth's database adapter system

## Database Integration

The plugin automatically:
- Generates database schema from Zod definitions
- Uses BetterAuth's adapter system for database operations
- Supports SQLite, PostgreSQL, and MySQL
- Handles timestamps (createdAt, updatedAt) automatically
- Provides basic search and pagination

## Error Handling

The plugin returns standard HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `403` - Forbidden (permission denied)
- `404` - Not Found
- `500` - Internal Server Error

## Contributing

This CRUD plugin is built following BetterAuth's patterns and conventions. When contributing:

1. Follow the existing code style
2. Add tests for new functionality
3. Update documentation
4. Ensure TypeScript compatibility
5. Test with multiple database adapters

## License

Same as BetterAuth project.