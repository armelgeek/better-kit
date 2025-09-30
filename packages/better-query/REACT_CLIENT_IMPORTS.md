# React Client Import Guide

Depuis la mise à jour pour corriger les problèmes de compatibilité Next.js 13+ App Router, les exports React ont été séparés du package principal.

## Import Correct

### ✅ CORRECT - Utilisez le sous-package `/react`

```typescript
// Hooks React avec "use client" directive
import { createReactQueryClient, useQuery, useResource } from "better-query/react";
import type { ReactQueryClient, ReactQueryClientOptions } from "better-query/react";
```

### ❌ INCORRECT - N'importez plus depuis le package principal

```typescript
// Ne fonctionne plus - ces exports ont été déplacés
import { createReactQueryClient, useQuery, useResource } from "better-query";
```

## Imports Serveur vs Client

### Côté Serveur (API routes, Server Components)

```typescript
// Pour les API routes et les composants serveur
import { betterQuery, createResource } from "better-query";
import { createQueryClient } from "better-query";
```

### Côté Client (Client Components)

```typescript
// Pour les composants client avec hooks React
"use client";

import { createReactQueryClient, useQuery } from "better-query/react";
import type { ReactQueryClient } from "better-query/react";
```

## Exemple d'Usage

### 1. Configuration du client React

```typescript
// lib/client.ts
"use client";

import { createReactQueryClient } from "better-query/react";
import type { QueryType } from "./query";

export const queryClient = createReactQueryClient<QueryType>({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/query",
});
```

### 2. Utilisation dans un composant

```typescript
// components/ProductList.tsx
"use client";

import { useState, useEffect } from "react";
import { useQuery } from "better-query/react";
import { queryClient } from "@/lib/client";

export default function ProductList() {
  const { useList } = useQuery(queryClient);
  const { data: products, loading, error } = useList("product");

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {products?.map((product) => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
}
```

## Migration depuis les versions précédentes

Si vous avez du code existant qui importe les hooks React depuis `better-query`, mettez simplement à jour les imports :

```typescript
// Avant
import { createReactQueryClient, useQuery } from "better-query";

// Après  
import { createReactQueryClient, useQuery } from "better-query/react";
```

## Pourquoi cette séparation ?

Cette séparation résout le problème suivant en Next.js 13+ :

```
Error: You're importing a component that needs useState. 
It only works in a Client Component but none of its parents are marked with "use client"
```

En séparant les exports React dans un bundle dédié avec la directive `"use client"`, nous nous assurons que :

1. Les hooks React ne sont pas bundlés avec le code serveur
2. La directive `"use client"` est préservée correctement
3. Les Server Components peuvent utiliser better-query sans problème
4. Les Client Components ont accès aux hooks React avec le bon contexte

## Exports Disponibles

### better-query (package principal)
- `betterQuery` - Configuration principale
- `createResource` - Créateur de ressources
- `createQueryClient` - Client vanilla (non-React)
- Tous les types et adaptateurs

### better-query/react (package React)
- `createReactQueryClient` - Client React avec hooks
- `useQuery` - Hook principal pour les opérations CRUD
- `useResource` - Hook pour une ressource spécifique
- Types React (`ReactQueryClient`, `ReactQueryClientOptions`)

Cette séparation assure une meilleure compatibilité avec les dernières versions de Next.js et les React Server Components.