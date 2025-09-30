# Middlewares Guide

Les middlewares dans Better Query permettent d'intercepter et de modifier les requêtes avant qu'elles ne soient traitées. Cette fonctionnalité est particulièrement utile pour l'authentification, la validation, l'audit et autres tâches transversales.

## Structure des Middlewares

Depuis la mise à jour, la propriété s'appelle maintenant `middlewares` (au pluriel) au lieu de `middleware`.

### Définition de Type

```typescript
interface QueryMiddleware {
  /** Path pattern to match (optional for resource-level middleware) */
  path?: string;
  /** Middleware function that can modify the permission context */
  handler: (context: QueryMiddlewareContext) => Promise<void> | void;
}

interface QueryMiddlewareContext {
  /** User data (can be modified by middleware) */
  user?: any;
  /** Resource being accessed */
  resource: string;
  /** Operation being performed */
  operation: QueryOperation;
  /** Data being created/updated (for create/update operations) */
  data?: any;
  /** ID being accessed (for read/update/delete operations) */
  id?: string;
  /** Full request context */
  request?: any;
  /** User scopes/roles (can be modified by middleware) */
  scopes?: string[];
  /** Existing data (for update/delete operations) */
  existingData?: any;
}
```

## Utilisation au Niveau Resource

```typescript
import { createResource } from "better-query";
import type { QueryMiddlewareContext } from "better-query";

const todoResource = createResource({
  name: "todo",
  schema: todoSchema,
  // Notez l'utilisation de "middlewares" au pluriel
  middlewares: [
    {
      handler: async (context: QueryMiddlewareContext) => {
        // Authentification
        const session = await auth.api.getSession({
          headers: await headers()
        });
        context.user = session?.user;
        
        // Log des accès
        console.log(`User ${context.user?.id} accessing ${context.resource}:${context.operation}`);
      }
    },
    {
      // Middleware pour la validation
      handler: async (context: QueryMiddlewareContext) => {
        if (context.operation === 'create' && context.data) {
          // Ajouter automatiquement des timestamps
          context.data.createdAt = new Date();
          context.data.updatedAt = new Date();
        }
        
        if (context.operation === 'update' && context.data) {
          context.data.updatedAt = new Date();
        }
      }
    }
  ],
  permissions: {
    create: async (context) => !!context.user,
    read: async () => true,
    // ...
  }
});
```

## Utilisation Globale

```typescript
import { betterQuery } from "better-query";
import type { QueryMiddlewareContext } from "better-query";

const query = betterQuery({
  basePath: "/api/query",
  database: { /* config */ },
  // Middlewares globaux qui s'appliquent à toutes les resources
  middlewares: [
    {
      handler: async (context: QueryMiddlewareContext) => {
        // Rate limiting global
        await rateLimiter.check(context.request.ip);
        
        // Audit logging global
        auditLogger.log({
          resource: context.resource,
          operation: context.operation,
          user: context.user?.id,
          timestamp: new Date()
        });
      }
    }
  ],
  resources: [
    // vos resources...
  ]
});
```

## Exemples d'Usage

### 1. Authentification avec Better Auth

```typescript
middlewares: [
  {
    handler: async (context: QueryMiddlewareContext) => {
      const session = await auth.api.getSession({
        headers: await headers()
      });
      
      if (!session?.user) {
        throw new Error("Authentication required");
      }
      
      context.user = session.user;
      context.scopes = session.user.roles || [];
    }
  }
]
```

### 2. Validation de Données

```typescript
middlewares: [
  {
    handler: async (context: QueryMiddlewareContext) => {
      if (context.operation === 'create' || context.operation === 'update') {
        // Validation spécifique
        if (context.data.email) {
          context.data.email = context.data.email.toLowerCase().trim();
        }
        
        // Vérification des données sensibles
        if (context.data.sensitive && !context.user?.isAdmin) {
          delete context.data.sensitive;
        }
      }
    }
  }
]
```

### 3. Audit et Logging

```typescript
middlewares: [
  {
    handler: async (context: QueryMiddlewareContext) => {
      // Log avant l'opération
      console.log(`[AUDIT] ${context.user?.id || 'anonymous'} attempting ${context.operation} on ${context.resource}`);
      
      // Enregistrement dans une base d'audit
      await auditDb.create({
        userId: context.user?.id,
        resource: context.resource,
        operation: context.operation,
        data: context.operation === 'delete' ? { id: context.id } : context.data,
        timestamp: new Date(),
        ip: context.request?.ip
      });
    }
  }
]
```

### 4. Transformation de Données

```typescript
middlewares: [
  {
    handler: async (context: QueryMiddlewareContext) => {
      if (context.operation === 'create' && context.resource === 'user') {
        // Hash du mot de passe
        if (context.data.password) {
          context.data.passwordHash = await bcrypt.hash(context.data.password, 10);
          delete context.data.password;
        }
        
        // Génération d'un ID unique
        context.data.id = generateUniqueId();
      }
    }
  }
]
```

## Ordre d'Exécution

1. **Middlewares globaux** (définis au niveau de betterQuery)
2. **Middlewares de resource** (définis au niveau de createResource)
3. **Hooks before** (beforeCreate, beforeUpdate, etc.)
4. **Vérifications de permissions**
5. **Opération de base de données**
6. **Hooks after** (afterCreate, afterUpdate, etc.)

## Bonnes Pratiques

1. **Typage strict** : Toujours utiliser `QueryMiddlewareContext` pour le typage
2. **Modification du contexte** : Les middlewares peuvent modifier `context.user`, `context.scopes`, et `context.data`
3. **Gestion d'erreurs** : Utiliser try/catch pour gérer les erreurs dans les middlewares
4. **Performance** : Éviter les opérations coûteuses dans les middlewares fréquemment appelés
5. **Ordre d'exécution** : Considérer l'ordre des middlewares car ils s'exécutent séquentiellement

## Migration depuis `middleware`

Si vous utilisez l'ancienne syntaxe `middleware`, changez simplement :

```typescript
// Avant
middleware: [/* ... */]

// Après
middlewares: [/* ... */]
```

Le reste de la structure reste identique.