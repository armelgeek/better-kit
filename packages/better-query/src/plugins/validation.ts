import { Plugin } from "../types/plugins";
import { CrudHookContext } from "../types";
import { ZodSchema, z } from "zod";

/**
 * Validation plugin options
 */
export interface ValidationPluginOptions {
	/** Whether to enable strict validation */
	strict?: boolean;
	/** Custom validation rules per resource */
	rules?: Record<string, {
		create?: ZodSchema;
		update?: ZodSchema;
		customValidation?: (data: any, context: CrudHookContext) => Promise<string[]> | string[];
	}>;
	/** Global validation rules */
	globalRules?: {
		/** Sanitize HTML input */
		sanitizeHtml?: boolean;
		/** Trim whitespace */
		trimStrings?: boolean;
		/** Validate email formats */
		validateEmails?: boolean;
		/** Custom global validator */
		customGlobalValidation?: (data: any, context: CrudHookContext) => Promise<string[]> | string[];
	};
}

/**
 * Validation error class
 */
export class ValidationError extends Error {
	constructor(
		public errors: string[],
		message = "Validation failed"
	) {
		super(message);
		this.name = "ValidationError";
	}
}

/**
 * Validation plugin factory
 */
export function validationPlugin(options: ValidationPluginOptions = {}): Plugin {
	const {
		strict = true,
		rules = {},
		globalRules = {},
	} = options;

	const validateData = async (context: CrudHookContext): Promise<void> => {
		const { resource, operation, data } = context;
		const errors: string[] = [];

		if (!data) return;

		// Apply global rules
		let processedData = { ...data };

		if (globalRules.trimStrings) {
			processedData = trimStringFields(processedData);
		}

		if (globalRules.sanitizeHtml) {
			processedData = sanitizeHtmlFields(processedData);
		}

		if (globalRules.validateEmails) {
			const emailErrors = validateEmailFields(processedData);
			errors.push(...emailErrors);
		}

		// Apply custom global validation
		if (globalRules.customGlobalValidation) {
			const globalErrors = await globalRules.customGlobalValidation(processedData, context);
			errors.push(...globalErrors);
		}

		// Apply resource-specific rules
		const resourceRules = rules[resource];
		if (resourceRules) {
			// Schema validation
			if (operation === "create" && resourceRules.create) {
				try {
					resourceRules.create.parse(processedData);
				} catch (error) {
					if (error instanceof z.ZodError) {
						errors.push(...error.errors.map(e => `${e.path.join('.')}: ${e.message}`));
					}
				}
			} else if (operation === "update" && resourceRules.update) {
				try {
					resourceRules.update.parse(processedData);
				} catch (error) {
					if (error instanceof z.ZodError) {
						errors.push(...error.errors.map(e => `${e.path.join('.')}: ${e.message}`));
					}
				}
			}

			// Custom validation
			if (resourceRules.customValidation) {
				const customErrors = await resourceRules.customValidation(processedData, context);
				errors.push(...customErrors);
			}
		}

		// Update context data with processed data
		context.data = processedData;

		// Throw error if validation failed and strict mode is enabled
		if (errors.length > 0 && strict) {
			throw new ValidationError(errors);
		} else if (errors.length > 0) {
			console.warn(`Validation warnings for ${resource}.${operation}:`, errors);
		}
	};

	return {
		id: "validation",
		
		endpoints: {},

		hooks: {
			beforeCreate: validateData,
			beforeUpdate: validateData,
		},

		options,
	};
}

/**
 * Utility functions for validation
 */

function trimStringFields(data: any): any {
	const result = { ...data };
	
	for (const [key, value] of Object.entries(result)) {
		if (typeof value === "string") {
			result[key] = value.trim();
		}
	}
	
	return result;
}

function sanitizeHtmlFields(data: any): any {
	const result = { ...data };
	
	for (const [key, value] of Object.entries(result)) {
		if (typeof value === "string") {
			// Basic HTML sanitization - in a real implementation, use a proper HTML sanitizer
			result[key] = value
				.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
				.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
				.replace(/on\w+="[^"]*"/gi, '')
				.replace(/javascript:/gi, '');
		}
	}
	
	return result;
}

function validateEmailFields(data: any): string[] {
	const errors: string[] = [];
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	
	for (const [key, value] of Object.entries(data)) {
		if (typeof value === "string" && key.toLowerCase().includes("email")) {
			if (!emailRegex.test(value)) {
				errors.push(`${key}: Invalid email format`);
			}
		}
	}
	
	return errors;
}