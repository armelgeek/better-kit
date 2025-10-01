# Client-Side Features Guide

This guide covers all the enhanced client-side features added to Better Query:

1. **Client-side caching** with multiple strategies
2. **Centralized error handling**
3. **Optimistic updates** for mutations
4. **Automatic refetch** (focus, reconnect, interval)
5. **Pagination and infinite scroll**

## Table of Contents

- [Installation](#installation)
- [Client-Side Caching](#client-side-caching)
- [Error Handling](#error-handling)
- [Optimistic Updates](#optimistic-updates)
- [Automatic Refetch](#automatic-refetch)
- [Pagination & Infinite Scroll](#pagination--infinite-scroll)
- [Complete Example](#complete-example)

## Installation

No additional installation is required. These features are included in the `better-query` package.

```bash
npm install better-query
# or
pnpm add better-query
# or
yarn add better-query
```

## Client-Side Caching

### Overview

Client-side caching reduces server load, speeds up UI, and improves reactivity by storing responses locally.

### Cache Strategies

- **`cache-first`**: Check cache first, fallback to network
- **`network-first`**: Check network first, fallback to cache on error
- **`cache-only`**: Only use cache (throws error if not cached)
- **`network-only`**: Always fetch from network, but update cache
- **`stale-while-revalidate`**: Return cache immediately, fetch in background
- **`no-cache`**: Disable caching completely

### Setup

```typescript
import { createReactQueryClient } from "better-query/react";
import { cacheClientPlugin } from "better-query/client";

const client = createReactQueryClient({
  baseURL: "http://localhost:3000/api/query",
  queryPlugins: [
    cacheClientPlugin({
      enabled: true,
      defaultTTL: 300, // 5 minutes default TTL
      defaultStrategy: "cache-first",
      resources: {
        // Configure per-resource caching
        product: {
          enabled: true,
          ttl: 600, // 10 minutes
          strategy: "cache-first",
        },
        order: {
          enabled: true,
          ttl: 60, // 1 minute - frequently changing data
          strategy: "network-first",
        },
      },
    }),
  ],
});
```

### Using Cache in Hooks

```typescript
import { useRead } from "better-query/react";

function ProductDetails({ productId }) {
  const { data, loading, error } = useRead(
    client,
    "product",
    productId,
    {
      // Override default cache strategy
      cacheStrategy: "stale-while-revalidate",
    }
  );

  return (
    <div>
      {loading && <div>Loading...</div>}
      {data && <div>{data.name}</div>}
    </div>
  );
}
```

### Cache Management

```typescript
// Invalidate all cache
await client.cacheClient.invalidate();

// Invalidate specific resource
await client.cacheClient.invalidate("bq-cache:product:*");

// Get cache statistics
const stats = await client.cacheClient.getStats();
console.log(stats); // { size: 10, keys: [...] }

// Clear all cache
await client.cacheClient.clearCache();

// Manually set cache
await client.cacheClient.setCache("my-key", data, 300);

// Manually get cache
const cached = await client.cacheClient.getCache("my-key");
```

## Error Handling

### Overview

Centralized error handling prevents silent crashes and provides consistent user feedback.

### Setup

```typescript
import { ErrorProvider, ErrorBoundary } from "better-query/react";

function App() {
  return (
    <ErrorProvider
      options={{
        logErrors: true,
        errorReporter: (error) => {
          // Send to Sentry, LogRocket, etc.
          console.log("Error:", error);
        },
        onError: (error) => {
          // Global error handler
          if (error.type === "AUTHORIZATION") {
            // Redirect to login
          }
        },
        maxErrorHistory: 20,
      }}
    >
      <ErrorBoundary
        fallback={(error) => (
          <div>
            <h1>Something went wrong</h1>
            <p>{error.message}</p>
          </div>
        )}
      >
        <YourApp />
      </ErrorBoundary>
    </ErrorProvider>
  );
}
```

### Using Error Handler

```typescript
import { useErrorHandler } from "better-query/react";

function MyComponent() {
  const { errors, lastError, clearError, clearErrors, handleError } = useErrorHandler();

  const handleAction = async () => {
    try {
      // Your async operation
      await someOperation();
    } catch (error) {
      // Report error with context
      handleError(error, {
        resource: "product",
        operation: "create",
      });
    }
  };

  return (
    <div>
      {lastError && (
        <div className="error">
          <strong>{lastError.type}:</strong> {lastError.message}
          <button onClick={() => clearError(lastError.timestamp)}>
            Dismiss
          </button>
        </div>
      )}
      
      {/* Display all errors */}
      {errors.map((error) => (
        <div key={error.timestamp}>
          {error.message}
        </div>
      ))}
    </div>
  );
}
```

### Error Types

```typescript
enum ErrorType {
  NETWORK = "NETWORK",
  VALIDATION = "VALIDATION",
  AUTHORIZATION = "AUTHORIZATION",
  NOT_FOUND = "NOT_FOUND",
  SERVER = "SERVER",
  UNKNOWN = "UNKNOWN",
}
```

## Optimistic Updates

### Overview

Optimistic updates immediately reflect changes in the UI before server confirmation, improving perceived performance.

### Create with Optimistic Update

```typescript
import { useCreate } from "better-query/react";

function CreateProductForm() {
  const { create, loading, optimisticUpdate } = useCreate(
    client,
    "product",
    {
      optimistic: true,
      // Generate optimistic data
      optimisticData: (variables) => ({
        id: `temp-${Date.now()}`,
        ...variables,
        createdAt: new Date(),
      }),
      onSuccess: (data) => {
        console.log("Created:", data);
      },
      onError: (error) => {
        console.error("Failed:", error);
      },
    }
  );

  const handleSubmit = async (data) => {
    await create(data);
  };

  return (
    <div>
      {optimisticUpdate && (
        <div className="creating">
          Creating: {optimisticUpdate.name}...
        </div>
      )}
      {/* Form UI */}
    </div>
  );
}
```

### Update with Optimistic Update

```typescript
import { useUpdate } from "better-query/react";

function EditProduct({ productId, currentData }) {
  const { update, loading, optimisticUpdate } = useUpdate(
    client,
    "product",
    {
      optimistic: true,
      optimisticData: (variables) => ({
        ...currentData,
        ...variables.data,
        updatedAt: new Date(),
      }),
    }
  );

  const handleUpdate = async (updates) => {
    await update(productId, updates);
  };

  // Use optimistic data if available
  const displayData = optimisticUpdate || currentData;

  return <div>{displayData.name}</div>;
}
```

### Delete with Optimistic Update

```typescript
import { useDelete } from "better-query/react";

function DeleteButton({ productId }) {
  const { delete: deleteProduct, deletedId } = useDelete(
    client,
    "product",
    {
      optimistic: true,
    }
  );

  const handleDelete = async () => {
    await deleteProduct(productId);
  };

  if (deletedId === productId) {
    return <div className="deleting">Deleting...</div>;
  }

  return <button onClick={handleDelete}>Delete</button>;
}
```

## Automatic Refetch

### Overview

Keep data fresh automatically without manual intervention.

### Refetch on Focus

```typescript
import { useRead } from "better-query/react";

function ProductDetails({ productId }) {
  const { data, isStale } = useRead(
    client,
    "product",
    productId,
    {
      // Refetch when window gains focus
      refetchOnFocus: true,
      // Data considered stale after 5 minutes
      staleTime: 300000,
    }
  );

  return (
    <div>
      {data?.name}
      {isStale && <span>Data is stale</span>}
    </div>
  );
}
```

### Refetch on Reconnect

```typescript
const { data } = useList(
  client,
  "product",
  { page: 1, limit: 20 },
  {
    // Refetch when network reconnects
    refetchOnReconnect: true,
  }
);
```

### Interval Refetch

```typescript
const { data } = useRead(
  client,
  "product",
  productId,
  {
    // Refetch every 30 seconds
    refetchInterval: 30000,
  }
);
```

### Retry on Error

```typescript
const { data, error } = useRead(
  client,
  "product",
  productId,
  {
    // Retry 3 times on error
    retry: 3,
    // Wait 1 second between retries
    retryDelay: 1000,
  }
);
```

## Pagination & Infinite Scroll

### Standard Pagination

```typescript
import { useList } from "better-query/react";

function ProductList() {
  const [page, setPage] = useState(1);
  
  const { data, loading, error } = useList(
    client,
    "product",
    {
      page,
      limit: 20,
      sortBy: "createdAt",
      sortOrder: "desc",
    }
  );

  return (
    <div>
      {data?.items?.map((product) => (
        <div key={product.id}>{product.name}</div>
      ))}
      
      {data?.pagination && (
        <div>
          <button
            onClick={() => setPage(page - 1)}
            disabled={!data.pagination.hasPrev}
          >
            Previous
          </button>
          <span>
            Page {data.pagination.page} of {data.pagination.totalPages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={!data.pagination.hasNext}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
```

### Infinite Scroll

```typescript
import { useInfiniteList } from "better-query/react";
import { useEffect, useRef } from "react";

function InfiniteProductList() {
  const { data, loading, hasMore, fetchNextPage, reset } = useInfiniteList(
    client,
    "product",
    {
      sortBy: "createdAt",
      sortOrder: "desc",
    },
    {
      pageSize: 20,
    }
  );

  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!observerRef.current || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 1.0 }
    );

    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, fetchNextPage]);

  return (
    <div>
      {data.map((product) => (
        <div key={product.id}>{product.name}</div>
      ))}
      
      {hasMore && (
        <div ref={observerRef}>
          {loading ? "Loading more..." : "Scroll for more"}
        </div>
      )}
      
      <button onClick={reset}>Reset</button>
    </div>
  );
}
```

## Complete Example

See [client-features-example.tsx](../src/client-features-example.tsx) for a complete working example that demonstrates all features together.

## API Reference

### Enhanced Hooks

#### `useRead`

```typescript
function useRead<T>(
  client: ReactQueryClient<T>,
  resourceName: string,
  id?: string,
  options?: UseQueryOptions
): {
  data: any;
  loading: boolean;
  error: any;
  isStale: boolean;
  refetch: () => Promise<any>;
  read: (id?: string, opts?: any) => Promise<any>;
}
```

#### `useList`

```typescript
function useList<T>(
  client: ReactQueryClient<T>,
  resourceName: string,
  params?: any,
  options?: UseQueryOptions
): {
  data: any;
  loading: boolean;
  error: any;
  isStale: boolean;
  refetch: () => Promise<any>;
  list: (params?: any, opts?: any) => Promise<any>;
}
```

#### `useCreate`

```typescript
function useCreate<T>(
  client: ReactQueryClient<T>,
  resourceName: string,
  options?: UseMutationOptions
): {
  create: (data: any, opts?: any) => Promise<any>;
  loading: boolean;
  error: any;
  optimisticUpdate: any;
}
```

#### `useUpdate`

```typescript
function useUpdate<T>(
  client: ReactQueryClient<T>,
  resourceName: string,
  options?: UseMutationOptions
): {
  update: (id: string, data: any, opts?: any) => Promise<any>;
  loading: boolean;
  error: any;
  optimisticUpdate: any;
}
```

#### `useDelete`

```typescript
function useDelete<T>(
  client: ReactQueryClient<T>,
  resourceName: string,
  options?: UseMutationOptions
): {
  delete: (id: string, opts?: any) => Promise<any>;
  loading: boolean;
  error: any;
  deletedId: string | null;
}
```

#### `useInfiniteList`

```typescript
function useInfiniteList<T>(
  client: ReactQueryClient<T>,
  resourceName: string,
  baseParams?: any,
  options?: UseQueryOptions & { pageSize?: number }
): {
  data: any[];
  loading: boolean;
  error: any;
  hasMore: boolean;
  fetchNextPage: () => Promise<any>;
  reset: () => void;
}
```

### Options Types

```typescript
interface UseQueryOptions {
  enabled?: boolean;
  refetchOnFocus?: boolean;
  refetchOnReconnect?: boolean;
  refetchInterval?: number;
  staleTime?: number;
  retry?: number;
  retryDelay?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

interface UseMutationOptions<TData = any, TVariables = any> {
  optimistic?: boolean;
  optimisticData?: (variables: TVariables) => TData;
  invalidateQueries?: string[];
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: any, variables: TVariables) => void;
  onSettled?: (data: TData | undefined, error: any, variables: TVariables) => void;
}
```

## Best Practices

1. **Caching**: Use `cache-first` for rarely changing data, `network-first` for frequently updated data
2. **Error Handling**: Always wrap your app with `ErrorProvider` for consistent error tracking
3. **Optimistic Updates**: Use for better UX on mutations, but ensure proper error handling
4. **Refetch**: Enable `refetchOnFocus` for dashboards and data-heavy apps
5. **Infinite Scroll**: Use `useInfiniteList` with Intersection Observer for best performance

## Migration Guide

If you're using the old hooks, here's how to migrate:

### Before

```typescript
const hooks = useQuery(client);
const { data, loading } = hooks.useRead("product", productId);
```

### After

```typescript
const { data, loading, refetch, isStale } = useRead(
  client,
  "product",
  productId,
  {
    refetchOnFocus: true,
    staleTime: 300000,
  }
);
```

## Performance Tips

1. Set appropriate `staleTime` to avoid unnecessary refetches
2. Use `optimistic` updates for instant UI feedback
3. Enable caching for read-heavy operations
4. Use `pageSize` wisely in infinite scroll (20-50 items recommended)
5. Consider using `stale-while-revalidate` for best UX
