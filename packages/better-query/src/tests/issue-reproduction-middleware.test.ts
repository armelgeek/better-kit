/**
 * This test validates that the middleware system solves the original issue
 * where user injection in beforeCreate hooks wasn't available for permission checks
 */
import { describe, it, expect, vi } from "vitest";
import { createQueryEndpoints } from "../endpoints";
import { QueryResourceConfig } from "../types";
import { z } from "zod";

describe("Issue Reproduction: User Injection for Permissions", () => {
	const mockAdapter = {
		create: vi.fn().mockResolvedValue({ id: "todo-123", title: "Test Todo", userId: "user-456" }),
	};

	const mockContext = {
		adapter: mockAdapter,
	};

	const todoSchema = z.object({
		id: z.string().optional(),
		title: z.string(),
		userId: z.string().optional(),
	});

	it("should solve the original issue: user available in permission checks via middleware", async () => {
		// Mock session API (like Better Auth)
		const mockGetSession = vi.fn().mockResolvedValue({
			user: { id: "user-456", name: "John Doe" }
		});

		// Track what's available in permission check
		let permissionCheckUser: any = undefined;

		const todoResource: QueryResourceConfig = {
			name: "todo",
			schema: todoSchema,
			
			// SOLUTION: Use middleware to inject user BEFORE permission checks
			middleware: [
				{
					handler: async (context) => {
						// Simulate getting session (like Better Auth)
						const session = await mockGetSession();
						context.user = session?.user;
					}
				}
			],
			
			permissions: {
				create: async (context) => {
					// Capture what user is available during permission check
					permissionCheckUser = context.user;
					// Now we can properly check permissions!
					return !!context.user;
				},
			},
		};

		const endpoints = createQueryEndpoints(todoResource);
		const createEndpoint = endpoints.createTodo;

		// Simulate request without initial user (typical scenario)
		const requestContext = {
			body: { title: "My Todo" },
			context: mockContext,
			query: {},
			json: vi.fn().mockImplementation((data, options) => ({ data, options })),
			user: null, // No user initially available
		};

		await createEndpoint(requestContext);

		// VERIFY: User should be available in permission check thanks to middleware
		expect(permissionCheckUser).toEqual({ id: "user-456", name: "John Doe" });
		
		// VERIFY: Operation should succeed because user was injected
		expect(requestContext.json).toHaveBeenCalledWith(
			expect.objectContaining({ id: "todo-123", title: "Test Todo" }),
			{ status: 201 }
		);

		// VERIFY: Session API should have been called
		expect(mockGetSession).toHaveBeenCalled();
	});

	it("should demonstrate the old problem: beforeCreate hooks run too late", async () => {
		// This test shows why the old approach didn't work
		
		let permissionCheckUser: any = undefined;
		let hookUser: any = undefined;

		const problemResource: QueryResourceConfig = {
			name: "todo",
			schema: todoSchema,
			
			// OLD APPROACH: No middleware, trying to inject user in beforeCreate
			permissions: {
				create: async (context) => {
					permissionCheckUser = context.user;
					// This would fail because user is still null
					return !!context.user;
				},
			},
			
			hooks: {
				beforeCreate: async (context) => {
					// This runs AFTER permission check, so it's too late
					const mockUser = { id: "user-456", name: "John Doe" };
					context.user = mockUser;
					hookUser = context.user;
				},
			},
		};

		const endpoints = createQueryEndpoints(problemResource);
		const createEndpoint = endpoints.createTodo;

		const requestContext = {
			body: { title: "My Todo" },
			context: mockContext,
			query: {},
			json: vi.fn().mockImplementation((data, options) => ({ data, options })),
			user: null,
		};

		await createEndpoint(requestContext);

		// DEMONSTRATE PROBLEM: User is null during permission check
		expect(permissionCheckUser).toBeNull();
		
		// But user gets set in hook (too late for permissions)
		expect(hookUser).toEqual({ id: "user-456", name: "John Doe" });
		
		// Operation fails due to permission denial
		expect(requestContext.json).toHaveBeenCalledWith(
			{ error: "Forbidden" },
			{ status: 403 }
		);
	});

	it("should work with complex permission logic using middleware-injected user", async () => {
		const mockGetSession = vi.fn().mockResolvedValue({
			user: { 
				id: "user-456", 
				name: "John Doe",
				roles: ["user", "todo-creator"]
			}
		});

		const advancedResource: QueryResourceConfig = {
			name: "todo",
			schema: todoSchema,
			
			middleware: [
				{
					handler: async (context) => {
						const session = await mockGetSession();
						context.user = session?.user;
						context.scopes = session?.user?.roles || [];
					}
				}
			],
			
			permissions: {
				create: async (context) => {
					// Complex permission logic using middleware-injected data
					if (!context.user) return false;
					
					// Check if user has required role
					if (!context.scopes?.includes("todo-creator")) return false;
					
					// Add user ID to data for ownership
					if (context.data) {
						context.data.userId = context.user.id;
					}
					
					return true;
				},
			},
		};

		const endpoints = createQueryEndpoints(advancedResource);
		const createEndpoint = endpoints.createTodo;

		const requestContext = {
			body: { title: "My Todo" },
			context: mockContext,
			query: {},
			json: vi.fn().mockImplementation((data, options) => ({ data, options })),
		};

		await createEndpoint(requestContext);

		// Should succeed with proper user and data enrichment
		expect(requestContext.json).toHaveBeenCalledWith(
			expect.objectContaining({ 
				id: "todo-123", 
				title: "Test Todo",
				userId: "user-456" // Added by permission logic
			}),
			{ status: 201 }
		);

		// Verify the adapter was called with enriched data
		expect(mockAdapter.create).toHaveBeenCalledWith({
			model: "todo",
			data: expect.objectContaining({
				userId: "user-456" // User ID was added by permission check
			}),
			include: undefined
		});
	});
});