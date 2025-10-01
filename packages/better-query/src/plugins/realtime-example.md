/**
 * Example: Using the Realtime Plugin
 * 
 * This demonstrates how to use WebSocket-based realtime synchronization
 * to broadcast database changes and manage online user state.
 */

```typescript
// ============================================================================
// SERVER SETUP
// ============================================================================

import { betterQuery } from "better-query";
import { realtimePlugin } from "better-query/plugins";
import { z } from "zod";

// Create the query server with realtime plugin
const query = betterQuery({
	database: {
		provider: "sqlite",
		url: "./database.db",
	},
	resources: [
		{
			name: "post",
			schema: z.object({
				id: z.string().optional(),
				title: z.string(),
				content: z.string(),
				published: z.boolean().default(false),
				createdAt: z.date().optional(),
				updatedAt: z.date().optional(),
			}),
		},
	],
	plugins: [
		realtimePlugin({
			// Enable realtime sync
			enabled: true,
			
			// WebSocket server port (separate from HTTP)
			port: 3001,
			
			// Path for WebSocket endpoint
			path: "/realtime",
			
			// Broadcast presence updates when users join/leave channels
			broadcastPresence: true,
			
			// Only broadcast changes for specific resources (optional)
			resources: ["post"], // Empty array = all resources
			
			// Custom authentication (optional)
			authenticate: async (request) => {
				// Extract token from URL query or headers
				const url = new URL(request.url || "");
				const token = url.searchParams.get("token");
				
				// Validate token and return user info
				if (token === "valid-token") {
					return {
						userId: "user-123",
						role: "editor",
						name: "John Doe",
					};
				}
				
				return null; // Reject connection
			},
			
			// Connection health settings
			heartbeatInterval: 30000, // 30 seconds
			maxReconnectAttempts: 5,
		}),
	],
});

// Start the server (Express/Next.js/etc.)
// The realtime plugin will automatically broadcast database changes

// ============================================================================
// CLIENT SETUP
// ============================================================================

import { createQueryClient, realtimeClient } from "better-query/client";

// Create client with realtime plugin
const client = createQueryClient<typeof query>({
	baseURL: "http://localhost:3000",
	queryPlugins: [
		realtimeClient({
			// WebSocket URL (auto-inferred from baseURL if not provided)
			wsUrl: "ws://localhost:3001/realtime",
			
			// Auto-reconnect on disconnect
			autoReconnect: true,
			maxReconnectAttempts: 5,
			reconnectDelay: 1000,
			
			// Authentication
			auth: "valid-token", // Or use a function: () => getToken()
			
			// Debug mode
			debug: true,
			
			// Heartbeat interval
			heartbeatInterval: 30000,
		}),
	],
});

// ============================================================================
// CLIENT USAGE EXAMPLES
// ============================================================================

// Connect to the realtime server
await client.realtime.connect();

// Get connection state reactively
const connectionState = client.realtime.atoms.connectionState;
connectionState.subscribe((state) => {
	console.log("Connection state:", state); // "disconnected" | "connecting" | "connected" | "reconnecting"
});

// ============================================================================
// Example 1: Subscribe to ALL changes for a resource
// ============================================================================

const unsubscribeFromPosts = await client.realtime.subscribeToResource(
	"post",
	(event) => {
		console.log("Post changed:", event);
		// event = {
		//   resource: "post",
		//   operation: "create" | "update" | "delete",
		//   data: { ... },
		//   id: "post-id"
		// }
		
		if (event.operation === "create") {
			console.log("New post created:", event.data);
		} else if (event.operation === "update") {
			console.log("Post updated:", event.data);
		} else if (event.operation === "delete") {
			console.log("Post deleted:", event.id);
		}
	}
);

// Unsubscribe when done
// unsubscribeFromPosts();

// ============================================================================
// Example 2: Subscribe to a SPECIFIC record
// ============================================================================

const postId = "post-123";
const unsubscribeFromPost = await client.realtime.subscribeToRecord(
	"post",
	postId,
	(event) => {
		console.log(`Post ${postId} changed:`, event);
		// Only receives updates for this specific post
	}
);

// ============================================================================
// Example 3: Custom channel subscriptions
// ============================================================================

const unsubscribeFromChannel = await client.realtime.subscribe(
	"custom-channel",
	(message) => {
		console.log("Received message:", message);
		// message = {
		//   type: "broadcast" | "data_change" | "presence_update" | ...,
		//   channel: "custom-channel",
		//   payload: { ... },
		//   timestamp: 1234567890
		// }
	}
);

// ============================================================================
// Example 4: Presence tracking (online users)
// ============================================================================

// Subscribe to presence updates
const unsubscribeFromPresence = await client.realtime.subscribeToPresence(
	"resource:post",
	(event) => {
		console.log("Presence update:", event);
		// event = {
		//   action: "join" | "leave",
		//   userId: "user-123",
		//   metadata: { name: "John Doe", ... },
		//   onlineUsers: [{ userId: "...", metadata: {...} }, ...]
		// }
		
		console.log(`User ${event.userId} ${event.action}ed the channel`);
		console.log(`Online users:`, event.onlineUsers);
	}
);

// Get current online users reactively
const onlineUsers = client.realtime.atoms.onlineUsers;
onlineUsers.subscribe((usersByChannel) => {
	const usersInPostChannel = usersByChannel.get("resource:post") || [];
	console.log("Users viewing posts:", usersInPostChannel);
});

// Get online users imperatively
const currentUsers = await client.realtime.getOnlineUsers("resource:post");
console.log("Current users:", currentUsers);

// ============================================================================
// Example 5: Broadcasting custom messages
// ============================================================================

// Broadcast a message to all clients subscribed to a channel
await client.realtime.broadcast("custom-channel", {
	type: "notification",
	message: "Hello, world!",
	from: "user-123",
});

// ============================================================================
// Example 6: Server-side broadcasting (REST API)
// ============================================================================

// You can also broadcast from the server using the REST endpoint
// POST /realtime/broadcast
// {
//   "channel": "custom-channel",
//   "payload": { "message": "Server message" }
// }

// Get realtime stats
// GET /realtime/stats
// Returns: { connected: 5, channels: [...] }

// Get online users in a channel
// GET /realtime/channel/users?channel=resource:post
// Returns: { channel: "...", users: [...], count: 3 }

// ============================================================================
// Example 7: React integration with reactive state
// ============================================================================

import { useEffect, useState } from "react";

function PostsRealtimeComponent() {
	const [posts, setPosts] = useState<any[]>([]);
	const [connectionState, setConnectionState] = useState<string>("disconnected");
	const [onlineCount, setOnlineCount] = useState(0);
	
	useEffect(() => {
		// Connect to realtime
		client.realtime.connect();
		
		// Subscribe to connection state
		const unsubState = client.realtime.atoms.connectionState.subscribe(
			(state) => setConnectionState(state)
		);
		
		// Subscribe to post changes
		const unsubPosts = client.realtime.subscribeToResource("post", (event) => {
			if (event.operation === "create") {
				setPosts((prev) => [...prev, event.data]);
			} else if (event.operation === "update") {
				setPosts((prev) =>
					prev.map((p) => (p.id === event.id ? event.data : p))
				);
			} else if (event.operation === "delete") {
				setPosts((prev) => prev.filter((p) => p.id !== event.id));
			}
		});
		
		// Subscribe to online users
		const unsubUsers = client.realtime.atoms.onlineUsers.subscribe(
			(usersByChannel) => {
				const users = usersByChannel.get("resource:post") || [];
				setOnlineCount(users.length);
			}
		);
		
		// Cleanup
		return () => {
			unsubState();
			unsubPosts();
			unsubUsers();
			client.realtime.disconnect();
		};
	}, []);
	
	return (
		<div>
			<div>Connection: {connectionState}</div>
			<div>Online users: {onlineCount}</div>
			<div>
				{posts.map((post) => (
					<div key={post.id}>{post.title}</div>
				))}
			</div>
		</div>
	);
}

// ============================================================================
// Example 8: Disconnect when done
// ============================================================================

// Disconnect from realtime server
await client.realtime.disconnect();
```
