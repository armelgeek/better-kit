import { ZodSchema } from "zod";
import { SanitizationRule, SecurityContext, CrudPermissionContext, UserScope } from "../types";

/**
 * Sanitize input data based on rules
 */
export function sanitizeData(data: any, rules: SanitizationRule[]): any {
	if (!data || !rules || rules.length === 0) {
		return data;
	}

	let sanitized = data;

	for (const rule of rules) {
		sanitized = applySanitizationRule(sanitized, rule);
	}

	return sanitized;
}

/**
 * Apply a single sanitization rule to data
 */
export function applySanitizationRule(data: any, rule: SanitizationRule): any {
	if (typeof data === "string") {
		switch (rule.type) {
			case "trim":
				return data.trim();
			case "escape":
				return escapeHtml(data);
			case "lowercase":
				return data.toLowerCase();
			case "uppercase":
				return data.toUpperCase();
			case "strip":
				return data.replace(/[<>]/g, "");
			case "custom":
				return rule.customFn ? rule.customFn(data) : data;
			default:
				return data;
		}
	}

	if (typeof data === "object" && data !== null) {
		const sanitized: any = Array.isArray(data) ? [] : {};
		
		for (const [key, value] of Object.entries(data)) {
			sanitized[key] = applySanitizationRule(value, rule);
		}
		
		return sanitized;
	}

	return data;
}

/**
 * Basic HTML escape function
 */
function escapeHtml(text: string): string {
	const map: Record<string, string> = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#039;'
	};
	
	return text.replace(/[&<>"']/g, (m: string) => map[m] || m);
}

/**
 * Sanitize specific fields in data
 */
export function sanitizeFields(
	data: any, 
	fieldRules: Record<string, SanitizationRule[]>
): any {
	if (!data || !fieldRules) {
		return data;
	}

	const sanitized = { ...data };

	for (const [field, rules] of Object.entries(fieldRules)) {
		if (field in sanitized) {
			sanitized[field] = sanitizeData(sanitized[field], rules);
		}
	}

	return sanitized;
}

/**
 * Check if user has required scopes
 */
export function hasRequiredScopes(
	userScopes: string[] = [], 
	requiredScopes: string[] = []
): boolean {
	if (requiredScopes.length === 0) {
		return true; // No scopes required
	}

	return requiredScopes.every(scope => userScopes.includes(scope));
}

/**
 * Check ownership of a resource
 */
export function checkOwnership(
	user: any, 
	data: any, 
	ownershipField: string,
	strategy: "strict" | "flexible" = "strict"
): boolean {
	if (!user || !data || !ownershipField) {
		return false;
	}

	const resourceOwnerId = data[ownershipField];
	const userId = user.id || user.userId;

	// Strict ownership check
	if (strategy === "strict") {
		return resourceOwnerId === userId;
	}

	// Flexible ownership - allow admins or elevated roles
	if (strategy === "flexible") {
		// Check if user is the owner
		if (resourceOwnerId === userId) {
			return true;
		}
		
		// Check if user has admin privileges
		const userRoles = user.roles || user.scopes || [];
		const adminRoles = ["admin", "super_admin", "administrator"];
		
		return adminRoles.some(role => userRoles.includes(role));
	}

	return false;
}

/**
 * Extract security context from request
 */
export function extractSecurityContext(request: any): SecurityContext {
	return {
		user: request.user || null,
		scopes: request.user?.scopes || request.user?.roles || [],
		ipAddress: request.ip || request.headers?.['x-forwarded-for'] || request.headers?.['x-real-ip'],
		userAgent: request.headers?.['user-agent'],
		session: request.session || null,
	};
}

/**
 * Enhanced permission checker with scopes and ownership
 */
export async function checkEnhancedPermissions(
	context: CrudPermissionContext,
	requiredScopes?: string[],
	ownershipConfig?: { field: string; strategy: "strict" | "flexible" }
): Promise<boolean> {
	const { user, scopes = [], existingData } = context;

	// Check if user has required scopes
	if (requiredScopes && !hasRequiredScopes(scopes, requiredScopes)) {
		return false;
	}

	// Check ownership if configured
	if (ownershipConfig && existingData) {
		return checkOwnership(
			user, 
			existingData, 
			ownershipConfig.field, 
			ownershipConfig.strategy
		);
	}

	return true;
}

/**
 * Rate limiting utility (simple in-memory implementation)
 */
class RateLimiter {
	public requests: Map<string, number[]> = new Map();

	public isAllowed(key: string, windowMs: number, maxRequests: number): boolean {
		const now = Date.now();
		const windowStart = now - windowMs;
		
		// Get existing requests for this key
		const keyRequests = this.requests.get(key) || [];
		
		// Filter out old requests outside the window
		const recentRequests = keyRequests.filter(time => time > windowStart);
		
		// Check if we're within the limit
		if (recentRequests.length >= maxRequests) {
			return false;
		}
		
		// Add current request
		recentRequests.push(now);
		this.requests.set(key, recentRequests);
		
		return true;
	}

	public cleanup(): void {
		const now = Date.now();
		const maxAge = 60 * 60 * 1000; // 1 hour
		
		for (const [key, requests] of this.requests.entries()) {
			const validRequests = requests.filter(time => now - time < maxAge);
			if (validRequests.length === 0) {
				this.requests.delete(key);
			} else {
				this.requests.set(key, validRequests);
			}
		}
	}
	
	public clear(): void {
		this.requests.clear();
	}
}

export const rateLimiter = new RateLimiter();

/**
 * Validate input against schema with enhanced error reporting
 */
export function validateAndSanitizeInput(
	schema: ZodSchema,
	data: any,
	sanitizationRules?: SanitizationRule[]
): { success: boolean; data?: any; errors?: any } {
	try {
		// First sanitize the input
		let sanitizedData = data;
		if (sanitizationRules) {
			sanitizedData = sanitizeData(data, sanitizationRules);
		}

		// Then validate with Zod
		const validated = schema.parse(sanitizedData);
		
		return {
			success: true,
			data: validated,
		};
	} catch (error: any) {
		return {
			success: false,
			errors: error.errors || [{ message: "Validation failed" }],
		};
	}
}