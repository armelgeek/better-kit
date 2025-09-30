import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createQueryEndpoints } from "../endpoints";
import { QueryMiddlewareContext, QueryResourceConfig } from "../types";

describe("Middleware System", () => {
	const mockAdapter = {
		create: vi.fn().mockResolvedValue({ id: "test-id", title: "Test Todo" }),
		read: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
		list: vi.fn(),
	};

	const mockContext = {
		adapter: mockAdapter,
		auditLogger: undefined,
		security: undefined,
	};

	const todoSchema = z.object({
		id: z.string().optional(),
		title: z.string(),
		userId: z.string().optional(),
	});

	it("should execute middleware before permission checks", async () => {
		const permissionCheckCalls: any[] = [];
		const middlewareCalls: any[] = [];

		// Mock middleware that injects user
		const userMiddleware = async (context: QueryMiddlewareContext) => {
			middlewareCalls.push({ operation: "middleware", user: context.user });
			// Simulate injecting user from session
			context.user = { id: "user123", name: "Test User" };
		};

		// Mock permission function that checks user
		const permissionCheck = async (context: any) => {
			permissionCheckCalls.push({
				operation: "permission",
				user: context.user,
			});
			return !!context.user; // Only allow if user exists
		};

		const resourceConfig: QueryResourceConfig = {
			name: "todo",
			schema: todoSchema,
			middleware: [{ handler: userMiddleware }],
			permissions: {
				create: permissionCheck,
			},
		};

		const endpoints = createQueryEndpoints(resourceConfig);
		const createEndpoint = endpoints.createTodo;

		// Simulate request context without user
		const requestContext = {
			body: { title: "Test Todo" },
			context: mockContext,
			query: {},
			json: vi.fn().mockImplementation((data, options) => ({ data, options })),
			user: null, // No user initially
		};

		await createEndpoint(requestContext);

		// Verify execution order
		expect(middlewareCalls).toHaveLength(1);
		expect(permissionCheckCalls).toHaveLength(1);

		// Middleware should have been called with no user
		expect(middlewareCalls[0].user).toBeNull();

		// Permission check should have been called with user injected by middleware
		expect(permissionCheckCalls[0].user).toEqual({
			id: "user123",
			name: "Test User",
		});

		// Should succeed because middleware injected user
		expect(requestContext.json).toHaveBeenCalledWith(
			expect.objectContaining({ id: "test-id", title: "Test Todo" }),
			{ status: 201 },
		);
	});

	it("should fail permission check when middleware doesn't inject user", async () => {
		const permissionCheck = async (context: any) => {
			return !!context.user; // Only allow if user exists
		};

		const resourceConfig: QueryResourceConfig = {
			name: "todo",
			schema: todoSchema,
			// No middleware to inject user
			permissions: {
				create: permissionCheck,
			},
		};

		const endpoints = createQueryEndpoints(resourceConfig);
		const createEndpoint = endpoints.createTodo;

		const requestContext = {
			body: { title: "Test Todo" },
			context: mockContext,
			query: {},
			json: vi.fn().mockImplementation((data, options) => ({ data, options })),
			user: null, // No user
		};

		await createEndpoint(requestContext);

		// Should fail with 403 Forbidden
		expect(requestContext.json).toHaveBeenCalledWith(
			{ error: "Forbidden" },
			{ status: 403 },
		);
	});

	it("should handle middleware execution errors", async () => {
		const failingMiddleware = async () => {
			throw new Error("Middleware failed");
		};

		const resourceConfig: QueryResourceConfig = {
			name: "todo",
			schema: todoSchema,
			middleware: [{ handler: failingMiddleware }],
			permissions: {
				create: async () => true,
			},
		};

		const endpoints = createQueryEndpoints(resourceConfig);
		const createEndpoint = endpoints.createTodo;

		const requestContext = {
			body: { title: "Test Todo" },
			context: mockContext,
			query: {},
			json: vi.fn().mockImplementation((data, options) => ({ data, options })),
		};

		await createEndpoint(requestContext);

		// Should fail with 500 error
		expect(requestContext.json).toHaveBeenCalledWith(
			{ error: "Middleware execution failed", details: "Middleware failed" },
			{ status: 500 },
		);
	});

	it("should allow multiple middleware functions", async () => {
		const calls: string[] = [];

		const middleware1 = async (context: QueryMiddlewareContext) => {
			calls.push("middleware1");
			context.user = { id: "user123" };
		};

		const middleware2 = async (context: QueryMiddlewareContext) => {
			calls.push("middleware2");
			if (context.user) {
				context.user.enriched = true;
			}
		};

		const permissionCheck = async (context: any) => {
			calls.push("permission");
			return context.user?.enriched === true;
		};

		const resourceConfig: QueryResourceConfig = {
			name: "todo",
			schema: todoSchema,
			middleware: [{ handler: middleware1 }, { handler: middleware2 }],
			permissions: {
				create: permissionCheck,
			},
		};

		const endpoints = createQueryEndpoints(resourceConfig);
		const createEndpoint = endpoints.createTodo;

		const requestContext = {
			body: { title: "Test Todo" },
			context: mockContext,
			query: {},
			json: vi.fn().mockImplementation((data, options) => ({ data, options })),
		};

		await createEndpoint(requestContext);

		// Verify execution order
		expect(calls).toEqual(["middleware1", "middleware2", "permission"]);

		// Should succeed
		expect(requestContext.json).toHaveBeenCalledWith(
			expect.objectContaining({ id: "test-id", title: "Test Todo" }),
			{ status: 201 },
		);
	});

	it("should modify scopes in middleware", async () => {
		let capturedScopes: string[] = [];

		const scopeMiddleware = async (context: QueryMiddlewareContext) => {
			context.scopes = ["admin", "create-todo"];
		};

		const permissionCheck = async (context: any) => {
			capturedScopes = context.scopes || [];
			return context.scopes?.includes("create-todo") || false;
		};

		const resourceConfig: QueryResourceConfig = {
			name: "todo",
			schema: todoSchema,
			middleware: [{ handler: scopeMiddleware }],
			permissions: {
				create: permissionCheck,
			},
		};

		const endpoints = createQueryEndpoints(resourceConfig);
		const createEndpoint = endpoints.createTodo;

		const requestContext = {
			body: { title: "Test Todo" },
			context: mockContext,
			query: {},
			json: vi.fn().mockImplementation((data, options) => ({ data, options })),
		};

		await createEndpoint(requestContext);

		// Verify scopes were modified and passed to permission check
		expect(capturedScopes).toEqual(["admin", "create-todo"]);

		// Should succeed because middleware added required scope
		expect(requestContext.json).toHaveBeenCalledWith(
			expect.objectContaining({ id: "test-id", title: "Test Todo" }),
			{ status: 201 },
		);
	});
});
