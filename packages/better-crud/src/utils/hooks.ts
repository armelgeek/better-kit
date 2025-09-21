import { CrudHookContext, CrudOperation, AuditEvent } from "../types";

/**
 * Hook executor that runs lifecycle hooks for CRUD operations
 */
export class HookExecutor {
	/**
	 * Execute a hook if it exists
	 */
	static async executeHook(
		hookFn: ((context: CrudHookContext) => Promise<void> | void) | undefined,
		context: CrudHookContext
	): Promise<void> {
		if (hookFn) {
			await hookFn(context);
		}
	}

	/**
	 * Execute before hooks (onCreate, onUpdate, onDelete)
	 */
	static async executeBefore(
		hooks: Record<string, any> | undefined,
		context: CrudHookContext
	): Promise<void> {
		if (!hooks) return;

		const { operation } = context;
		let hookFn: any;

		switch (operation) {
			case "create":
				hookFn = hooks.onCreate;
				break;
			case "update":
				hookFn = hooks.onUpdate;
				break;
			case "delete":
				hookFn = hooks.onDelete;
				break;
		}

		await this.executeHook(hookFn, context);
	}

	/**
	 * Execute after hooks (afterCreate, afterUpdate, afterDelete)
	 */
	static async executeAfter(
		hooks: Record<string, any> | undefined,
		context: CrudHookContext
	): Promise<void> {
		if (!hooks) return;

		const { operation } = context;
		let hookFn: any;

		switch (operation) {
			case "create":
				hookFn = hooks.afterCreate;
				break;
			case "update":
				hookFn = hooks.afterUpdate;
				break;
			case "delete":
				hookFn = hooks.afterDelete;
				break;
		}

		await this.executeHook(hookFn, context);
	}
}

/**
 * Audit logger utility
 */
export class AuditLogger {
	private auditFn?: (event: AuditEvent) => Promise<void> | void;
	private enabledOperations: CrudOperation[];

	constructor(
		auditFn?: (event: AuditEvent) => Promise<void> | void,
		enabledOperations: CrudOperation[] = ["create", "update", "delete"]
	) {
		this.auditFn = auditFn;
		this.enabledOperations = enabledOperations;
	}

	/**
	 * Log an audit event
	 */
	async log(event: Omit<AuditEvent, "timestamp">): Promise<void> {
		if (!this.auditFn || !this.enabledOperations.includes(event.operation)) {
			return;
		}

		const auditEvent: AuditEvent = {
			...event,
			timestamp: new Date(),
		};

		try {
			await this.auditFn(auditEvent);
		} catch (error) {
			console.error("Failed to log audit event:", error);
		}
	}

	/**
	 * Create audit event from CRUD context
	 */
	async logFromContext(
		context: CrudHookContext,
		dataBefore?: any,
		dataAfter?: any
	): Promise<void> {
		const { user, resource, operation, id, request } = context;

		await this.log({
			user,
			resource,
			operation,
			recordId: id,
			dataBefore,
			dataAfter,
			ipAddress: request?.ip || request?.headers?.['x-forwarded-for'],
			userAgent: request?.headers?.['user-agent'],
			metadata: {
				timestamp: new Date().toISOString(),
				userAgent: request?.headers?.['user-agent'],
				requestId: request?.id,
			},
		});
	}
}

/**
 * Default audit logger implementation (console logging)
 */
export const defaultAuditLogger = (event: AuditEvent): void => {
	console.log(`[AUDIT] ${event.timestamp.toISOString()} - ${event.operation.toUpperCase()} on ${event.resource}`, {
		user: event.user?.id || event.user?.email || "anonymous",
		recordId: event.recordId,
		ipAddress: event.ipAddress,
	});
};

/**
 * Middleware to automatically set up hooks and audit logging
 */
export function createHookMiddleware(
	hooks?: Record<string, any>,
	auditLogger?: AuditLogger
) {
	return async (context: any, next: () => Promise<void>) => {
		// Store hooks and audit logger in context for later use
		context.hooks = hooks;
		context.auditLogger = auditLogger;
		
		await next();
	};
}

/**
 * Common hook utilities
 */
export const HookUtils = {
	/**
	 * Timestamp hook - adds timestamps to data
	 */
	timestampHook: async (context: CrudHookContext): Promise<void> => {
		if (context.operation === "create") {
			if (context.data) {
				context.data.createdAt = new Date();
				context.data.updatedAt = new Date();
			}
		} else if (context.operation === "update") {
			if (context.data) {
				context.data.updatedAt = new Date();
			}
		}
	},

	/**
	 * User tracking hook - adds user ID to data
	 */
	userTrackingHook: (userField = "userId") => async (context: CrudHookContext): Promise<void> => {
		if (context.operation === "create" && context.user && context.data) {
			context.data[userField] = context.user.id || context.user.userId;
		}
	},

	/**
	 * Soft delete hook - marks records as deleted instead of removing them
	 */
	softDeleteHook: async (context: CrudHookContext): Promise<void> => {
		if (context.operation === "delete" && context.id) {
			// Instead of deleting, update the record with deletedAt timestamp
			await context.adapter.update({
				model: context.resource,
				where: [{ field: "id", value: context.id }],
				data: {
					deletedAt: new Date(),
					isDeleted: true,
				},
			});
		}
	},

	/**
	 * Validation hook - additional custom validation
	 */
	validationHook: (validationFn: (data: any) => Promise<boolean> | boolean) => 
		async (context: CrudHookContext): Promise<void> => {
			if ((context.operation === "create" || context.operation === "update") && context.data) {
				const isValid = await validationFn(context.data);
				if (!isValid) {
					throw new Error("Custom validation failed");
				}
			}
		},

	/**
	 * Notification hook - send notifications on changes
	 */
	notificationHook: (notifyFn: (context: CrudHookContext) => Promise<void> | void) => 
		async (context: CrudHookContext): Promise<void> => {
			await notifyFn(context);
		},
};