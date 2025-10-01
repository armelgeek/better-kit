import { WebSocketServer, WebSocket } from "ws";
import { z } from "zod";
import { createCrudEndpoint } from "../endpoints/crud-endpoint";
import { CrudHookContext } from "../types";
import { Plugin } from "../types/plugins";

/**
 * Realtime plugin options
 */
export interface RealtimePluginOptions {
	/** Whether to enable realtime sync */
	enabled?: boolean;
	/** WebSocket server instance (if you want to provide your own) */
	wss?: WebSocketServer;
	/** Port for WebSocket server (if creating a new one) */
	port?: number;
	/** Path for WebSocket endpoint */
	path?: string;
	/** Resources to enable realtime for (default: all) */
	resources?: string[];
	/** Whether to broadcast user presence */
	broadcastPresence?: boolean;
	/** Custom authentication handler */
	authenticate?: (
		request: any,
	) => Promise<{ userId: string; [key: string]: any } | null>;
	/** Maximum reconnection attempts */
	maxReconnectAttempts?: number;
	/** Heartbeat interval in milliseconds */
	heartbeatInterval?: number;
}

/**
 * WebSocket message types
 */
export type RealtimeMessageType =
	| "subscribe"
	| "unsubscribe"
	| "data_change"
	| "presence_update"
	| "broadcast"
	| "heartbeat"
	| "error";

/**
 * WebSocket message structure
 */
export interface RealtimeMessage {
	type: RealtimeMessageType;
	channel?: string;
	payload?: any;
	timestamp?: number;
}

/**
 * Client connection with metadata
 */
interface ClientConnection {
	ws: WebSocket;
	userId?: string;
	channels: Set<string>;
	metadata?: Record<string, any>;
	lastHeartbeat: number;
}

/**
 * Channel subscription manager
 */
class ChannelManager {
	private channels = new Map<string, Set<ClientConnection>>();

	subscribe(channel: string, client: ClientConnection): void {
		if (!this.channels.has(channel)) {
			this.channels.set(channel, new Set());
		}
		this.channels.get(channel)!.add(client);
		client.channels.add(channel);
	}

	unsubscribe(channel: string, client: ClientConnection): void {
		const channelClients = this.channels.get(channel);
		if (channelClients) {
			channelClients.delete(client);
			if (channelClients.size === 0) {
				this.channels.delete(channel);
			}
		}
		client.channels.delete(channel);
	}

	unsubscribeAll(client: ClientConnection): void {
		for (const channel of client.channels) {
			this.unsubscribe(channel, client);
		}
	}

	broadcast(
		channel: string,
		message: RealtimeMessage,
		excludeClient?: ClientConnection,
	): void {
		const clients = this.channels.get(channel);
		if (!clients) return;

		const messageStr = JSON.stringify(message);
		for (const client of clients) {
			if (client !== excludeClient && client.ws.readyState === WebSocket.OPEN) {
				client.ws.send(messageStr);
			}
		}
	}

	getChannels(): string[] {
		return Array.from(this.channels.keys());
	}

	getChannelClientCount(channel: string): number {
		return this.channels.get(channel)?.size || 0;
	}

	getOnlineUsers(channel: string): Array<{ userId?: string; metadata?: any }> {
		const clients = this.channels.get(channel);
		if (!clients) return [];

		return Array.from(clients)
			.filter((c) => c.userId)
			.map((c) => ({
				userId: c.userId,
				metadata: c.metadata,
			}));
	}
}

/**
 * Realtime plugin factory
 */
export function realtimePlugin(options: RealtimePluginOptions = {}): Plugin {
	const {
		enabled = true,
		wss: providedWss,
		port = 3001,
		path = "/realtime",
		resources = [],
		broadcastPresence = true,
		authenticate,
		maxReconnectAttempts = 5,
		heartbeatInterval = 30000,
	} = options;

	if (!enabled) {
		return {
			id: "realtime",
			endpoints: {},
			init: () => {},
			destroy: async () => {},
		};
	}

	// Initialize channel manager
	const channelManager = new ChannelManager();
	const clients = new Map<WebSocket, ClientConnection>();

	// Create or use provided WebSocket server
	let wss: WebSocketServer | null = null;
	let shouldCleanupWss = false;

	// Setup will happen during plugin init
	const setupWebSocketServer = () => {
		if (providedWss) {
			wss = providedWss;
		} else {
			// Create a new WebSocket server
			wss = new WebSocketServer({ port, path });
			shouldCleanupWss = true;
			console.log(`[Realtime] WebSocket server started on port ${port}`);
		}

		wss.on("connection", async (ws, request) => {
			// Create client connection
			const client: ClientConnection = {
				ws,
				channels: new Set(),
				lastHeartbeat: Date.now(),
			};

			// Authenticate if handler provided
			if (authenticate) {
				const authResult = await authenticate(request);
				if (authResult) {
					client.userId = authResult.userId;
					client.metadata = authResult;
				}
			}

			clients.set(ws, client);

			// Handle messages
			ws.on("message", (data) => {
				try {
					const message: RealtimeMessage = JSON.parse(data.toString());

					switch (message.type) {
						case "subscribe":
							if (message.channel) {
								channelManager.subscribe(message.channel, client);
								ws.send(
									JSON.stringify({
										type: "subscribed",
										channel: message.channel,
										timestamp: Date.now(),
									}),
								);

								// Broadcast presence update
								if (broadcastPresence && client.userId) {
									channelManager.broadcast(
										message.channel,
										{
											type: "presence_update",
											payload: {
												action: "join",
												userId: client.userId,
												metadata: client.metadata,
												onlineUsers: channelManager.getOnlineUsers(
													message.channel,
												),
											},
											timestamp: Date.now(),
										},
										client,
									);
								}
							}
							break;

						case "unsubscribe":
							if (message.channel) {
								channelManager.unsubscribe(message.channel, client);
								ws.send(
									JSON.stringify({
										type: "unsubscribed",
										channel: message.channel,
										timestamp: Date.now(),
									}),
								);

								// Broadcast presence update
								if (broadcastPresence && client.userId) {
									channelManager.broadcast(message.channel, {
										type: "presence_update",
										payload: {
											action: "leave",
											userId: client.userId,
											onlineUsers: channelManager.getOnlineUsers(
												message.channel,
											),
										},
										timestamp: Date.now(),
									});
								}
							}
							break;

						case "broadcast":
							if (message.channel && message.payload) {
								channelManager.broadcast(
									message.channel,
									{
										type: "broadcast",
										channel: message.channel,
										payload: message.payload,
										timestamp: Date.now(),
									},
									client,
								);
							}
							break;

						case "heartbeat":
							client.lastHeartbeat = Date.now();
							ws.send(
								JSON.stringify({
									type: "heartbeat",
									timestamp: Date.now(),
								}),
							);
							break;
					}
				} catch (error) {
					console.error("[Realtime] Error handling message:", error);
					ws.send(
						JSON.stringify({
							type: "error",
							payload: { message: "Invalid message format" },
							timestamp: Date.now(),
						}),
					);
				}
			});

			// Handle disconnection
			ws.on("close", () => {
				// Notify channels about disconnection
				if (broadcastPresence && client.userId) {
					for (const channel of client.channels) {
						channelManager.broadcast(channel, {
							type: "presence_update",
							payload: {
								action: "leave",
								userId: client.userId,
								onlineUsers: channelManager.getOnlineUsers(channel),
							},
							timestamp: Date.now(),
						});
					}
				}

				channelManager.unsubscribeAll(client);
				clients.delete(ws);
			});

			// Handle errors
			ws.on("error", (error) => {
				console.error("[Realtime] WebSocket error:", error);
			});
		});

		// Setup heartbeat monitoring
		const heartbeatTimer = setInterval(() => {
			const now = Date.now();
			for (const [ws, client] of clients.entries()) {
				if (now - client.lastHeartbeat > heartbeatInterval * 2) {
					// Client hasn't responded to heartbeat - terminate connection
					ws.terminate();
					clients.delete(ws);
				} else if (ws.readyState === WebSocket.OPEN) {
					// Send heartbeat
					ws.send(
						JSON.stringify({
							type: "heartbeat",
							timestamp: now,
						}),
					);
				}
			}
		}, heartbeatInterval);

		// Store timer for cleanup
		(wss as any)._heartbeatTimer = heartbeatTimer;
	};

	// Broadcast database changes to subscribed clients
	const broadcastDataChange = (
		resource: string,
		operation: string,
		data: any,
		id?: string,
	) => {
		// Broadcast to resource-specific channel
		const resourceChannel = `resource:${resource}`;
		channelManager.broadcast(resourceChannel, {
			type: "data_change",
			channel: resourceChannel,
			payload: {
				resource,
				operation,
				data,
				id,
			},
			timestamp: Date.now(),
		});

		// Broadcast to specific record channel if id provided
		if (id) {
			const recordChannel = `${resource}:${id}`;
			channelManager.broadcast(recordChannel, {
				type: "data_change",
				channel: recordChannel,
				payload: {
					resource,
					operation,
					data,
					id,
				},
				timestamp: Date.now(),
			});
		}
	};

	const shouldBroadcast = (resource: string): boolean => {
		return resources.length === 0 || resources.includes(resource);
	};

	return {
		id: "realtime",

		init: () => {
			setupWebSocketServer();
		},

		destroy: async () => {
			if (wss) {
				// Clear heartbeat timer
				if ((wss as any)._heartbeatTimer) {
					clearInterval((wss as any)._heartbeatTimer);
				}

				// Close all connections
				for (const [ws] of clients.entries()) {
					ws.close();
				}
				clients.clear();

				// Close server if we created it
				if (shouldCleanupWss) {
					wss.close();
				}
			}
		},

		endpoints: {
			// Get realtime stats
			getRealtimeStats: createCrudEndpoint(
				"/realtime/stats",
				{
					method: "GET",
				},
				async (ctx) => {
					return ctx.json({
						connected: clients.size,
						channels: channelManager.getChannels().map((channel) => ({
							name: channel,
							clients: channelManager.getChannelClientCount(channel),
							onlineUsers: channelManager.getOnlineUsers(channel),
						})),
					});
				},
			),

			// Get online users in a channel
			getChannelUsers: createCrudEndpoint(
				"/realtime/channel/users",
				{
					method: "GET",
					query: z.object({
						channel: z.string(),
					}),
				},
				async (ctx) => {
					const { channel } = ctx.query;
					return ctx.json({
						channel,
						users: channelManager.getOnlineUsers(channel),
						count: channelManager.getChannelClientCount(channel),
					});
				},
			),

			// Broadcast message to channel (server-side)
			broadcastToChannel: createCrudEndpoint(
				"/realtime/broadcast",
				{
					method: "POST",
					body: z.object({
						channel: z.string(),
						payload: z.any(),
					}),
				},
				async (ctx) => {
					const { channel, payload } = ctx.body;
					channelManager.broadcast(channel, {
						type: "broadcast",
						channel,
						payload,
						timestamp: Date.now(),
					});
					return ctx.json({ success: true, channel });
				},
			),
		},

		hooks: {
			afterCreate: async (context: CrudHookContext) => {
				if (shouldBroadcast(context.resource)) {
					broadcastDataChange(
						context.resource,
						"create",
						context.result,
						(context.result as any)?.id,
					);
				}
			},

			afterUpdate: async (context: CrudHookContext) => {
				if (shouldBroadcast(context.resource)) {
					broadcastDataChange(
						context.resource,
						"update",
						context.result,
						context.id,
					);
				}
			},

			afterDelete: async (context: CrudHookContext) => {
				if (shouldBroadcast(context.resource)) {
					broadcastDataChange(context.resource, "delete", null, context.id);
				}
			},
		},

		options,
	};
}
