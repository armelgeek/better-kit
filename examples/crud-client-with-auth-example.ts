/**
 * Example showing how to use the CRUD plugin with client configuration
 * This demonstrates the new createAuthClientWithCrud function
 */

import { betterAuth } from "better-auth";
import { createAuthClientWithCrud } from "better-auth/client";
import {
  crud,
  createResource,
  productSchema,
  categorySchema,
} from "better-auth/plugins";

// 1. Server Configuration
export const auth = betterAuth({
  database: {
    provider: "sqlite", 
    url: ":memory:",
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

// 2. Client Configuration with CRUD support
export const authClient = createAuthClientWithCrud(auth, {
  baseURL: "http://localhost:3000/api/auth",
});

// 3. Usage Examples

// Regular auth operations (unchanged)
export async function signIn(email: string, password: string) {
  return await authClient.signInCredential({
    body: { email, password },
  });
}

export async function getSession() {
  const session = authClient.$session.get();
  return session;
}

// CRUD operations (new!)
export async function createProduct(productData: {
  name: string;
  price: number;
  description?: string;
}) {
  return await authClient.product.create(productData, {
    headers: {
      "Authorization": `Bearer ${getAuthToken()}`,
    },
  });
}

export async function getProduct(id: string) {
  return await authClient.product.read(id);
}

export async function updateProduct(id: string, updates: {
  name?: string;
  price?: number;
  description?: string;
}) {
  return await authClient.product.update(id, updates, {
    headers: {
      "Authorization": `Bearer ${getAuthToken()}`,
    },
  });
}

export async function deleteProduct(id: string) {
  return await authClient.product.delete(id, {
    headers: {
      "Authorization": `Bearer ${getAuthToken()}`,
    },
  });
}

export async function listProducts(options?: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  return await authClient.product.list(options);
}

// Category operations work the same way
export async function createCategory(categoryData: {
  name: string;
  description?: string;
}) {
  return await authClient.category.create(categoryData);
}

export async function listCategories() {
  return await authClient.category.list();
}

// Helper function to get auth token (you'd implement this based on your auth setup)
function getAuthToken(): string {
  // Implementation depends on your auth setup
  return "";
}

// 4. React Hook Usage Example
/*
import { useEffect, useState } from 'react';

function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const result = await authClient.product.list({ limit: 10 });
        if (result.data) {
          setProducts(result.data.items);
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  const handleCreateProduct = async (productData) => {
    try {
      const result = await authClient.product.create(productData);
      if (result.data) {
        setProducts(prev => [...prev, result.data]);
      }
    } catch (error) {
      console.error('Failed to create product:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Products</h1>
      <ul>
        {products.map(product => (
          <li key={product.id}>
            {product.name} - ${product.price}
          </li>
        ))}
      </ul>
    </div>
  );
}
*/

// 5. Type Safety Examples
/*
// The client is fully typed based on your schema:

// ✅ TypeScript enforces required fields
await authClient.product.create({
  name: "Required field",     // ✅ TypeScript enforces this
  price: 29.99,              // ✅ Validates number type
  // description: "optional"  // ✅ Optional fields suggested
});

// ✅ Partial updates with proper typing
await authClient.product.update("id", {
  price: 34.99,  // ✅ Only update fields you want to change
});

// ✅ Properly typed responses
const result = await authClient.product.create(data);
if (result.data) {
  console.log(result.data.id);    // ✅ Auto-completion available
  console.log(result.data.name);  // ✅ Type-safe property access
}
*/