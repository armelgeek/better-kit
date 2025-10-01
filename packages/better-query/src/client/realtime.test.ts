import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { realtimeClient } from "./realtime";

describe("Realtime Plugin - Client", () => {
	it("should create a realtime client plugin with default options", () => {
		const plugin = realtimeClient();

		expect(plugin).toBeDefined();
		expect(plugin.id).toBe("realtime");
		expect(plugin.getActions).toBeDefined();
		expect(plugin.getAtoms).toBeDefined();
	});

	it("should provide connection actions", () => {
		const plugin = realtimeClient();
		const $fetch = { baseURL: "http://localhost:3000" };
		const actions = plugin.getActions!($fetch);

		expect(actions.connect).toBeDefined();
		expect(actions.disconnect).toBeDefined();
		expect(actions.subscribe).toBeDefined();
		expect(actions.broadcast).toBeDefined();
	});

	it("should provide resource subscription actions", () => {
		const plugin = realtimeClient();
		const $fetch = { baseURL: "http://localhost:3000" };
		const actions = plugin.getActions!($fetch);

		expect(actions.subscribeToResource).toBeDefined();
		expect(actions.subscribeToRecord).toBeDefined();
		expect(actions.subscribeToPresence).toBeDefined();
	});

	it("should provide state atoms", () => {
		const plugin = realtimeClient();
		const $fetch = { baseURL: "http://localhost:3000" };
		const atoms = plugin.getAtoms!($fetch);

		expect(atoms.connectionState).toBeDefined();
		expect(atoms.onlineUsers).toBeDefined();
	});

	it("should initialize with disconnected state", () => {
		const plugin = realtimeClient();
		const $fetch = { baseURL: "http://localhost:3000" };
		const atoms = plugin.getAtoms!($fetch);

		expect(atoms.connectionState.get()).toBe("disconnected");
	});

	it("should support custom WebSocket URL", () => {
		const plugin = realtimeClient({
			wsUrl: "ws://localhost:4000/custom",
		});

		expect(plugin).toBeDefined();
	});

	it("should support auto-reconnect configuration", () => {
		const plugin = realtimeClient({
			autoReconnect: false,
			maxReconnectAttempts: 10,
			reconnectDelay: 2000,
		});

		expect(plugin).toBeDefined();
	});

	it("should support authentication", () => {
		const plugin = realtimeClient({
			auth: "test-token",
		});

		expect(plugin).toBeDefined();
	});

	it("should support authentication function", () => {
		const authFn = vi.fn(() => "dynamic-token");
		const plugin = realtimeClient({
			auth: authFn,
		});

		expect(plugin).toBeDefined();
	});

	it("should support debug mode", () => {
		const plugin = realtimeClient({
			debug: true,
		});

		expect(plugin).toBeDefined();
	});

	it("should handle heartbeat configuration", () => {
		const plugin = realtimeClient({
			heartbeatInterval: 15000,
		});

		expect(plugin).toBeDefined();
	});

	it("should provide getConnectionState action", async () => {
		const plugin = realtimeClient();
		const $fetch = { baseURL: "http://localhost:3000" };
		const actions = plugin.getActions!($fetch);

		const state = await actions.getConnectionState();
		expect(state).toBe("disconnected");
	});

	it("should provide getOnlineUsers action", async () => {
		const plugin = realtimeClient();
		const $fetch = { baseURL: "http://localhost:3000" };
		const actions = plugin.getActions!($fetch);

		const users = await actions.getOnlineUsers("test-channel");
		expect(users).toEqual([]);
	});

	it("should support subscription callbacks", () => {
		const plugin = realtimeClient();
		const $fetch = { baseURL: "http://localhost:3000" };
		const atoms = plugin.getAtoms!($fetch);

		let callbackCalled = false;
		const unsubscribe = atoms.connectionState.subscribe((state) => {
			callbackCalled = true;
		});

		expect(callbackCalled).toBe(true);
		unsubscribe();
	});

	it("should handle online users updates", () => {
		const plugin = realtimeClient();
		const $fetch = { baseURL: "http://localhost:3000" };
		const atoms = plugin.getAtoms!($fetch);

		const initialUsers = atoms.onlineUsers.get();
		expect(initialUsers).toBeInstanceOf(Map);
		expect(initialUsers.size).toBe(0);
	});
});
