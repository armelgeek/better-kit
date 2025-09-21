import { CrudClientPlugin, CrudClientPluginFactory } from "./types";
import { z, ZodSchema } from "zod";

export interface ClientValidationOptions {
	/**
	 * Enable/disable the validation plugin
	 */
	enabled?: boolean;
	
	/**
	 * Resource schemas for validation
	 */
	schemas?: Record<string, {
		create?: ZodSchema;
		update?: ZodSchema;
		query?: ZodSchema;
	}>;
	
	/**
	 * Global validation rules
	 */
	globalRules?: {
		trimStrings?: boolean;
		validateEmails?: boolean;
		sanitizeInput?: boolean;
	};
	
	/**
	 * Strict mode - throw errors on validation failure
	 */
	strict?: boolean;
	
	/**
	 * Custom validation error handler
	 */
	onValidationError?: (error: ValidationError, context: any) => void;
}

export class ValidationError extends Error {
	constructor(
		message: string,
		public errors: any[],
		public resource: string,
		public operation: string,
	) {
		super(message);
		this.name = "ValidationError";
	}
}

/**
 * Client-side validation plugin for CRUD operations
 * Validates data before sending to the server
 */
export const validationClientPlugin: CrudClientPluginFactory<ClientValidationOptions> = (options = {}) => {
	const {
		enabled = true,
		schemas = {},
		globalRules = {},
		strict = false,
		onValidationError,
	} = options;

	if (!enabled) {
		return {
			id: "crud-validation-client",
			name: "CRUD Validation Client",
			description: "Validate CRUD operations on the client side",
		};
	}

	const applyGlobalRules = (data: any): any => {
		if (!data || typeof data !== "object") return data;

		const processedData = { ...data };

		// Trim strings
		if (globalRules.trimStrings) {
			for (const [key, value] of Object.entries(processedData)) {
				if (typeof value === "string") {
					processedData[key] = value.trim();
				}
			}
		}

		// Validate emails
		if (globalRules.validateEmails) {
			for (const [key, value] of Object.entries(processedData)) {
				if (typeof value === "string" && key.toLowerCase().includes("email")) {
					const emailSchema = z.string().email();
					try {
						emailSchema.parse(value);
					} catch {
						throw new ValidationError(
							`Invalid email format for field: ${key}`,
							[{ field: key, message: "Invalid email format" }],
							"unknown",
							"unknown",
		);
					}
				}
			}
		}

		// Basic sanitization
		if (globalRules.sanitizeInput) {
			for (const [key, value] of Object.entries(processedData)) {
				if (typeof value === "string") {
					// Remove potential XSS patterns
					processedData[key] = value
						.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
						.replace(/javascript:/gi, "")
						.replace(/on\w+\s*=/gi, "");
				}
			}
		}

		return processedData;
	};

	const extractResourceFromUrl = (url: string | URL): string | null => {
		const urlStr = typeof url === "string" ? url : url.toString();
		const urlPath = new URL(urlStr, "http://localhost").pathname;
		const segments = urlPath.split("/").filter(Boolean);
		return segments.length >= 1 ? (segments[segments.length - 1] || null) : null;
	};

	const getOperationType = (method: string, hasId: boolean): string => {
		switch (method.toUpperCase()) {
			case "POST":
				return "create";
			case "PUT":
			case "PATCH":
				return "update";
			case "GET":
				return "query";
			default:
				return "unknown";
		}
	};

	const validateData = (data: any, schema: ZodSchema, resource: string, operation: string) => {
		try {
			return schema.parse(data);
		} catch (error) {
			if (error instanceof z.ZodError) {
				const validationError = new ValidationError(
					`Validation failed for ${resource} ${operation}`,
					error.errors,
					resource,
					operation,
				);

				if (onValidationError) {
					onValidationError(validationError, { resource, operation, data });
				}

				if (strict) {
					throw validationError;
				} else {
					console.warn("⚠️ Validation Warning:", validationError.message, validationError.errors);
					return data; // Return original data if not in strict mode
				}
			}
			throw error;
		}
	};

	return {
		id: "crud-validation-client",
		name: "CRUD Validation Client",
		description: "Validate CRUD operations on the client side",
		hooks: {
			onRequest(context) {
				const method = context.method || "GET";
				const resource = extractResourceFromUrl(context.url);
				
				if (!resource || !context.body) {
					return context;
				}

				const urlStr = typeof context.url === "string" ? context.url : context.url.toString();
				const hasId = urlStr.split("/").length > 4;
				const operation = getOperationType(method, hasId);
				
				// Apply global rules
				try {
					context.body = applyGlobalRules(context.body);
				} catch (error) {
					if (strict) {
						throw error;
					} else {
						console.warn("⚠️ Global validation warning:", error);
					}
				}

				// Apply schema validation
				const resourceSchemas = schemas[resource];
				if (resourceSchemas) {
					let schema: ZodSchema | undefined;
					
					switch (operation) {
						case "create":
							schema = resourceSchemas.create;
							break;
						case "update":
							schema = resourceSchemas.update;
							break;
						case "query":
							schema = resourceSchemas.query;
							break;
					}

					if (schema) {
						context.body = validateData(context.body, schema, resource, operation);
					}
				}

				return context;
			},
		},
		crudOptions: {
			enabled,
		},
	};
};