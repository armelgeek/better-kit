/**
 * This example demonstrates how to create and use client plugins with better-query
 *
 * Client plugins allow you to:
 * 1. Infer endpoint types from server plugins
 * 2. Add custom client-side methods
 * 3. Manage reactive state with atoms
 * 4. Override HTTP methods for specific paths
 */

import type { BetterFetchOption } from "@better-fetch/fetch";
import { z } from "zod";
import {
	betterQuery,
	createPlugin,
	createQueryClient,
	createQueryEndpoint,
} from "..";
import type { BetterQueryClientPlugin } from "../types/client-plugins";

// ============================================================================
// SERVER PLUGIN DEFINITION
// ============================================================================

/**
 * Example server plugin with custom endpoints
 */
const analyticsPlugin = () =>
	createPlugin({
		id: "analytics",
		endpoints: {
			// GET endpoint - retrieve analytics stats
			getStats: createQueryEndpoint(
				"/analytics/stats",
				{
					method: "GET",
				},
				async (ctx) => {
					// In a real app, you'd fetch from database
					return ctx.json({
						totalUsers: 1000,
						activeUsers: 250,
						totalRevenue: 50000,
					});
				},
			),

			// POST endpoint - track an event
			trackEvent: createQueryEndpoint(
				"/analytics/track-event",
				{
					method: "POST",
				},
				async (ctx) => {
					const body = ctx.body as {
						event: string;
						metadata?: Record<string, any>;
					};

					// In a real app, you'd save to database
					console.log("Tracked event:", body);

					return ctx.json({
						success: true,
						eventId: "evt_123",
					});
				},
			),

			// GET endpoint - get user activity
			getUserActivity: createQueryEndpoint(
				"/analytics/user-activity",
				{
					method: "GET",
				},
				async (ctx) => {
					const userId = ctx.query?.userId as string;

					return ctx.json({
						userId,
						lastSeen: new Date().toISOString(),
						pageViews: 42,
					});
				},
			),
		},
	});

// ============================================================================
// CLIENT PLUGIN DEFINITION
// ============================================================================

/**
 * Client plugin that mirrors the server plugin
 * Provides type-safe client methods for all server endpoints
 */
export const analyticsClientPlugin = (): BetterQueryClientPlugin => {
	return {
		id: "analytics",

		// Infer types from server plugin for type safety
		$InferServerPlugin: {} as ReturnType<typeof analyticsPlugin>,

		/**
		 * Custom client-side actions
		 * These provide a clean API for calling the plugin endpoints
		 */
		getActions: ($fetch) => {
			return {
				// Get analytics stats
				getStats: async (fetchOptions?: BetterFetchOption) => {
					return $fetch("/analytics/stats", {
						method: "GET",
						...fetchOptions,
					});
				},

				// Track an event
				trackEvent: async (
					data: {
						event: string;
						metadata?: Record<string, any>;
					},
					fetchOptions?: BetterFetchOption,
				) => {
					return $fetch("/analytics/track-event", {
						method: "POST",
						body: data,
						...fetchOptions,
					});
				},

				// Get user activity
				getUserActivity: async (
					data: {
						userId: string;
					},
					fetchOptions?: BetterFetchOption,
				) => {
					return $fetch("/analytics/user-activity", {
						method: "GET",
						query: { userId: data.userId },
						...fetchOptions,
					});
				},
			};
		},

		/**
		 * Optional: Reactive atoms for state management
		 * Useful for tracking stats in real-time
		 */
		getAtoms: ($fetch) => {
			// Simple atom implementation (in production, use nanostores)
			const createAtom = <T>(initialValue: T) => {
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
						return () => listeners.delete(listener);
					},
				};
			};

			return {
				// Stats atom
				stats: createAtom<{
					totalUsers: number;
					activeUsers: number;
					totalRevenue: number;
				} | null>(null),

				// Loading state
				isLoading: createAtom<boolean>(false),
			};
		},

		/**
		 * Optional: Setup listeners to automatically fetch stats
		 */
		atomListeners: (atoms, $fetch) => {
			// Automatically fetch stats when the atom is subscribed to
			const fetchStats = async () => {
				atoms.isLoading.set(true);
				try {
					const result = await $fetch("/analytics/stats", {
						method: "GET",
					});
					if (result.data) {
						atoms.stats.set(result.data as any);
					}
				} finally {
					atoms.isLoading.set(false);
				}
			};

			// Initial fetch
			fetchStats();

			// Re-fetch every 30 seconds
			setInterval(fetchStats, 30000);
		},

		/**
		 * Optional: Override HTTP methods for specific paths
		 * By default, endpoints without body use GET, with body use POST
		 */
		pathMethods: {
			"/analytics/track-event": "POST",
		},
	};
};

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

// 1. Create server instance with plugin
const query = betterQuery({
	database: {
		provider: "sqlite",
		url: ":memory:",
	},
	resources: [
		{
			name: "user",
			schema: z.object({
				id: z.string(),
				name: z.string(),
				email: z.string().email(),
			}),
		},
	],
	plugins: [
		analyticsPlugin(), // Add server plugin
	],
});

// 2. Create client with plugin
const queryClient = createQueryClient<typeof query>({
	baseURL: "http://localhost:3000/api",
	queryPlugins: [
		analyticsClientPlugin(), // Add client plugin
	],
});

// 3. Use the client with plugin methods
async function exampleUsage() {
	// The plugin actions are available via the plugin id (converted to camelCase)
	// Since id is "analytics", it becomes: queryClient.analytics
	// However, since we're using a proxy, the actual access pattern depends on
	// how the client proxy is implemented. For plugin actions, they're typically
	// accessed through the plugin's getActions return object.
	// Note: The exact usage pattern would depend on how the client proxy
	// exposes plugin methods. This is a conceptual example.
}

// ============================================================================
// ADDITIONAL EXAMPLES
// ============================================================================

/**
 * Example: Simple notification plugin
 */
export const notificationClientPlugin = (): BetterQueryClientPlugin => {
	return {
		id: "notifications",
		getActions: ($fetch) => ({
			// Send a notification
			send: async (
				data: {
					title: string;
					message: string;
					type?: "info" | "success" | "warning" | "error";
				},
				fetchOptions?: BetterFetchOption,
			) => {
				return $fetch("/notifications/send", {
					method: "POST",
					body: data,
					...fetchOptions,
				});
			},

			// Get unread count
			getUnreadCount: async (fetchOptions?: BetterFetchOption) => {
				return $fetch("/notifications/unread-count", {
					method: "GET",
					...fetchOptions,
				});
			},

			// Mark as read
			markAsRead: async (
				data: { notificationId: string },
				fetchOptions?: BetterFetchOption,
			) => {
				return $fetch(`/notifications/${data.notificationId}/read`, {
					method: "POST",
					...fetchOptions,
				});
			},
		}),
	};
};

/**
 * Example: Authentication plugin with atoms
 */
export const authClientPlugin = (): BetterQueryClientPlugin => {
	return {
		id: "auth",
		getActions: ($fetch) => ({
			login: async (
				data: { email: string; password: string },
				fetchOptions?: BetterFetchOption,
			) => {
				return $fetch("/auth/login", {
					method: "POST",
					body: data,
					...fetchOptions,
				});
			},

			logout: async (fetchOptions?: BetterFetchOption) => {
				return $fetch("/auth/logout", {
					method: "POST",
					...fetchOptions,
				});
			},

			getSession: async (fetchOptions?: BetterFetchOption) => {
				return $fetch("/auth/session", {
					method: "GET",
					...fetchOptions,
				});
			},
		}),

		getAtoms: ($fetch) => {
			const createAtom = <T>(initialValue: T) => {
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
						return () => listeners.delete(listener);
					},
				};
			};

			return {
				session: createAtom<{ user: any; token: string } | null>(null),
				isAuthenticated: createAtom<boolean>(false),
			};
		},

		atomListeners: (atoms, $fetch) => {
			// Check session on init
			$fetch("/auth/session", { method: "GET" }).then((result) => {
				if (result.data) {
					atoms.session.set(result.data as any);
					atoms.isAuthenticated.set(true);
				}
			});
		},
	};
};

console.log("✅ Client plugin examples loaded");
console.log("📝 Example plugins:");
console.log("  - analyticsClientPlugin: Track events and stats");
console.log("  - notificationClientPlugin: Send notifications");
console.log("  - authClientPlugin: Authentication with reactive session");
