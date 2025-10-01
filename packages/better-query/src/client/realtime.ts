import type { BetterQueryClientPlugin, Atom } from "../types/client-plugins";

/**
 * Realtime client plugin options
 */
export interface RealtimeClientOptions {
	/** WebSocket URL (if not provided, will be inferred from baseURL) */
	wsUrl?: string;
	/** Whether to auto-reconnect on disconnect */
	autoReconnect?: boolean;
	/** Maximum reconnection attempts */
	maxReconnectAttempts?: number;
	/** Reconnection delay in milliseconds */
	reconnectDelay?: number;
	/** Heartbeat interval in milliseconds */
	heartbeatInterval?: number;
	/** Authentication token or function to get token */
	auth?: string | (() => string | Promise<string>);
	/** Debug mode */
	debug?: boolean;
}

/**
 * WebSocket message types
 */
export type RealtimeMessageType =
	| "subscribe"
	| "unsubscribe"
	| "subscribed"
	| "unsubscribed"
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
 * Data change event
 */
export interface DataChangeEvent {
	resource: string;
	operation: "create" | "update" | "delete";
	data: any;
	id?: string;
}

/**
 * Presence update event
 */
export interface PresenceUpdateEvent {
	action: "join" | "leave";
	userId: string;
	metadata?: any;
	onlineUsers: Array<{ userId?: string; metadata?: any }>;
}

/**
 * Subscription callback
 */
export type SubscriptionCallback = (message: RealtimeMessage) => void;

/**
 * Realtime client connection state
 */
export type ConnectionState =
	| "disconnected"
	| "connecting"
	| "connected"
	| "reconnecting";

/**
 * Create a simple atom implementation for state management
 */
function createAtom<T>(initialValue: T): Atom<T> {
	let value = initialValue;
	const listeners = new Set<(value: T) => void>();

	return {
		get: () => value,
		set: (newValue: T) => {
			value = newValue;
			listeners.forEach((listener) => listener(value));
		},
		subscribe: (listener: (value: T) => void) => {
			listeners.add(listener);
			// Call listener immediately with current value
			listener(value);
			return () => listeners.delete(listener);
		},
	};
}

/**
 * Realtime client plugin for better-query
 */
export function realtimeClient(
	options: RealtimeClientOptions = {},
): BetterQueryClientPlugin {
	const {
		wsUrl: providedWsUrl,
		autoReconnect = true,
		maxReconnectAttempts = 5,
		reconnectDelay = 1000,
		heartbeatInterval = 30000,
		auth,
		debug = false,
	} = options;

	let ws: WebSocket | null = null;
	let reconnectAttempts = 0;
	let reconnectTimer: any = null;
	let heartbeatTimer: any = null;
	const subscriptions = new Map<string, Set<SubscriptionCallback>>();

	// Atoms for reactive state
	const connectionStateAtom = createAtom<ConnectionState>("disconnected");
	const onlineUsersAtom = createAtom<
		Map<string, Array<{ userId?: string; metadata?: any }>>
	>(new Map());

	const log = (...args: any[]) => {
		if (debug) {
			console.log("[Realtime Client]", ...args);
		}
	};

	const getWsUrl = (baseURL: string): string => {
		if (providedWsUrl) {
			return providedWsUrl;
		}

		// Convert HTTP URL to WebSocket URL
		const url = new URL(baseURL);
		const protocol = url.protocol === "https:" ? "wss:" : "ws:";
		return `${protocol}//${url.host}/realtime`;
	};

	const connect = async (baseURL: string) => {
		if (ws && ws.readyState === WebSocket.OPEN) {
			return;
		}

		connectionStateAtom.set("connecting");
		log("Connecting to WebSocket...");

		try {
			const wsUrl = getWsUrl(baseURL);
			let url = wsUrl;

			// Add authentication if provided
			if (auth) {
				const token = typeof auth === "function" ? await auth() : auth;
				url = `${wsUrl}?token=${encodeURIComponent(token)}`;
			}

			ws = new WebSocket(url);

			ws.onopen = () => {
				log("Connected");
				connectionStateAtom.set("connected");
				reconnectAttempts = 0;

				// Resubscribe to all channels
				for (const channel of subscriptions.keys()) {
					sendMessage({ type: "subscribe", channel });
				}

				// Start heartbeat
				startHeartbeat();
			};

			ws.onmessage = (event) => {
				try {
					const message: RealtimeMessage = JSON.parse(event.data);
					log("Received message:", message);

					// Update online users for presence updates
					if (message.type === "presence_update" && message.channel) {
						const users = onlineUsersAtom.get();
						users.set(message.channel, message.payload?.onlineUsers || []);
						onlineUsersAtom.set(new Map(users));
					}

					// Notify subscribers
					if (message.channel) {
						const channelSubscribers = subscriptions.get(message.channel);
						if (channelSubscribers) {
							for (const callback of channelSubscribers) {
								callback(message);
							}
						}
					}
				} catch (error) {
					console.error("[Realtime Client] Error parsing message:", error);
				}
			};

			ws.onclose = () => {
				log("Disconnected");
				connectionStateAtom.set("disconnected");
				stopHeartbeat();

				// Attempt reconnection
				if (autoReconnect && reconnectAttempts < maxReconnectAttempts) {
					reconnectAttempts++;
					connectionStateAtom.set("reconnecting");
					log(`Reconnecting... (attempt ${reconnectAttempts})`);

					reconnectTimer = setTimeout(() => {
						connect(baseURL);
					}, reconnectDelay * reconnectAttempts);
				}
			};

			ws.onerror = (error) => {
				console.error("[Realtime Client] WebSocket error:", error);
			};
		} catch (error) {
			console.error("[Realtime Client] Connection error:", error);
			connectionStateAtom.set("disconnected");
		}
	};

	const disconnect = () => {
		if (reconnectTimer) {
			clearTimeout(reconnectTimer);
		}
		stopHeartbeat();

		if (ws) {
			ws.close();
			ws = null;
		}
		connectionStateAtom.set("disconnected");
	};

	const sendMessage = (message: RealtimeMessage) => {
		if (ws && ws.readyState === WebSocket.OPEN) {
			ws.send(JSON.stringify(message));
		} else {
			log("Cannot send message - not connected");
		}
	};

	const startHeartbeat = () => {
		stopHeartbeat();
		heartbeatTimer = setInterval(() => {
			sendMessage({ type: "heartbeat", timestamp: Date.now() });
		}, heartbeatInterval);
	};

	const stopHeartbeat = () => {
		if (heartbeatTimer) {
			clearInterval(heartbeatTimer);
			heartbeatTimer = null;
		}
	};

	const subscribe = (channel: string, callback: SubscriptionCallback) => {
		if (!subscriptions.has(channel)) {
			subscriptions.set(channel, new Set());
			// Send subscribe message if connected
			if (ws && ws.readyState === WebSocket.OPEN) {
				sendMessage({ type: "subscribe", channel });
			}
		}

		subscriptions.get(channel)!.add(callback);

		// Return unsubscribe function
		return () => {
			const channelSubscribers = subscriptions.get(channel);
			if (channelSubscribers) {
				channelSubscribers.delete(callback);

				// If no more subscribers, unsubscribe from channel
				if (channelSubscribers.size === 0) {
					subscriptions.delete(channel);
					sendMessage({ type: "unsubscribe", channel });
				}
			}
		};
	};

	const broadcast = (channel: string, payload: any) => {
		sendMessage({ type: "broadcast", channel, payload, timestamp: Date.now() });
	};

	return {
		id: "realtime",

		getActions: ($fetch) => ({
			/**
			 * Connect to the realtime server
			 */
			connect: async () => {
				const baseURL = ($fetch as any).baseURL || "http://localhost:3000";
				await connect(baseURL);
			},

			/**
			 * Disconnect from the realtime server
			 */
			disconnect: async () => {
				disconnect();
			},

			/**
			 * Subscribe to a channel
			 */
			subscribe: async (channel: string, callback: SubscriptionCallback) => {
				return subscribe(channel, callback);
			},

			/**
			 * Subscribe to database changes for a resource
			 */
			subscribeToResource: async (
				resource: string,
				callback: (event: DataChangeEvent) => void,
			) => {
				return subscribe(`resource:${resource}`, (message) => {
					if (message.type === "data_change") {
						callback(message.payload as DataChangeEvent);
					}
				});
			},

			/**
			 * Subscribe to a specific record
			 */
			subscribeToRecord: async (
				resource: string,
				id: string,
				callback: (event: DataChangeEvent) => void,
			) => {
				return subscribe(`${resource}:${id}`, (message) => {
					if (message.type === "data_change") {
						callback(message.payload as DataChangeEvent);
					}
				});
			},

			/**
			 * Subscribe to presence updates in a channel
			 */
			subscribeToPresence: async (
				channel: string,
				callback: (event: PresenceUpdateEvent) => void,
			) => {
				return subscribe(channel, (message) => {
					if (message.type === "presence_update") {
						callback(message.payload as PresenceUpdateEvent);
					}
				});
			},

			/**
			 * Broadcast a message to a channel
			 */
			broadcast: async (channel: string, payload: any) => {
				broadcast(channel, payload);
			},

			/**
			 * Get connection state
			 */
			getConnectionState: async () => {
				return connectionStateAtom.get();
			},

			/**
			 * Get online users in a channel
			 */
			getOnlineUsers: async (channel: string) => {
				return onlineUsersAtom.get().get(channel) || [];
			},
		}),

		getAtoms: () => ({
			/**
			 * Connection state atom
			 */
			connectionState: connectionStateAtom,

			/**
			 * Online users atom (by channel)
			 */
			onlineUsers: onlineUsersAtom,
		}),
	};
}
