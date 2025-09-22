# Better-CRUD Relationship Management

This document provides a comprehensive guide to the relationship management system in better-crud, which enables sophisticated data modeling and querying capabilities for modern CRUD applications.

## Overview

The better-crud relationship system provides:
- **Explicit relationship definitions** in schema configurations
- **Type-safe relational queries** with include/select options
- **Nested serialization** with depth control
- **Atomic operations** for creating/updating related data
- **Cascade operations** for managing data integrity
- **Referential integrity** validation
- **Full TypeScript support** for client-side development

## Relationship Types

### 1. BelongsTo (Many-to-One)
A model belongs to another model through a foreign key.

```typescript
{
  type: "belongsTo",
  target: "category",           // Target model name
  foreignKey: "categoryId",     // Foreign key field in this model
  targetKey: "id",              // Referenced field in target model
}
```

**Use Case**: Product belongs to Category, Review belongs to User

### 2. HasOne (One-to-One)
A model has exactly one related model.

```typescript
{
  type: "hasOne",
  target: "profile",
  foreignKey: "userId",         // Foreign key field in target model
  targetKey: "id",              // This model's primary key
}
```

**Use Case**: User has one Profile

### 3. HasMany (One-to-Many)
A model has multiple related models.

```typescript
{
  type: "hasMany",
  target: "review",
  foreignKey: "productId",      // Foreign key field in target model
  targetKey: "id",              // This model's primary key
}
```

**Use Case**: Product has many Reviews, Category has many Products

### 4. BelongsToMany (Many-to-Many)
Models are related through a junction table.

```typescript
{
  type: "belongsToMany",
  target: "tag",
  through: "product_tags",      // Junction table name
  sourceKey: "productId",       // This model's key in junction table
  targetForeignKey: "tagId",    // Target model's key in junction table
}
```

**Use Case**: Products have many Tags, Tags belong to many Products

## Configuration

### Basic Resource Configuration

```typescript
import { adiemus } from "adiemus";
import { productSchema, categorySchema } from "./schemas";

const crud = adiemus({
  database: {
    provider: "sqlite",
    url: "sqlite:./database.db",
    autoMigrate: true,
  },
  resources: [
    {
      name: "product",
      schema: productSchema,
      relationships: {
        category: {
          type: "belongsTo",
          target: "category",
          foreignKey: "categoryId",
        },
        reviews: {
          type: "hasMany",
          target: "review",
          foreignKey: "productId",
        },
        tags: {
          type: "belongsToMany",
          target: "tag",
          through: "product_tags",
          sourceKey: "productId",
          targetForeignKey: "tagId",
        },
      },
    },
    {
      name: "category",
      schema: categorySchema,
      relationships: {
        products: {
          type: "hasMany",
          target: "product",
          foreignKey: "categoryId",
        },
        parent: {
          type: "belongsTo",
          target: "category",
          foreignKey: "parentId",
        },
        children: {
          type: "hasMany",
          target: "category",
          foreignKey: "parentId",
        },
      },
    },
  ],
});
```

### Schema Definition with References

```typescript
import { z } from "zod";

export const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  price: z.number().min(0),
  categoryId: z.string().optional(),    // Foreign key for category relationship
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  parentId: z.string().optional(),      // Self-referencing foreign key
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});
```

## Querying with Relationships

### Simple Includes

Load related data using the `include` query parameter:

```typescript
// Single relationship
GET /product/123?include=category

// Multiple relationships
GET /product/123?include=category,reviews,tags

// List with relationships
GET /products?include=category&page=1&limit=10
```

Response:
```json
{
  "id": "123",
  "name": "iPhone 15",
  "price": 999,
  "categoryId": "cat-1",
  "category": {
    "id": "cat-1",
    "name": "Electronics"
  },
  "reviews": [
    {
      "id": "rev-1",
      "rating": 5,
      "title": "Great phone!"
    }
  ]
}
```

### Advanced Select Queries

Use the `select` parameter for complex nested includes:

```typescript
// Nested relationships
GET /review/456?select={"product":{"include":["category"]},"user":true}

// With depth control
GET /category/789?select={"children":{"include":["products"],"maxDepth":2}}
```

Response:
```json
{
  "id": "456",
  "title": "Great review",
  "rating": 5,
  "product": {
    "id": "123",
    "name": "iPhone 15",
    "category": {
      "id": "cat-1",
      "name": "Electronics"
    }
  },
  "user": {
    "id": "user-1",
    "name": "John Doe"
  }
}
```

## Client-Side Usage

### TypeScript Client

```typescript
import { createCrudClient } from "better-crud/client";

// Client inherits relationship types from server configuration
const client = createCrudClient<typeof crud>({
  baseUrl: "http://localhost:3000/api",
});

// Type-safe relationship queries
const productWithCategory = await client.product.findFirst({
  where: { id: "123" },
  include: { category: true },
});

// productWithCategory.category is fully typed
console.log(productWithCategory.category?.name);

// Nested includes with full type safety
const reviewWithNested = await client.review.findFirst({
  where: { id: "456" },
  include: {
    product: {
      include: { category: true }
    },
    user: true
  },
});
```

### React Integration

```typescript
import { useQuery } from "@tanstack/react-query";

function ProductDetail({ productId }: { productId: string }) {
  const { data: product, isLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => client.product.findFirst({
      where: { id: productId },
      include: {
        category: true,
        reviews: {
          include: { user: true }
        }
      }
    }),
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>{product.name}</h1>
      <p>Category: {product.category?.name}</p>
      
      <h2>Reviews</h2>
      {product.reviews?.map(review => (
        <div key={review.id}>
          <strong>{review.user?.name}</strong>: {review.title}
        </div>
      ))}
    </div>
  );
}
```

## Advanced Features

### Atomic Operations

Create or update records with their related data in a single transaction:

```typescript
// Create product with reviews in one operation
const product = await client.product.createWithRelations({
  data: {
    name: "New Product",
    price: 99.99,
    categoryId: "cat-1",
  },
  relations: {
    reviews: [
      {
        userId: "user-1",
        rating: 5,
        title: "Great product!",
        content: "Love it!"
      }
    ]
  },
  include: {
    category: true,
    reviews: { include: { user: true } }
  }
});
```

### Cascade Delete

Configure cascade behavior for maintaining data integrity:

```typescript
// In relationship configuration
{
  type: "hasMany",
  target: "review",
  foreignKey: "productId",
  onDelete: "cascade",  // Delete reviews when product is deleted
}

// Delete with cascade
await client.product.delete({
  where: { id: "123" },
  cascade: true,
});
```

### Self-Referencing Relationships

Handle hierarchical data structures:

```typescript
// Category hierarchy
const rootCategory = await client.category.findFirst({
  where: { parentId: null },
  include: {
    children: {
      include: { children: true }  // Nested hierarchy
    }
  }
});

// Build tree structure
function buildCategoryTree(category: Category): CategoryNode {
  return {
    ...category,
    children: category.children?.map(buildCategoryTree) || []
  };
}
```

### Filtering Related Data

Filter and paginate related data:

```typescript
// Get product with only approved reviews
const product = await client.product.findFirst({
  where: { id: "123" },
  include: {
    reviews: {
      where: { status: "approved" },
      orderBy: { createdAt: "desc" },
      take: 5
    }
  }
});

// Get categories with product count
const categories = await client.category.findMany({
  include: {
    products: { 
      select: { id: true },  // Only count, don't load full data
    }
  }
});
```

## Database Schema Generation

The relationship system automatically generates appropriate database schemas:

### Foreign Key Constraints

```sql
-- Product table with foreign key constraint
CREATE TABLE product (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  category_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE CASCADE
);
```

### Junction Tables

```sql
-- Many-to-many junction table
CREATE TABLE product_tags (
  product_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (product_id, tag_id),
  FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tag(id) ON DELETE CASCADE
);
```

## Performance Considerations

### Eager vs Lazy Loading

```typescript
// Eager loading (single query with joins)
const products = await client.product.findMany({
  include: { category: true },  // Joined in single query
});

// Lazy loading (separate queries)
const products = await client.product.findMany();
for (const product of products) {
  product.category = await client.category.findFirst({
    where: { id: product.categoryId }
  });
}
```

### Selective Loading

```typescript
// Load only needed fields to reduce payload
const products = await client.product.findMany({
  select: {
    id: true,
    name: true,
    category: {
      select: { id: true, name: true }  // Only load category name
    }
  }
});
```

### Pagination with Relationships

```typescript
// Paginate main data, load all related data
const result = await client.product.findMany({
  take: 10,
  skip: 20,
  include: { reviews: true },  // All reviews for each product
});

// Paginate both main and related data
const result = await client.product.findMany({
  take: 10,
  skip: 20,
  include: {
    reviews: {
      take: 5,  // Only first 5 reviews per product
      orderBy: { createdAt: "desc" }
    }
  }
});
```

## Error Handling

### Referential Integrity Errors

```typescript
try {
  await client.product.create({
    data: {
      name: "Product",
      categoryId: "invalid-id"  // Non-existent category
    }
  });
} catch (error) {
  if (error.code === "FOREIGN_KEY_CONSTRAINT") {
    console.error("Invalid category reference");
  }
}
```

### Circular Reference Prevention

```typescript
// Automatic depth limiting prevents infinite recursion
const category = await client.category.findFirst({
  where: { id: "root" },
  include: {
    children: {
      include: {
        children: true  // Limited by maxDepth setting
      }
    }
  }
});
```

## Migration and Schema Evolution

### Adding New Relationships

```typescript
// 1. Update schema
const productSchema = z.object({
  // ... existing fields
  manufacturerId: z.string().optional(),  // New foreign key
});

// 2. Add relationship configuration
{
  manufacturer: {
    type: "belongsTo",
    target: "manufacturer",
    foreignKey: "manufacturerId",
  }
}

// 3. Auto-migration handles database changes
```

### Removing Relationships

```typescript
// 1. Remove relationship from configuration
// 2. Update schema to remove foreign key field
// 3. Handle existing data migration as needed

const migration = `
  ALTER TABLE product DROP COLUMN manufacturer_id;
`;
```

## Best Practices

### 1. Naming Conventions
- Use consistent naming for foreign keys (`categoryId`, `userId`)
- Name junction tables descriptively (`product_tags`, `user_roles`)
- Use singular forms for model names (`product`, not `products`)

### 2. Relationship Design
- Prefer explicit foreign keys over implicit relationships
- Use appropriate cascade behaviors for data integrity
- Limit nested include depth to prevent performance issues

### 3. Type Safety
- Always define relationships in TypeScript for compile-time checking
- Use schema validation for runtime type safety
- Leverage client type inference for development productivity

### 4. Performance
- Use selective loading (`select`) to minimize data transfer
- Implement pagination for large relationship collections
- Consider caching strategies for frequently accessed relationships

### 5. Testing
- Test relationship constraints and cascade behaviors
- Verify serialization depth limits
- Test error handling for invalid references

This comprehensive relationship system makes better-crud suitable for complex data modeling scenarios while maintaining type safety and developer productivity.