import { describe, it, expect, vi } from "vitest";
import { betterAuth, createBetterAuthContext, BetterAuthUser } from "../plugins/better-auth";
import { QueryPermissionContext, QueryHookContext } from "../types";

describe("Better Auth Plugin", () => {
	const mockAuth = {
		api: {
			getCurrentSession: vi.fn()
		},
		$inferredTypes: {
			User: {} as { id: string; email: string; role: string }
		}
	};

	const mockUser: BetterAuthUser = {
		id: "user-123",
		email: "test@example.com",
		role: "admin"
	};

	it("should create Better Auth plugin with role permissions", () => {
		const plugin = betterAuth({
			auth: mockAuth,
			rolePermissions: {
				admin: {
					resources: ["*"],
					operations: ["create", "read", "update", "delete", "list"],
					scopes: ["admin"]
				},
				user: {
					operations: ["read", "create"],
					scopes: ["read"]
				}
			}
		});

		expect(plugin).toBeDefined();
		expect(plugin.id).toBe("better-auth");
		expect(plugin.middleware).toBeDefined();
		expect(plugin.hooks).toBeDefined();
	});

	it("should extract user from Better Auth session", async () => {
		mockAuth.api.getCurrentSession.mockResolvedValue({
			user: mockUser
		});

		const plugin = betterAuth({ auth: mockAuth });
		const middleware = plugin.middleware?.[0];

		expect(middleware).toBeDefined();

		const mockContext = {
			request: {
				headers: {}
			}
		};

		await middleware!.handler(mockContext);

		expect(mockContext.request.user).toEqual(mockUser);
		expect(mockAuth.api.getCurrentSession).toHaveBeenCalledWith({
			headers: {}
		});
	});

	it("should create typed user context helpers", () => {
		const authContext = createBetterAuthContext<{ id: string; email: string; role: string }>();
		
		const context: QueryPermissionContext = {
			resource: "product",
			operation: "read",
			user: mockUser
		};

		expect(authContext.getUser(context)).toBe(mockUser);
		expect(authContext.hasRole(context, "admin")).toBe(true);
		expect(authContext.hasRole(context, "user")).toBe(false);
		expect(authContext.hasAnyRole(context, ["admin", "moderator"])).toBe(true);
	});

	it("should enforce role-based permissions", async () => {
		const plugin = betterAuth({
			rolePermissions: {
				user: {
					resources: ["product"],
					operations: ["read", "create"]
				}
			}
		});

		const context: QueryHookContext = {
			resource: "order",
			operation: "create",
			user: { ...mockUser, role: "user" },
			adapter: {} as any
		};

		// Should throw error for unauthorized resource access
		const beforeCreateHook = plugin.hooks?.beforeCreate;
		expect(beforeCreateHook).toBeDefined();

		try {
			await beforeCreateHook!(context);
			expect.fail("Should have thrown an error");
		} catch (error) {
			expect(error).toBeInstanceOf(Error);
			expect((error as Error).message).toContain("does not have access to resource");
		}
	});

	it("should allow admin access to all resources", async () => {
		const plugin = betterAuth({
			rolePermissions: {
				admin: {
					resources: ["*"],
					operations: ["create", "read", "update", "delete", "list"]
				}
			}
		});

		const context: QueryHookContext = {
			resource: "any-resource",
			operation: "delete",
			user: { ...mockUser, role: "admin" },
			adapter: {} as any
		};

		const beforeDeleteHook = plugin.hooks?.beforeDelete;
		expect(beforeDeleteHook).toBeDefined();

		// Should not throw error for admin with wildcard access
		await expect(beforeDeleteHook!(context)).resolves.not.toThrow();
	});

	it("should handle users without roles", () => {
		const authContext = createBetterAuthContext();
		
		const context: QueryPermissionContext = {
			resource: "product",
			operation: "read",
			user: { id: "user-123", email: "test@example.com" } // No role
		};

		expect(authContext.hasRole(context, "admin")).toBe(false);
		expect(authContext.hasAnyRole(context, ["admin", "user"])).toBe(false);
	});

	it("should handle null user context", () => {
		const authContext = createBetterAuthContext();
		
		const context: QueryPermissionContext = {
			resource: "product",
			operation: "read",
			user: null
		};

		expect(authContext.getUser(context)).toBe(null);
		expect(authContext.hasRole(context, "admin")).toBe(false);
		expect(authContext.belongsToOrg(context, "org-123")).toBe(false);
	});

	it("should check organization membership", () => {
		const authContext = createBetterAuthContext();
		
		const context: QueryPermissionContext = {
			resource: "product",
			operation: "read",
			user: { ...mockUser, orgId: "org-123" }
		};

		expect(authContext.belongsToOrg(context, "org-123")).toBe(true);
		expect(authContext.belongsToOrg(context, "org-456")).toBe(false);
	});
});