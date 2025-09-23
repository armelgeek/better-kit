import { describe, it, expect, vi } from "vitest";
import { HookExecutor, AuditLogger, HookUtils } from "../utils/hooks";
import { CrudHookContext, AuditEvent } from "../types";

describe("Hooks Utils", () => {
	describe("HookExecutor", () => {
		it("should execute hook function when provided", async () => {
			const mockHook = vi.fn();
			const context: CrudHookContext = {
				user: { id: "user123" },
				resource: "product",
				operation: "create",
				data: { name: "Test Product" },
				adapter: {} as any,
			};

			await HookExecutor.executeHook(mockHook, context);
			expect(mockHook).toHaveBeenCalledWith(context);
		});

		it("should not error when hook is undefined", async () => {
			const context: CrudHookContext = {
				user: { id: "user123" },
				resource: "product",
				operation: "create",
				data: { name: "Test Product" },
				adapter: {} as any,
			};

			await expect(HookExecutor.executeHook(undefined, context)).resolves.not.toThrow();
		});

		it("should execute correct before hook based on operation", async () => {
			const onCreate = vi.fn();
			const onUpdate = vi.fn();
			const onDelete = vi.fn();
			
			const hooks = { onCreate, onUpdate, onDelete };

			const createContext: CrudHookContext = {
				user: { id: "user123" },
				resource: "product",
				operation: "create",
				data: { name: "Test Product" },
				adapter: {} as any,
			};

			await HookExecutor.executeBefore(hooks, createContext);
			expect(onCreate).toHaveBeenCalledWith(createContext);
			expect(onUpdate).not.toHaveBeenCalled();
			expect(onDelete).not.toHaveBeenCalled();
		});

		it("should execute beforeCreate hook when using new naming convention", async () => {
			const beforeCreate = vi.fn();
			const beforeUpdate = vi.fn();
			const beforeDelete = vi.fn();
			
			const hooks = { beforeCreate, beforeUpdate, beforeDelete };

			const createContext: CrudHookContext = {
				user: { id: "user123" },
				resource: "product",
				operation: "create",
				data: { name: "Test Product" },
				adapter: {} as any,
			};

			await HookExecutor.executeBefore(hooks, createContext);
			expect(beforeCreate).toHaveBeenCalledWith(createContext);
			expect(beforeUpdate).not.toHaveBeenCalled();
			expect(beforeDelete).not.toHaveBeenCalled();
		});

		it("should prioritize onCreate over beforeCreate when both are present", async () => {
			const onCreate = vi.fn();
			const beforeCreate = vi.fn();
			
			const hooks = { onCreate, beforeCreate };

			const createContext: CrudHookContext = {
				user: { id: "user123" },
				resource: "product",
				operation: "create",
				data: { name: "Test Product" },
				adapter: {} as any,
			};

			await HookExecutor.executeBefore(hooks, createContext);
			expect(onCreate).toHaveBeenCalledWith(createContext);
			expect(beforeCreate).not.toHaveBeenCalled();
		});

		it("should execute beforeUpdate hook for update operations", async () => {
			const beforeUpdate = vi.fn();
			
			const hooks = { beforeUpdate };

			const updateContext: CrudHookContext = {
				user: { id: "user123" },
				resource: "product",
				operation: "update",
				data: { name: "Updated Product" },
				adapter: {} as any,
			};

			await HookExecutor.executeBefore(hooks, updateContext);
			expect(beforeUpdate).toHaveBeenCalledWith(updateContext);
		});

		it("should execute beforeDelete hook for delete operations", async () => {
			const beforeDelete = vi.fn();
			
			const hooks = { beforeDelete };

			const deleteContext: CrudHookContext = {
				user: { id: "user123" },
				resource: "product",
				operation: "delete",
				id: "prod123",
				adapter: {} as any,
			};

			await HookExecutor.executeBefore(hooks, deleteContext);
			expect(beforeDelete).toHaveBeenCalledWith(deleteContext);
		});

		it("should execute correct after hook based on operation", async () => {
			const afterCreate = vi.fn();
			const afterUpdate = vi.fn();
			const afterDelete = vi.fn();
			
			const hooks = { afterCreate, afterUpdate, afterDelete };

			const updateContext: CrudHookContext = {
				user: { id: "user123" },
				resource: "product",
				operation: "update",
				data: { name: "Updated Product" },
				result: { id: "prod123", name: "Updated Product" },
				adapter: {} as any,
			};

			await HookExecutor.executeAfter(hooks, updateContext);
			expect(afterUpdate).toHaveBeenCalledWith(updateContext);
			expect(afterCreate).not.toHaveBeenCalled();
			expect(afterDelete).not.toHaveBeenCalled();
		});
	});

	describe("AuditLogger", () => {
		it("should log audit events when enabled", async () => {
			const mockAuditFn = vi.fn();
			const logger = new AuditLogger(mockAuditFn, ["create", "update"]);

			const event = {
				user: { id: "user123" },
				resource: "product",
				operation: "create" as const,
				recordId: "prod123",
				dataAfter: { id: "prod123", name: "Test Product" },
			};

			await logger.log(event);
			
			expect(mockAuditFn).toHaveBeenCalledWith({
				...event,
				timestamp: expect.any(Date),
			});
		});

		it("should not log when operation is not enabled", async () => {
			const mockAuditFn = vi.fn();
			const logger = new AuditLogger(mockAuditFn, ["create"]); // Only create enabled

			const event = {
				user: { id: "user123" },
				resource: "product",
				operation: "delete" as const,
				recordId: "prod123",
			};

			await logger.log(event);
			expect(mockAuditFn).not.toHaveBeenCalled();
		});

		it("should handle errors in audit function", async () => {
			const errorAuditFn = vi.fn().mockRejectedValue(new Error("Audit failed"));
			const logger = new AuditLogger(errorAuditFn);
			const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

			const event = {
				user: { id: "user123" },
				resource: "product",
				operation: "create" as const,
				recordId: "prod123",
			};

			await logger.log(event);
			expect(consoleSpy).toHaveBeenCalledWith("Failed to log audit event:", expect.any(Error));
			
			consoleSpy.mockRestore();
		});

		it("should create audit event from context", async () => {
			const mockAuditFn = vi.fn();
			const logger = new AuditLogger(mockAuditFn);

			const context: CrudHookContext = {
				user: { id: "user123", email: "user@example.com" },
				resource: "product",
				operation: "update",
				id: "prod123",
				data: { name: "Updated Product" },
				request: {
					ip: "192.168.1.1",
					headers: { "user-agent": "Test Agent" },
				},
				adapter: {} as any,
			};

			const dataBefore = { id: "prod123", name: "Old Product" };
			const dataAfter = { id: "prod123", name: "Updated Product" };

			await logger.logFromContext(context, dataBefore, dataAfter);

			expect(mockAuditFn).toHaveBeenCalledWith({
				timestamp: expect.any(Date),
				user: context.user,
				resource: "product",
				operation: "update",
				recordId: "prod123",
				dataBefore,
				dataAfter,
				ipAddress: "192.168.1.1",
				userAgent: "Test Agent",
				metadata: expect.objectContaining({
					timestamp: expect.any(String),
					userAgent: "Test Agent",
				}),
			});
		});
	});

	describe("HookUtils", () => {
		describe("timestampHook", () => {
			it("should add timestamps for create operation", async () => {
				const context: CrudHookContext = {
					user: { id: "user123" },
					resource: "product",
					operation: "create",
					data: { name: "Test Product" },
					adapter: {} as any,
				};

				await HookUtils.timestampHook(context);

				expect(context.data?.createdAt).toBeInstanceOf(Date);
				expect(context.data?.updatedAt).toBeInstanceOf(Date);
			});

			it("should add updatedAt for update operation", async () => {
				const context: CrudHookContext = {
					user: { id: "user123" },
					resource: "product",
					operation: "update",
					data: { name: "Updated Product" },
					adapter: {} as any,
				};

				await HookUtils.timestampHook(context);

				expect(context.data?.updatedAt).toBeInstanceOf(Date);
				expect(context.data?.createdAt).toBeUndefined();
			});
		});

		describe("userTrackingHook", () => {
			it("should add user ID for create operation", async () => {
				const hook = HookUtils.userTrackingHook("createdBy");
				const context: CrudHookContext = {
					user: { id: "user123" },
					resource: "product",
					operation: "create",
					data: { name: "Test Product" },
					adapter: {} as any,
				};

				await hook(context);

				expect(context.data?.createdBy).toBe("user123");
			});

			it("should not add user ID for non-create operations", async () => {
				const hook = HookUtils.userTrackingHook("createdBy");
				const context: CrudHookContext = {
					user: { id: "user123" },
					resource: "product",
					operation: "update",
					data: { name: "Updated Product" },
					adapter: {} as any,
				};

				await hook(context);

				expect(context.data?.createdBy).toBeUndefined();
			});
		});

		describe("validationHook", () => {
			it("should pass when validation succeeds", async () => {
				const validationFn = vi.fn().mockReturnValue(true);
				const hook = HookUtils.validationHook(validationFn);
				
				const context: CrudHookContext = {
					user: { id: "user123" },
					resource: "product",
					operation: "create",
					data: { name: "Test Product", price: 100 },
					adapter: {} as any,
				};

				await expect(hook(context)).resolves.not.toThrow();
				expect(validationFn).toHaveBeenCalledWith(context.data);
			});

			it("should throw when validation fails", async () => {
				const validationFn = vi.fn().mockReturnValue(false);
				const hook = HookUtils.validationHook(validationFn);
				
				const context: CrudHookContext = {
					user: { id: "user123" },
					resource: "product",
					operation: "create",
					data: { name: "", price: -10 },
					adapter: {} as any,
				};

				await expect(hook(context)).rejects.toThrow("Custom validation failed");
			});
		});
	});
});