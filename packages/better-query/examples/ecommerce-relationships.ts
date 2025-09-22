import { adiemus } from "better-crud";
import {
  productSchema,
  categorySchema,
  reviewSchema,
  userSchema,
  productRelationships,
  categoryRelationships,
  reviewRelationships,
  userRelationships,
} from "better-crud/schemas/relationships";

/**
 * Example: E-commerce CRUD with comprehensive relationships
 * 
 * This example demonstrates:
 * - Product belongs to Category (belongsTo)
 * - Category has many Products (hasMany)
 * - Product has many Reviews (hasMany)
 * - Review belongs to Product and User (belongsTo)
 * - Category self-reference for hierarchies (parent/children)
 */

// Create CRUD instance with relationship-enabled resources
export const ecommerceCrud = adiemus({
  database: {
    provider: "sqlite",
    url: "sqlite:./ecommerce.db",
    autoMigrate: true,
  },
  basePath: "/api",
  resources: [
    {
      name: "user",
      schema: userSchema,
      relationships: {
        reviews: userRelationships.reviews,
      },
    },
    {
      name: "category",
      schema: categorySchema,
      relationships: categoryRelationships,
    },
    {
      name: "product",
      schema: productSchema,
      relationships: {
        category: productRelationships.category,
        reviews: productRelationships.reviews,
      },
    },
    {
      name: "review",
      schema: reviewSchema,
      relationships: reviewRelationships,
    },
  ],
});

// Example usage:

async function exampleUsage() {
  // Create a user
  const user = await fetch("/api/user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "john@example.com",
      name: "John Doe",
    }),
  }).then(r => r.json());

  // Create category hierarchy
  const electronicsCategory = await fetch("/api/category", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Electronics",
      slug: "electronics",
    }),
  }).then(r => r.json());

  const phonesCategory = await fetch("/api/category", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Phones",
      slug: "phones",
      parentId: electronicsCategory.id,
    }),
  }).then(r => r.json());

  // Create product with category relationship
  const product = await fetch("/api/product", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "iPhone 15 Pro",
      description: "Latest iPhone with amazing features",
      price: 999,
      categoryId: phonesCategory.id,
      sku: "IPHONE15PRO",
      stock: 50,
    }),
  }).then(r => r.json());

  // Create review for the product
  const review = await fetch("/api/review", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: product.id,
      userId: user.id,
      rating: 5,
      title: "Excellent phone!",
      content: "Love the camera quality and performance.",
    }),
  }).then(r => r.json());

  // Fetch product with all relationships
  const productWithRelations = await fetch(
    `/api/product/${product.id}?include=category,reviews`
  ).then(r => r.json());

  console.log("Product with relationships:", {
    id: productWithRelations.id,
    name: productWithRelations.name,
    category: productWithRelations.category?.name,
    reviewCount: productWithRelations.reviews?.length,
  });

  // Fetch category with nested hierarchy and products
  const categoryWithHierarchy = await fetch(
    `/api/category/${electronicsCategory.id}?include=children,products`
  ).then(r => r.json());

  console.log("Category hierarchy:", {
    name: categoryWithHierarchy.name,
    childCategories: categoryWithHierarchy.children?.map((c: any) => c.name),
    productCount: categoryWithHierarchy.products?.length,
  });

  // Fetch review with nested product and user data
  const reviewWithNested = await fetch(
    `/api/review/${review.id}?select=${encodeURIComponent(JSON.stringify({
      product: { include: ["category"] },
      user: true
    }))}`
  ).then(r => r.json());

  console.log("Review with nested data:", {
    title: reviewWithNested.title,
    productName: reviewWithNested.product?.name,
    categoryName: reviewWithNested.product?.category?.name,
    userName: reviewWithNested.user?.name,
  });

  // List products with pagination and relationships
  const productsPage = await fetch(
    "/api/products?include=category&page=1&limit=10"
  ).then(r => r.json());

  console.log("Products with categories:", {
    totalProducts: productsPage.pagination.total,
    products: productsPage.items.map((p: any) => ({
      name: p.name,
      category: p.category?.name,
    })),
  });
}

// Export for use in applications
export { ecommerceCrud as default };
export type EcommerceCrud = typeof ecommerceCrud;