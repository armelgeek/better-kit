# Realtime Plugin - Quick Reference

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Better Query Server                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐        ┌─────────────────────────────────┐   │
│  │   Database   │◄───────┤  Realtime Plugin (Hooks)        │   │
│  │   (SQLite)   │        │  - afterCreate                   │   │
│  │              │        │  - afterUpdate                   │   │
│  └──────────────┘        │  - afterDelete                   │   │
│         ▲                └─────────────────────────────────┘   │
│         │                           │                            │
│         │ CRUD Operations           │ Broadcasts                │
│         │                           ▼                            │
│  ┌──────────────┐        ┌─────────────────────────────────┐   │
│  │ HTTP REST    │        │  WebSocket Server (Port 3001)   │   │
│  │ Endpoints    │        │  - Channel Manager               │   │
│  └──────────────┘        │  - Connection Pool               │   │
│                          │  - Presence Tracking             │   │
│                          └─────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    │ WebSocket Connection
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Client Application                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────┐                            │
│  │  Realtime Client Plugin         │                            │
│  │  - WebSocket Connection         │                            │
│  │  - Auto-reconnection            │                            │
│  │  - Subscription Manager         │                            │
│  └─────────────────────────────────┘                            │
│                  │                                                │
│                  │ Updates                                        │
│                  ▼                                                │
│  ┌─────────────────────────────────┐                            │
│  │  Reactive State (Atoms)         │                            │
│  │  - connectionState              │                            │
│  │  - onlineUsers                  │                            │
│  └─────────────────────────────────┘                            │
│                  │                                                │
│                  │ Subscriptions                                 │
│                  ▼                                                │
│  ┌─────────────────────────────────┐                            │
│  │  UI Components (React/Vue/etc)  │                            │
│  │  - Auto-update on changes       │                            │
│  │  - Display online users         │                            │
│  └─────────────────────────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
```

## Channel Patterns

### 1. Resource Channels
Subscribe to all changes for a resource type:
```
Channel: "resource:post"
Events: create, update, delete operations on ANY post
```

### 2. Record Channels
Subscribe to changes for a specific record:
```
Channel: "post:123"
Events: update, delete operations on post with id "123"
```

### 3. Custom Channels
Subscribe to custom application events:
```
Channel: "notifications"
Events: custom messages broadcast by server or clients
```

## Message Flow

### Database Change Flow
```
1. Client A creates a post via REST API
   └─> POST /posts { title: "Hello" }

2. Server creates record in database
   └─> INSERT INTO posts ...

3. Realtime plugin afterCreate hook triggers
   └─> Broadcasts to "resource:post" channel

4. All subscribed clients receive update
   └─> Client B, C, D receive { operation: "create", data: {...} }

5. Clients update their local state
   └─> UI auto-refreshes with new post
```

### Presence Flow
```
1. Client A connects and subscribes to "resource:post"
   └─> WebSocket connection established
   └─> Send: { type: "subscribe", channel: "resource:post" }

2. Server broadcasts presence update
   └─> Send to channel: { type: "presence_update", action: "join", userId: "A" }

3. All clients receive presence update
   └─> Client B, C update their online user list

4. Client A disconnects
   └─> Server broadcasts: { type: "presence_update", action: "leave", userId: "A" }
```

## Common Use Cases

### 1. Collaborative Editing
```typescript
// Subscribe to document changes
await client.realtime.subscribeToRecord("document", docId, (event) => {
  if (event.operation === "update") {
    // Merge changes from other users
    updateEditor(event.data);
  }
});
```

### 2. Live Notifications
```typescript
// Subscribe to notification channel
await client.realtime.subscribe("notifications", (message) => {
  showNotification(message.payload);
});
```

### 3. Live Dashboard
```typescript
// Subscribe to resource changes
await client.realtime.subscribeToResource("order", (event) => {
  if (event.operation === "create") {
    // Update order count in real-time
    incrementOrderCount();
  }
});
```

### 4. Chat Application
```typescript
// Subscribe to room channel
await client.realtime.subscribe(`chat:${roomId}`, (message) => {
  if (message.type === "broadcast") {
    addMessageToUI(message.payload);
  }
});

// Send message
await client.realtime.broadcast(`chat:${roomId}`, {
  text: "Hello!",
  from: currentUser.id,
});
```

### 5. Live User Presence
```typescript
// Track who's viewing a document
client.realtime.atoms.onlineUsers.subscribe((usersByChannel) => {
  const viewers = usersByChannel.get(`document:${docId}`) || [];
  updateViewersList(viewers);
});
```

## API Quick Reference

### Server Plugin Options
```typescript
realtimePlugin({
  enabled: true,              // Enable/disable plugin
  port: 3001,                 // WebSocket server port
  path: "/realtime",          // WebSocket endpoint path
  resources: ["post"],        // Resources to broadcast (empty = all)
  broadcastPresence: true,    // Track user presence
  authenticate: async (req) => {...}, // Auth handler
  heartbeatInterval: 30000,   // Heartbeat frequency (ms)
  maxReconnectAttempts: 5,    // Max reconnection attempts
})
```

### Client Plugin Options
```typescript
realtimeClient({
  wsUrl: "ws://localhost:3001/realtime", // WebSocket URL
  autoReconnect: true,        // Auto-reconnect on disconnect
  maxReconnectAttempts: 5,    // Max reconnection attempts
  reconnectDelay: 1000,       // Delay between reconnects (ms)
  heartbeatInterval: 30000,   // Heartbeat frequency (ms)
  auth: "token",              // Auth token or function
  debug: false,               // Enable debug logging
})
```

### Client Actions
```typescript
// Connection
await client.realtime.connect()
await client.realtime.disconnect()

// Subscriptions
await client.realtime.subscribe(channel, callback)
await client.realtime.subscribeToResource(resource, callback)
await client.realtime.subscribeToRecord(resource, id, callback)
await client.realtime.subscribeToPresence(channel, callback)

// Broadcasting
await client.realtime.broadcast(channel, payload)

// State
await client.realtime.getConnectionState()
await client.realtime.getOnlineUsers(channel)

// Atoms
client.realtime.atoms.connectionState  // Reactive connection state
client.realtime.atoms.onlineUsers      // Reactive online users map
```

### REST Endpoints
```typescript
// Get stats
GET /realtime/stats
// => { connected: 5, channels: [...] }

// Get channel users
GET /realtime/channel/users?channel=resource:post
// => { channel: "...", users: [...], count: 3 }

// Broadcast (server-side)
POST /realtime/broadcast
// { "channel": "...", "payload": {...} }
```

## Performance Tips

1. **Use specific subscriptions** - Subscribe to specific records instead of entire resources when possible
2. **Debounce updates** - Avoid updating UI on every single change
3. **Limit subscriptions** - Don't subscribe to channels you don't need
4. **Clean up** - Always unsubscribe when components unmount
5. **Monitor connections** - Use stats endpoint to monitor active connections

## Security Best Practices

1. **Always authenticate** - Implement proper authentication
2. **Validate permissions** - Check user permissions before broadcasting
3. **Use WSS in production** - Enable secure WebSocket (wss://)
4. **Rate limiting** - Implement rate limits for broadcasts
5. **Sanitize data** - Never trust client-sent data

## Troubleshooting

### Connection Issues
```typescript
// Check connection state
client.realtime.atoms.connectionState.subscribe((state) => {
  if (state === "disconnected") {
    console.log("Disconnected - check network");
  }
});
```

### Not Receiving Updates
- Verify subscription was successful
- Check channel name matches
- Ensure server plugin is enabled
- Check WebSocket URL is correct

### High Memory Usage
- Too many subscriptions
- Not cleaning up subscriptions
- Large payloads being broadcast
- Monitor with `/realtime/stats` endpoint
