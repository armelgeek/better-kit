# Next.js 13+ App Router - Exemple d'Usage

Ce guide montre comment utiliser Better Query avec Next.js 13+ et l'App Router sans les erreurs de `"use client"`.

## Structure du Projet

```
app/
├── api/
│   └── query/
│       └── [...better-query]/
│           └── route.ts
├── components/
│   ├── ProductList.tsx    (Client Component)
│   └── ProductForm.tsx    (Client Component)
├── page.tsx               (Server Component par défaut)
└── layout.tsx
lib/
├── query.ts               (Configuration serveur)
├── client.ts              (Configuration client)
└── schemas.ts
```

## 1. Configuration Serveur (lib/query.ts)

```typescript
import { betterQuery, createResource } from "better-query";
import { z } from "zod";

const productSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  price: z.number(),
  description: z.string().optional(),
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
      middlewares: [
        {
          handler: async (context) => {
            console.log(`${context.operation} on ${context.resource}`);
            // Ajouter votre logique de middleware ici
          }
        }
      ],
      permissions: {
        create: async () => true,
        read: async () => true,
        update: async () => true,
        delete: async () => true,
        list: async () => true,
      }
    })
  ]
});

export type QueryType = typeof query;
```

## 2. Configuration Client (lib/client.ts)

```typescript
"use client";

import { createReactQueryClient } from "better-query/react";
import type { QueryType } from "./query";

export const queryClient = createReactQueryClient<QueryType>({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/query",
});
```

## 3. API Route (app/api/query/[...better-query]/route.ts)

```typescript
import { query } from "@/lib/query";

export const GET = query.handler;
export const POST = query.handler;
export const PATCH = query.handler;
export const DELETE = query.handler;
```

## 4. Server Component (app/page.tsx)

```typescript
// Pas besoin de "use client" - c'est un Server Component
import ProductList from "./components/ProductList";
import ProductForm from "./components/ProductForm";

export default function HomePage() {
  return (
    <main className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Better Query Demo</h1>
      <div className="grid md:grid-cols-2 gap-8">
        <ProductForm />
        <ProductList />
      </div>
    </main>
  );
}
```

## 5. Client Component avec Hooks (app/components/ProductList.tsx)

```typescript
"use client";

import { useState, useEffect } from "react";
import { useQuery } from "better-query/react";
import { queryClient } from "@/lib/client";

interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
}

export default function ProductList() {
  const { useList } = useQuery(queryClient);
  const { data: products, loading, error, refetch } = useList<Product>("product");

  if (loading) return <div>Loading products...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Products ({products?.length || 0})</h2>
        <button
          onClick={() => refetch()}
          className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
        >
          Refresh
        </button>
      </div>
      
      <div className="space-y-2">
        {products?.map((product) => (
          <div key={product.id} className="p-3 border rounded">
            <div className="font-medium">{product.name}</div>
            <div className="text-sm text-gray-600">${product.price}</div>
            {product.description && (
              <div className="text-sm text-gray-500">{product.description}</div>
            )}
          </div>
        ))}
        {(!products || products.length === 0) && (
          <div className="text-gray-500 italic">No products yet</div>
        )}
      </div>
    </div>
  );
}
```

## 6. Client Component avec Mutations (app/components/ProductForm.tsx)

```typescript
"use client";

import { useState } from "react";
import { useQuery } from "better-query/react";
import { queryClient } from "@/lib/client";

export default function ProductForm() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { useCreate } = useQuery(queryClient);
  const { execute: createProduct } = useCreate("product");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;

    setIsSubmitting(true);
    try {
      const result = await createProduct({
        name,
        price: parseFloat(price),
        description: description || undefined,
      });

      if (result.error) {
        alert("Error: " + result.error.message);
      } else {
        // Reset form
        setName("");
        setPrice("");
        setDescription("");
        alert("Product created successfully!");
      }
    } catch (error) {
      alert("Error creating product");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Add Product</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Product Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">
            Price
          </label>
          <input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded"
            rows={3}
          />
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? "Creating..." : "Create Product"}
        </button>
      </form>
    </div>
  );
}
```

## Points Clés

### ✅ Ce qui fonctionne maintenant :

1. **Server Components** peuvent importer et utiliser `better-query` sans problème
2. **Client Components** utilisent `better-query/react` avec les hooks React
3. **Aucune erreur** `"use client"` lors du build ou de l'exécution
4. **Middlewares** fonctionnent correctement avec le nouveau système

### 🔧 Changements nécessaires par rapport aux versions précédentes :

1. **Import React** : `import { useQuery } from "better-query/react"` au lieu de `"better-query"`
2. **Client Component** : Bien marquer les composants avec `"use client"` quand ils utilisent des hooks
3. **Configuration séparée** : Séparer la config serveur de la config client

Cette architecture respecte parfaitement les principes de Next.js 13+ App Router et évite tous les problèmes de mélange entre code serveur et client.