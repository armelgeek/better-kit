import { Plugin } from "../types/plugins";
import { createCrudEndpoint } from "../endpoints/crud-endpoint";
import { z } from "zod";

/**
 * Realtime event types
 */
export type RealtimeEvent =
	| "create"
	| "update"
	| "delete"
	| "custom"
	| "*"; // Subscribe to all events

/**
 * Realtime message structure
 */
export interface RealtimeMessage {
	id: string;
	event: RealtimeEvent;
	resource: string;
	data: any;
	timestamp: number;
	userId?: string;
}

/**
 * SSE connection with event subscriptions
 */
interface SSEConnection {
	controller: ReadableStreamDefaultController;
	subscriptions: Set<string>; // Set of "resource:event" patterns
	userId?: string;
	connectedAt: number;
	lastActivity: number;
}

/**
 * Realtime plugin options
 */
export interface RealtimePluginOptions {
	/** Enable the plugin */
	enabled?: boolean;
	/** Keep-alive interval in seconds */
	keepAliveInterval?: number;
	/** Connection timeout in seconds */
	connectionTimeout?: number;
	/** Maximum connections per user */
	maxConnectionsPerUser?: number;
	/** Custom event filter */
	eventFilter?: (
		event: RealtimeMessage,
		connection: SSEConnection,
	) => boolean;
	/** Custom event transformer */
	eventTransformer?: (event: RealtimeMessage) => RealtimeMessage;
}

/**
 * Realtime plugin factory
 */
export function realtimePlugin(options: RealtimePluginOptions = {}): Plugin {
	const {
		enabled = true,
		keepAliveInterval = 30,
		connectionTimeout = 300,
		maxConnectionsPerUser = 5,
		eventFilter,
		eventTransformer,
	} = options;

	if (!enabled) {
		return {
			id: "realtime",
			endpoints: {},
		};
	}

	// Store active SSE connections
	const connections = new Map<string, SSEConnection>();

	// Clean up stale connections periodically
	const cleanupInterval = setInterval(() => {
		const now = Date.now();
		for (const [id, conn] of connections.entries()) {
			if (now - conn.lastActivity > connectionTimeout * 1000) {
				try {
					conn.controller.close();
				} catch (e) {
					// Connection already closed
				}
				connections.delete(id);
			}
		}
	}, 60000); // Check every minute

	// Send keep-alive to all connections
	const keepAliveTimer = setInterval(() => {
		for (const [id, conn] of connections.entries()) {
			try {
				conn.controller.enqueue(
					`event: keepalive\ndata: ${Date.now()}\n\n`,
				);
				conn.lastActivity = Date.now();
			} catch (e) {
				connections.delete(id);
			}
		}
	}, keepAliveInterval * 1000);

	/**
	 * Broadcast an event to all subscribed connections
	 */
	const broadcast = (event: RealtimeMessage) => {
		let processedEvent = event;

		// Apply custom transformer if provided
		if (eventTransformer) {
			processedEvent = eventTransformer(event);
		}

		for (const [id, conn] of connections.entries()) {
			// Check if connection is subscribed to this event
			const patterns = [
				`${event.resource}:${event.event}`, // Exact match
				`${event.resource}:*`, // All events for this resource
				`*:${event.event}`, // This event for all resources
				`*:*`, // All events for all resources
			];

			const isSubscribed = patterns.some((pattern) =>
				conn.subscriptions.has(pattern),
			);

			if (!isSubscribed) continue;

			// Apply custom filter if provided
			if (eventFilter && !eventFilter(processedEvent, conn)) {
				continue;
			}

			// Filter by userId if event is user-specific
			if (event.userId && event.userId !== conn.userId) {
				continue;
			}

			try {
				const data = JSON.stringify(processedEvent);
				conn.controller.enqueue(
					`id: ${processedEvent.id}\nevent: ${processedEvent.event}\ndata: ${data}\n\n`,
				);
				conn.lastActivity = Date.now();
			} catch (e) {
				// Connection closed, remove it
				connections.delete(id);
			}
		}
	};

	return {
		id: "realtime",

		endpoints: {
			// SSE endpoint for real-time updates
			subscribe: createCrudEndpoint(
				"/realtime/subscribe",
				{
					method: "GET",
					query: z.object({
						resources: z.string().optional(), // Comma-separated list
						events: z.string().optional(), // Comma-separated list
						userId: z.string().optional(),
					}),
				},
				async (ctx) => {
					const { resources, events, userId } = ctx.query;

					// Generate unique connection ID
					const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substring(7)}`;

					// Check max connections per user
					if (userId && maxConnectionsPerUser) {
						const userConnections = Array.from(connections.values()).filter(
							(c) => c.userId === userId,
						);
						if (userConnections.length >= maxConnectionsPerUser) {
							return ctx.json(
								{ error: "Maximum connections reached" },
								{ status: 429 },
							);
						}
					}

					// Parse subscriptions
					const resourceList = resources ? resources.split(",") : ["*"];
					const eventList = events ? events.split(",") : ["*"];

					const subscriptions = new Set<string>();
					for (const resource of resourceList) {
						for (const event of eventList) {
							subscriptions.add(`${resource.trim()}:${event.trim()}`);
						}
					}

					// Create SSE stream
					const stream = new ReadableStream({
						start(controller) {
							// Store connection
							const connection: SSEConnection = {
								controller,
								subscriptions,
								userId,
								connectedAt: Date.now(),
								lastActivity: Date.now(),
							};

							connections.set(connectionId, connection);

							// Send initial connection message
							const initMessage = JSON.stringify({
								id: connectionId,
								event: "connected",
								resource: "realtime",
								data: {
									connectionId,
									subscriptions: Array.from(subscriptions),
								},
								timestamp: Date.now(),
							});

							controller.enqueue(
								`id: ${connectionId}\nevent: connected\ndata: ${initMessage}\n\n`,
							);
						},
						cancel() {
							// Connection closed by client
							connections.delete(connectionId);
						},
					});

					return new Response(stream, {
						headers: {
							"Content-Type": "text/event-stream",
							"Cache-Control": "no-cache",
							Connection: "keep-alive",
						},
					});
				},
			),

			// Endpoint to broadcast custom events
			broadcast: createCrudEndpoint(
				"/realtime/broadcast",
				{
					method: "POST",
					body: z.object({
						event: z.enum(["create", "update", "delete", "custom", "*"]),
						resource: z.string(),
						data: z.any(),
						userId: z.string().optional(),
					}),
				},
				async (ctx) => {
					const { event, resource, data, userId } = ctx.body;

					const message: RealtimeMessage = {
						id: `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
						event,
						resource,
						data,
						timestamp: Date.now(),
						userId,
					};

					broadcast(message);

					return ctx.json({
						success: true,
						message: "Event broadcasted",
						connections: connections.size,
					});
				},
			),

			// Get connection statistics
			stats: createCrudEndpoint(
				"/realtime/stats",
				{
					method: "GET",
				},
				async (ctx) => {
					const now = Date.now();
					const connectionStats = Array.from(connections.values()).map(
						(conn) => ({
							subscriptions: Array.from(conn.subscriptions),
							userId: conn.userId,
							connectedAt: conn.connectedAt,
							lastActivity: conn.lastActivity,
							activeFor: Math.round((now - conn.connectedAt) / 1000),
							idleFor: Math.round((now - conn.lastActivity) / 1000),
						}),
					);

					return ctx.json({
						totalConnections: connections.size,
						keepAliveInterval,
						connectionTimeout,
						connections: connectionStats,
					});
				},
			),

			// Disconnect a specific connection
			disconnect: createCrudEndpoint(
				"/realtime/disconnect",
				{
					method: "POST",
					body: z.object({
						connectionId: z.string(),
					}),
				},
				async (ctx) => {
					const { connectionId } = ctx.body;

					const connection = connections.get(connectionId);
					if (!connection) {
						return ctx.json(
							{ error: "Connection not found" },
							{ status: 404 },
						);
					}

					try {
						connection.controller.close();
					} catch (e) {
						// Already closed
					}

					connections.delete(connectionId);

					return ctx.json({
						success: true,
						message: "Connection closed",
					});
				},
			),
		},

		hooks: {
			// Automatically broadcast CRUD operations
			afterCreate: async (context) => {
				const message: RealtimeMessage = {
					id: `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
					event: "create",
					resource: context.resource,
					data: context.result,
					timestamp: Date.now(),
				};
				broadcast(message);
			},

			afterUpdate: async (context) => {
				const message: RealtimeMessage = {
					id: `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
					event: "update",
					resource: context.resource,
					data: context.result,
					timestamp: Date.now(),
				};
				broadcast(message);
			},

			afterDelete: async (context) => {
				const message: RealtimeMessage = {
					id: `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
					event: "delete",
					resource: context.resource,
					data: context.result,
					timestamp: Date.now(),
				};
				broadcast(message);
			},
		},

		// Cleanup on plugin unload
		onUnload: () => {
			clearInterval(cleanupInterval);
			clearInterval(keepAliveTimer);
			for (const [id, conn] of connections.entries()) {
				try {
					conn.controller.close();
				} catch (e) {
					// Ignore
				}
			}
			connections.clear();
		},

		options,
	};
}
