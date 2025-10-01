import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { WebSocketServer } from "ws";
import { realtimePlugin } from "./realtime";
import { betterQuery } from "../query";

describe("Realtime Plugin - Server", () => {
	let wss: WebSocketServer | null = null;

	afterEach(async () => {
		if (wss) {
			wss.close();
			wss = null;
		}
	});

	it("should create a realtime plugin with default options", () => {
		const plugin = realtimePlugin();

		expect(plugin).toBeDefined();
		expect(plugin.id).toBe("realtime");
		expect(plugin.endpoints).toBeDefined();
		expect(plugin.hooks).toBeDefined();
	});

	it("should include realtime stats endpoint", () => {
		const plugin = realtimePlugin();

		expect(plugin.endpoints?.getRealtimeStats).toBeDefined();
	});

	it("should include channel users endpoint", () => {
		const plugin = realtimePlugin();

		expect(plugin.endpoints?.getChannelUsers).toBeDefined();
	});

	it("should include broadcast endpoint", () => {
		const plugin = realtimePlugin();

		expect(plugin.endpoints?.broadcastToChannel).toBeDefined();
	});

	it("should have hooks for database changes", () => {
		const plugin = realtimePlugin();

		expect(plugin.hooks?.afterCreate).toBeDefined();
		expect(plugin.hooks?.afterUpdate).toBeDefined();
		expect(plugin.hooks?.afterDelete).toBeDefined();
	});

	it("should support custom WebSocket server", () => {
		wss = new WebSocketServer({ noServer: true });

		const plugin = realtimePlugin({
			wss,
		});

		expect(plugin).toBeDefined();
		expect(plugin.id).toBe("realtime");
	});

	it("should support resource filtering", () => {
		const plugin = realtimePlugin({
			resources: ["users", "posts"],
		});

		expect(plugin).toBeDefined();
		expect(plugin.options?.resources).toEqual(["users", "posts"]);
	});

	it("should allow disabling presence broadcast", () => {
		const plugin = realtimePlugin({
			broadcastPresence: false,
		});

		expect(plugin.options?.broadcastPresence).toBe(false);
	});

	it("should return empty endpoints when disabled", () => {
		const plugin = realtimePlugin({
			enabled: false,
		});

		expect(plugin.endpoints).toEqual({});
	});

	it("should integrate with betterQuery", () => {
		const query = betterQuery({
			database: {
				provider: "sqlite",
				url: ":memory:",
			},
			resources: [],
			plugins: [
				realtimePlugin({
					enabled: false, // Disable to avoid starting server in tests
				}),
			],
		});

		expect(query).toBeDefined();
	});

	it("should have init and destroy methods", () => {
		const plugin = realtimePlugin({
			enabled: false,
		});

		expect(plugin.init).toBeDefined();
		expect(plugin.destroy).toBeDefined();
	});

	it("should support custom authentication", () => {
		const authenticate = vi.fn(async () => ({ userId: "test-user" }));

		const plugin = realtimePlugin({
			authenticate,
		});

		expect(plugin.options?.authenticate).toBe(authenticate);
	});

	it("should support custom port and path", () => {
		const plugin = realtimePlugin({
			port: 4000,
			path: "/ws",
		});

		expect(plugin.options?.port).toBe(4000);
		expect(plugin.options?.path).toBe("/ws");
	});

	it("should support heartbeat configuration", () => {
		const plugin = realtimePlugin({
			heartbeatInterval: 10000,
			maxReconnectAttempts: 10,
		});

		expect(plugin.options?.heartbeatInterval).toBe(10000);
		expect(plugin.options?.maxReconnectAttempts).toBe(10);
	});
});
