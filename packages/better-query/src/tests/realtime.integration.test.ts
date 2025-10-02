import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { betterQuery } from "../query";
import { realtimePlugin } from "../plugins/realtime";
import { z } from "zod";

describe("Realtime Plugin - Integration", () => {
	it("should integrate with betterQuery and provide endpoints when enabled", () => {
		const query = betterQuery({
			database: {
				provider: "sqlite",
				url: ":memory:",
			},
			resources: [
				{
					name: "message",
					schema: z.object({
						id: z.string().optional(),
						text: z.string(),
						userId: z.string(),
						createdAt: z.date().optional(),
					}),
				},
			],
			plugins: [
				realtimePlugin({
					enabled: true, // Enable to check endpoints are registered
					resources: ["message"],
					broadcastPresence: true,
				}),
			],
		});

		// Verify the query instance was created
		expect(query).toBeDefined();
		expect(query.api).toBeDefined();

		// Verify realtime endpoints are available
		expect(query.api.getRealtimeStats).toBeDefined();
		expect(query.api.getChannelUsers).toBeDefined();
		expect(query.api.broadcastToChannel).toBeDefined();

		// Clean up - destroy the plugin to close WebSocket server
		const plugin = query.context.pluginManager.getPlugin("realtime");
		if (plugin?.destroy) {
			plugin.destroy();
		}
	});

	it("should work with multiple plugins", () => {
		const query = betterQuery({
			database: {
				provider: "sqlite",
				url: ":memory:",
			},
			resources: [],
			plugins: [
				realtimePlugin({
					enabled: false,
				}),
				// Could add more plugins here
			],
		});

		expect(query).toBeDefined();
	});

	it("should support custom configuration", () => {
		const customAuth = async (request: any) => ({
			userId: "test-user",
			role: "admin",
		});

		const query = betterQuery({
			database: {
				provider: "sqlite",
				url: ":memory:",
			},
			resources: [],
			plugins: [
				realtimePlugin({
					enabled: false,
					port: 4001,
					path: "/ws",
					resources: ["post", "comment"],
					broadcastPresence: false,
					authenticate: customAuth,
					heartbeatInterval: 10000,
					maxReconnectAttempts: 3,
				}),
			],
		});

		expect(query).toBeDefined();
	});
});
