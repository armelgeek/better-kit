# Realtime Plugin

Sync client state globally over WebSockets in realtime. Subscribe and react to database changes, milliseconds after they happen.

## Features

- 🔄 **Database Change Listeners** - Listen to inserts, updates, and deletes
- 👥 **Presence Tracking** - Store and synchronize online user state across clients
- 📡 **Channel Broadcasting** - Send data to any client subscribed to the same channel
- 🔐 **Authentication Support** - Custom authentication for WebSocket connections
- 💓 **Health Monitoring** - Automatic heartbeat and reconnection
- 📊 **Type-Safe** - Full TypeScript support with type inference

## Installation

The realtime plugin is included in `better-query`:

```bash
npm install better-query ws
# or
pnpm add better-query ws
# or
yarn add better-query ws
```

For TypeScript, also install types:

```bash
npm install -D @types/ws
```

## Quick Start

### Server Setup

```typescript
import { betterQuery } from "better-query";
import { realtimePlugin } from "better-query/plugins";

const query = betterQuery({
  database: {
    provider: "sqlite",
    url: "./database.db",
  },
  resources: [
    // Your resources
  ],
  plugins: [
    realtimePlugin({
      enabled: true,
      port: 3001,
      path: "/realtime",
    }),
  ],
});
```

### Client Setup

```typescript
import { createQueryClient, realtimeClient } from "better-query/client";

const client = createQueryClient<typeof query>({
  baseURL: "http://localhost:3000",
  queryPlugins: [
    realtimeClient({
      wsUrl: "ws://localhost:3001/realtime",
    }),
  ],
});

// Connect to realtime
await client.realtime.connect();

// Subscribe to database changes
await client.realtime.subscribeToResource("post", (event) => {
  console.log("Post changed:", event);
});
```

## Usage Examples

### 1. Database Change Subscriptions

Subscribe to all changes for a resource:

```typescript
const unsubscribe = await client.realtime.subscribeToResource(
  "post",
  (event) => {
    if (event.operation === "create") {
      console.log("New post:", event.data);
    } else if (event.operation === "update") {
      console.log("Updated post:", event.data);
    } else if (event.operation === "delete") {
      console.log("Deleted post:", event.id);
    }
  }
);

// Unsubscribe when done
unsubscribe();
```

### 2. Record-Level Subscriptions

Subscribe to changes for a specific record:

```typescript
const unsubscribe = await client.realtime.subscribeToRecord(
  "post",
  "post-123",
  (event) => {
    console.log("This post changed:", event);
  }
);
```

### 3. Presence Tracking

Track online users in real-time:

```typescript
// Subscribe to presence updates
await client.realtime.subscribeToPresence(
  "resource:post",
  (event) => {
    console.log(`${event.userId} ${event.action}ed`);
    console.log("Online users:", event.onlineUsers);
  }
);

// Get online users reactively
client.realtime.atoms.onlineUsers.subscribe((usersByChannel) => {
  const users = usersByChannel.get("resource:post") || [];
  console.log("Users viewing posts:", users);
});
```

### 4. Custom Channel Broadcasting

Create custom channels for app-specific features:

```typescript
// Subscribe to a custom channel
await client.realtime.subscribe("notifications", (message) => {
  console.log("Notification:", message.payload);
});

// Broadcast to the channel
await client.realtime.broadcast("notifications", {
  type: "alert",
  message: "New feature available!",
});
```

### 5. Connection State Management

Monitor connection status reactively:

```typescript
client.realtime.atoms.connectionState.subscribe((state) => {
  // state: "disconnected" | "connecting" | "connected" | "reconnecting"
  console.log("Connection state:", state);
});
```

### 6. React Integration

```typescript
import { useEffect, useState } from "react";

function PostsComponent() {
  const [posts, setPosts] = useState([]);
  const [online, setOnline] = useState(0);
  
  useEffect(() => {
    client.realtime.connect();
    
    const unsub1 = client.realtime.subscribeToResource("post", (event) => {
      if (event.operation === "create") {
        setPosts(prev => [...prev, event.data]);
      }
    });
    
    const unsub2 = client.realtime.atoms.onlineUsers.subscribe(users => {
      setOnline(users.get("resource:post")?.length || 0);
    });
    
    return () => {
      unsub1();
      unsub2();
      client.realtime.disconnect();
    };
  }, []);
  
  return (
    <div>
      <p>Online: {online} users</p>
      {posts.map(post => <div key={post.id}>{post.title}</div>)}
    </div>
  );
}
```

## Server Plugin Options

```typescript
realtimePlugin({
  // Enable/disable the plugin
  enabled: true,
  
  // WebSocket server instance (optional - plugin creates one if not provided)
  wss: myWebSocketServer,
  
  // Port for WebSocket server (if creating new server)
  port: 3001,
  
  // Path for WebSocket endpoint
  path: "/realtime",
  
  // Resources to broadcast changes for (empty = all)
  resources: ["post", "comment"],
  
  // Broadcast user presence (join/leave events)
  broadcastPresence: true,
  
  // Custom authentication
  authenticate: async (request) => {
    const token = getTokenFromRequest(request);
    const user = await validateToken(token);
    return user ? { userId: user.id, ...user } : null;
  },
  
  // Heartbeat interval in milliseconds
  heartbeatInterval: 30000,
  
  // Maximum reconnection attempts
  maxReconnectAttempts: 5,
})
```

## Client Plugin Options

```typescript
realtimeClient({
  // WebSocket URL (auto-inferred from baseURL if not provided)
  wsUrl: "ws://localhost:3001/realtime",
  
  // Auto-reconnect on disconnect
  autoReconnect: true,
  
  // Maximum reconnection attempts
  maxReconnectAttempts: 5,
  
  // Reconnection delay in milliseconds
  reconnectDelay: 1000,
  
  // Heartbeat interval
  heartbeatInterval: 30000,
  
  // Authentication token or function
  auth: "your-token",
  // or
  auth: async () => await getAuthToken(),
  
  // Enable debug logging
  debug: true,
})
```

## REST Endpoints

The plugin automatically adds these endpoints:

### Get Realtime Stats
```
GET /realtime/stats
```

Returns connection statistics:
```json
{
  "connected": 5,
  "channels": [
    {
      "name": "resource:post",
      "clients": 3,
      "onlineUsers": [...]
    }
  ]
}
```

### Get Channel Users
```
GET /realtime/channel/users?channel=resource:post
```

Returns online users in a channel:
```json
{
  "channel": "resource:post",
  "users": [...],
  "count": 3
}
```

### Broadcast to Channel (Server-Side)
```
POST /realtime/broadcast
{
  "channel": "notifications",
  "payload": { "message": "Hello!" }
}
```

## Message Types

The plugin uses these WebSocket message types:

- `subscribe` - Subscribe to a channel
- `unsubscribe` - Unsubscribe from a channel
- `data_change` - Database change event
- `presence_update` - User join/leave event
- `broadcast` - Custom broadcast message
- `heartbeat` - Connection health check
- `error` - Error message

## Channels

Channels follow these patterns:

- `resource:{name}` - All changes for a resource (e.g., `resource:post`)
- `{resource}:{id}` - Specific record changes (e.g., `post:123`)
- Custom channels - Any string you define

## TypeScript Support

The plugin is fully typed with TypeScript:

```typescript
import type {
  RealtimePluginOptions,
  RealtimeClientOptions,
  RealtimeMessage,
  DataChangeEvent,
  PresenceUpdateEvent,
  ConnectionState,
} from "better-query/plugins";
```

## Examples

See [realtime-example.ts](./realtime-example.ts) for comprehensive usage examples.

## Production Considerations

### Scaling

For production applications, consider:

1. **Use a dedicated WebSocket server** (separate process)
2. **Use Redis** for pub/sub between multiple server instances
3. **Implement rate limiting** on subscriptions
4. **Add proper authentication** and authorization
5. **Monitor connection counts** and resource usage

### Security

1. Always implement authentication
2. Validate channel access per user
3. Sanitize messages before broadcasting
4. Use WSS (WebSocket Secure) in production
5. Implement rate limiting for broadcasts

### Performance

1. Limit the number of subscriptions per client
2. Use specific record subscriptions when possible
3. Debounce rapid updates
4. Consider pagination for large user lists
5. Monitor WebSocket connection limits

## License

MIT
