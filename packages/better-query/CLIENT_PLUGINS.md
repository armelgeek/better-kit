# Better Query Client Plugins

Client plugins allow you to extend the better-query client with custom functionality that mirrors server plugins. This enables type-safe client-side methods, reactive state management, and seamless integration with your server endpoints.

## Overview

Client plugins provide:

- **Type Safety**: Infer types from server plugins for complete type safety
- **Custom Actions**: Define client-side methods that call your plugin endpoints
- **Reactive State**: Manage reactive state with atoms (compatible with nanostores)
- **HTTP Method Overrides**: Control which HTTP methods are used for specific paths
- **Atom Listeners**: Setup reactive listeners for automatic state updates

## Basic Usage

### 1. Define Your Server Plugin

```typescript
import { createPlugin, createQueryEndpoint } from "better-query";

export const analyticsPlugin = () =>
  createPlugin({
    id: "analytics",
    endpoints: {
      getStats: createQueryEndpoint(
        "/analytics/stats",
        { method: "GET" },
        async (ctx) => {
          return ctx.json({
            totalUsers: 1000,
            activeUsers: 250,
          });
        }
      ),
    },
  });
```

### 2. Create Your Client Plugin

```typescript
import type { BetterQueryClientPlugin } from "better-query/client";
import type { analyticsPlugin } from "./server-plugin";

export const analyticsClientPlugin = (): BetterQueryClientPlugin => {
  return {
    id: "analytics",
    
    // Infer types from server plugin
    $InferServerPlugin: {} as ReturnType<typeof analyticsPlugin>,
    
    // Define custom client actions
    getActions: ($fetch) => ({
      getStats: async (fetchOptions?) => {
        return $fetch("/analytics/stats", {
          method: "GET",
          ...fetchOptions,
        });
      },
    }),
  };
};
```

### 3. Use with Query Client

```typescript
import { createQueryClient } from "better-query/client";
import { analyticsClientPlugin } from "./client-plugin";

const queryClient = createQueryClient({
  baseURL: "http://localhost:3000/api",
  queryPlugins: [analyticsClientPlugin()],
});

// Access plugin methods via camelCase plugin id
// queryClient.analytics.getStats()
```

## Client Plugin Interface

```typescript
interface BetterQueryClientPlugin {
  /** Unique plugin identifier (must match server plugin) */
  id: string;

  /** Infer types from server plugin */
  $InferServerPlugin?: Plugin;

  /** Define custom client methods */
  getActions?: ($fetch: any) => Record<string, (...args: any[]) => Promise<any>>;

  /** Define reactive state atoms */
  getAtoms?: ($fetch: any) => Record<string, Atom<any>>;

  /** Override HTTP methods for specific paths */
  pathMethods?: Record<string, "GET" | "POST">;

  /** Better-fetch plugins to apply */
  fetchPlugins?: BetterFetchPlugin[];

  /** Setup atom listeners for reactive updates */
  atomListeners?: (atoms: Record<string, Atom<any>>, $fetch: any) => void;
}
```

## Advanced Features

### Custom Actions with Type Safety

```typescript
export const notificationClientPlugin = (): BetterQueryClientPlugin => {
  return {
    id: "notifications",
    getActions: ($fetch) => ({
      send: async (
        data: {
          title: string;
          message: string;
          type?: "info" | "success" | "warning" | "error";
        },
        fetchOptions?: BetterFetchOption
      ) => {
        return $fetch("/notifications/send", {
          method: "POST",
          body: data,
          ...fetchOptions,
        });
      },
      
      getUnreadCount: async (fetchOptions?: BetterFetchOption) => {
        return $fetch("/notifications/unread-count", {
          method: "GET",
          ...fetchOptions,
        });
      },
    }),
  };
};
```

### Reactive State with Atoms

```typescript
import { atom } from "nanostores";

export const authClientPlugin = (): BetterQueryClientPlugin => {
  return {
    id: "auth",
    
    getAtoms: ($fetch) => ({
      session: atom<{ user: any; token: string } | null>(null),
      isAuthenticated: atom<boolean>(false),
    }),
    
    atomListeners: (atoms, $fetch) => {
      // Check session on initialization
      $fetch("/auth/session", { method: "GET" }).then((result) => {
        if (result.data) {
          atoms.session.set(result.data);
          atoms.isAuthenticated.set(true);
        }
      });
      
      // Setup automatic refresh
      setInterval(() => {
        $fetch("/auth/session", { method: "GET" }).then((result) => {
          if (result.data) {
            atoms.session.set(result.data);
          }
        });
      }, 60000); // Refresh every minute
    },
    
    getActions: ($fetch) => ({
      login: async (data: { email: string; password: string }) => {
        const result = await $fetch("/auth/login", {
          method: "POST",
          body: data,
        });
        
        // Update atoms on successful login
        if (result.data) {
          // Get atoms and update them
        }
        
        return result;
      },
      
      logout: async () => {
        const result = await $fetch("/auth/logout", {
          method: "POST",
        });
        
        // Clear atoms on logout
        if (!result.error) {
          // Get atoms and clear them
        }
        
        return result;
      },
    }),
  };
};
```

### HTTP Method Overrides

By default, endpoints without a body use GET, and endpoints with a body use POST. You can override this:

```typescript
export const myClientPlugin = (): BetterQueryClientPlugin => {
  return {
    id: "my-plugin",
    
    pathMethods: {
      "/my-plugin/special-get": "POST",  // Force POST even if no body
      "/my-plugin/special-post": "GET",  // Force GET even with body
    },
    
    getActions: ($fetch) => ({
      specialGet: async () => {
        return $fetch("/my-plugin/special-get", {
          method: "POST", // Matches pathMethods
        });
      },
    }),
  };
};
```

## Best Practices

### 1. Match Server Plugin IDs

Always ensure your client plugin `id` matches the server plugin `id`:

```typescript
// Server
const myPlugin = () => createPlugin({ id: "my-plugin", ... });

// Client
const myClientPlugin = (): BetterQueryClientPlugin => ({
  id: "my-plugin", // Must match server
  ...
});
```

### 2. Use Type Inference

Always infer types from the server plugin for type safety:

```typescript
export const myClientPlugin = (): BetterQueryClientPlugin => ({
  id: "my-plugin",
  $InferServerPlugin: {} as ReturnType<typeof myServerPlugin>,
  ...
});
```

### 3. Follow Action Pattern

Each action should accept data as the first parameter and optional fetch options as the second:

```typescript
getActions: ($fetch) => ({
  myAction: async (
    data: { field: string },
    fetchOptions?: BetterFetchOption
  ) => {
    return $fetch("/path", {
      method: "POST",
      body: data,
      ...fetchOptions,
    });
  },
});
```

### 4. Handle Errors Consistently

Always return objects with `data` and `error` keys:

```typescript
getActions: ($fetch) => ({
  myAction: async (data: { field: string }) => {
    try {
      return await $fetch("/path", {
        method: "POST",
        body: data,
      });
    } catch (error) {
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : "Unknown error",
        },
      };
    }
  },
});
```

## Examples

See the following files for complete examples:

- `examples/client-plugin-example.ts` - Comprehensive examples with analytics, notifications, and auth plugins
- `src/client/client-plugins.test.ts` - Unit tests showing plugin usage
- `src/client/client-plugins.integration.test.ts` - Integration tests

## Plugin ID to CamelCase Conversion

Plugin IDs are converted from kebab-case to camelCase when accessed from the client:

```typescript
// Plugin with id "my-custom-plugin"
const plugin: BetterQueryClientPlugin = {
  id: "my-custom-plugin",
  getActions: ($fetch) => ({
    doSomething: async () => { ... },
  }),
};

// Accessed as: queryClient.myCustomPlugin.doSomething()
```

## Integration with React

When using with React, you can combine client plugins with React hooks:

```typescript
import { useStore } from "@nanostores/react";
import { authClientPlugin } from "./client-plugin";

const auth = authClientPlugin();
const atoms = auth.getAtoms!($fetch);

function MyComponent() {
  const session = useStore(atoms.session);
  const isAuthenticated = useStore(atoms.isAuthenticated);
  
  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome, {session?.user.name}</p>
      ) : (
        <p>Please log in</p>
      )}
    </div>
  );
}
```

## Troubleshooting

### Plugin not accessible

Make sure:
1. The plugin `id` matches between server and client
2. The plugin is added to the `queryPlugins` array
3. You're using the camelCase version of the plugin id

### Type errors

Ensure you're using `$InferServerPlugin` to get proper type inference:

```typescript
$InferServerPlugin: {} as ReturnType<typeof myServerPlugin>
```

### Atoms not reactive

Check that:
1. `getAtoms` is implemented correctly
2. `atomListeners` is setting up subscriptions properly
3. You're using a compatible atom implementation (like nanostores)

## Further Reading

- [Better Query Plugin System](../PLUGINS.md)
- [Better Fetch Documentation](https://better-fetch.vercel.app)
- [Nanostores Documentation](https://github.com/nanostores/nanostores)
