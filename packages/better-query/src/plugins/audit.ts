import { z } from "zod";
import { createCrudEndpoint } from "../endpoints/crud-endpoint";
import { CrudHookContext } from "../types";
import { Plugin } from "../types/plugins";

/**
 * Audit plugin options
 */
export interface AuditPluginOptions {
	/** Whether to enable audit logging */
	enabled?: boolean;
	/** Operations to audit (default: all) */
	operations?: Array<"create" | "update" | "delete">;
	/** Custom audit logger function */
	logger?: (event: AuditEvent) => Promise<void> | void;
	/** Include request data in audit logs */
	includeRequestData?: boolean;
	/** Include response data in audit logs */
	includeResponseData?: boolean;
}

/**
 * Audit event structure
 */
export interface AuditEvent {
	timestamp: Date;
	operation: string;
	resource: string;
	recordId?: string;
	user?: any;
	ipAddress?: string;
	userAgent?: string;
	requestData?: any;
	responseData?: any;
	error?: string;
}

/**
 * Default audit logger - logs to console
 */
const defaultAuditLogger = (event: AuditEvent) => {
	console.log(
		`[AUDIT] ${event.timestamp.toISOString()} - ${event.operation.toUpperCase()} on ${
			event.resource
		}`,
		{
			recordId: event.recordId,
			user: event.user?.id || "anonymous",
			ipAddress: event.ipAddress,
			error: event.error,
		},
	);
};

/**
 * Audit plugin factory
 */
export function auditPlugin(options: AuditPluginOptions = {}): Plugin {
	const {
		enabled = true,
		operations = ["create", "update", "delete"],
		logger = defaultAuditLogger,
		includeRequestData = false,
		includeResponseData = false,
	} = options;

	if (!enabled) {
		return {
			id: "audit",
			endpoints: {},
		};
	}

	const createAuditLog = async (context: CrudHookContext, error?: string) => {
		if (!operations.includes(context.operation as any)) {
			return;
		}

		const event: AuditEvent = {
			timestamp: new Date(),
			operation: context.operation,
			resource: context.resource,
			recordId: context.id,
			user: context.user,
			ipAddress:
				context.request?.headers?.get?.("x-forwarded-for") ||
				context.request?.headers?.get?.("x-real-ip") ||
				context.request?.ip,
			userAgent: context.request?.headers?.get?.("user-agent"),
			requestData: includeRequestData ? context.data : undefined,
			responseData: includeResponseData ? context.result : undefined,
			error,
		};

		try {
			await logger(event);
		} catch (logError) {
			console.error("Failed to write audit log:", logError);
		}
	};

	return {
		id: "audit",

		endpoints: {
			getAuditLogs: createCrudEndpoint(
				"/audit/logs",
				{
					method: "GET",
					query: z
						.object({
							resource: z.string().optional(),
							operation: z.string().optional(),
							user: z.string().optional(),
							startDate: z.string().optional(),
							endDate: z.string().optional(),
							page: z
								.string()
								.optional()
								.transform((val) => (val ? parseInt(val) : 1)),
							limit: z
								.string()
								.optional()
								.transform((val) => (val ? parseInt(val) : 50)),
						})
						.optional(),
				},
				async (ctx) => {
					// This would typically query an audit table
					// For now, return a placeholder response
					return ctx.json({
						message:
							"Audit logs endpoint - requires audit table implementation",
						query: ctx.query,
					});
				},
			),
		},

		schema: {
			audit_logs: {
				fields: {
					id: {
						type: "string",
						required: true,
					},
					timestamp: {
						type: "date",
						required: true,
					},
					operation: {
						type: "string",
						required: true,
					},
					resource: {
						type: "string",
						required: true,
					},
					record_id: {
						type: "string",
						required: false,
					},
					user_id: {
						type: "string",
						required: false,
					},
					ip_address: {
						type: "string",
						required: false,
					},
					user_agent: {
						type: "string",
						required: false,
					},
					request_data: {
						type: "json",
						required: false,
					},
					response_data: {
						type: "json",
						required: false,
					},
					error: {
						type: "string",
						required: false,
					},
					created_at: {
						type: "date",
						required: true,
						default: "now()",
					},
				},
			},
		},

		hooks: {
			afterCreate: (context) => createAuditLog(context),
			afterUpdate: (context) => createAuditLog(context),
			afterDelete: (context) => createAuditLog(context),
		},

		options,
	};
}
