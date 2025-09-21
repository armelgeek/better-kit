import { CrudClientPlugin, CrudClientPluginFactory } from "./types";

export interface ClientAuditOptions {
	/**
	 * Enable/disable the audit plugin
	 */
	enabled?: boolean;
	
	/**
	 * Operations to log
	 */
	operations?: ("create" | "read" | "update" | "delete" | "list")[];
	
	/**
	 * Resources to audit
	 */
	resources?: string[];
	
	/**
	 * Custom log function
	 */
	onLog?: (event: AuditEvent) => void;
	
	/**
	 * Log to console
	 */
	logToConsole?: boolean;
}

export interface AuditEvent {
	timestamp: Date;
	resource: string;
	operation: string;
	url: string;
	method: string;
	requestData?: any;
	responseData?: any;
	duration?: number;
	success: boolean;
	error?: string;
	userId?: string;
	sessionId?: string;
}

/**
 * Client-side audit plugin for CRUD operations
 * Logs all CRUD operations performed by the client
 */
export const auditClientPlugin: CrudClientPluginFactory<ClientAuditOptions> = (options = {}) => {
	const {
		enabled = true,
		operations = ["create", "read", "update", "delete", "list"],
		resources,
		onLog,
		logToConsole = true,
	} = options;

	if (!enabled) {
		return {
			id: "crud-audit-client",
			name: "CRUD Audit Client",
			description: "Audit CRUD operations on the client side",
		};
	}

	let requestStartTime: number;

	const logEvent = (event: AuditEvent) => {
		if (logToConsole) {
			console.log("🔍 CRUD Audit:", event);
		}
		if (onLog) {
			onLog(event);
		}
	};

	const extractCrudInfo = (url: string | URL) => {
		// Extract resource and operation from URL
		// Assumes URL pattern: /api/resource or /api/resource/id
		const urlStr = typeof url === "string" ? url : url.toString();
		const urlPath = new URL(urlStr, "http://localhost").pathname;
		const segments = urlPath.split("/").filter(Boolean);
		
		if (segments.length >= 1) {
			const resource = segments[segments.length - 1];
			if (!resource) return null;
			// Check if this matches our target resources
			if (resources && !resources.includes(resource)) {
				return null;
			}
			return { resource };
		}
		return null;
	};

	const getOperationType = (method: string, hasId: boolean): string => {
		switch (method.toUpperCase()) {
			case "POST":
				return "create";
			case "GET":
				return hasId ? "read" : "list";
			case "PUT":
			case "PATCH":
				return "update";
			case "DELETE":
				return "delete";
			default:
				return "unknown";
		}
	};

	return {
		id: "crud-audit-client",
		name: "CRUD Audit Client",
		description: "Audit CRUD operations on the client side",
		hooks: {
			onRequest(context) {
				const crudInfo = extractCrudInfo(context.url);
				if (!crudInfo) return;

				const urlStr = typeof context.url === "string" ? context.url : context.url.toString();
				const hasId = urlStr.split("/").length > 4; // Rough check for ID in URL
				const operation = getOperationType(context.method || "GET", hasId);
				
				if (!operations.includes(operation as any)) return;

				requestStartTime = Date.now();
				
				// Store audit info in context for later use
				(context as any).auditInfo = {
					resource: crudInfo.resource,
					operation,
					startTime: requestStartTime,
				};

				return context;
			},
			
			onSuccess(context) {
				const auditInfo = (context.request as any).auditInfo;
				if (!auditInfo) return;

				const duration = Date.now() - auditInfo.startTime;
				const requestUrl = typeof context.request.url === "string" ? context.request.url : context.request.url.toString();
				const event: AuditEvent = {
					timestamp: new Date(),
					resource: auditInfo.resource,
					operation: auditInfo.operation,
					url: requestUrl,
					method: context.request.method || "GET",
					requestData: context.request.body,
					responseData: context.data,
					duration,
					success: true,
				};

				logEvent(event);
			},
			
			onError(context) {
				const auditInfo = (context.request as any).auditInfo;
				if (!auditInfo) return;

				const duration = Date.now() - auditInfo.startTime;
				const requestUrl = typeof context.request.url === "string" ? context.request.url : context.request.url.toString();
				const event: AuditEvent = {
					timestamp: new Date(),
					resource: auditInfo.resource,
					operation: auditInfo.operation,
					url: requestUrl,
					method: context.request.method || "GET",
					requestData: context.request.body,
					duration,
					success: false,
					error: context.error.message,
				};

				logEvent(event);
			},
		},
		crudOptions: {
			resources,
			operations,
			enabled,
		},
	};
};