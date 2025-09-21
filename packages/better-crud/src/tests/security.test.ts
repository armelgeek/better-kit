import { describe, it, expect, beforeEach } from "vitest";
import { z } from "zod";
import { 
	sanitizeData, 
	applySanitizationRule, 
	hasRequiredScopes, 
	checkOwnership, 
	validateAndSanitizeInput,
	rateLimiter 
} from "../utils/security";
import { SanitizationRule } from "../types";

describe("Security Utils", () => {
	describe("sanitizeData", () => {
		it("should trim whitespace", () => {
			const rules: SanitizationRule[] = [{ type: "trim" }];
			const result = sanitizeData("  hello world  ", rules);
			expect(result).toBe("hello world");
		});

		it("should escape HTML characters", () => {
			const rules: SanitizationRule[] = [{ type: "escape" }];
			const result = sanitizeData("<script>alert('xss')</script>", rules);
			expect(result).toBe("&lt;script&gt;alert(&#039;xss&#039;)&lt;/script&gt;");
		});

		it("should apply multiple rules", () => {
			const rules: SanitizationRule[] = [
				{ type: "trim" },
				{ type: "lowercase" }
			];
			const result = sanitizeData("  HELLO WORLD  ", rules);
			expect(result).toBe("hello world");
		});

		it("should handle custom sanitization", () => {
			const rules: SanitizationRule[] = [
				{ 
					type: "custom", 
					customFn: (value: string) => value.replace(/\d/g, "X") 
				}
			];
			const result = sanitizeData("abc123def", rules);
			expect(result).toBe("abcXXXdef");
		});

		it("should sanitize nested objects", () => {
			const rules: SanitizationRule[] = [{ type: "trim" }];
			const data = {
				name: "  John  ",
				profile: {
					bio: "  Software Engineer  "
				}
			};
			const result = sanitizeData(data, rules);
			expect(result.name).toBe("John");
			expect(result.profile.bio).toBe("Software Engineer");
		});
	});

	describe("hasRequiredScopes", () => {
		it("should return true when user has required scopes", () => {
			const userScopes = ["read", "write", "admin"];
			const requiredScopes = ["read", "write"];
			expect(hasRequiredScopes(userScopes, requiredScopes)).toBe(true);
		});

		it("should return false when user lacks required scopes", () => {
			const userScopes = ["read"];
			const requiredScopes = ["read", "write"];
			expect(hasRequiredScopes(userScopes, requiredScopes)).toBe(false);
		});

		it("should return true when no scopes are required", () => {
			const userScopes = ["read"];
			const requiredScopes: string[] = [];
			expect(hasRequiredScopes(userScopes, requiredScopes)).toBe(true);
		});

		it("should handle undefined user scopes", () => {
			const requiredScopes = ["read"];
			expect(hasRequiredScopes(undefined, requiredScopes)).toBe(false);
		});
	});

	describe("checkOwnership", () => {
		const user = { id: "user123" };
		const data = { userId: "user123", title: "My Document" };

		it("should allow access when user owns the resource (strict)", () => {
			expect(checkOwnership(user, data, "userId", "strict")).toBe(true);
		});

		it("should deny access when user does not own the resource (strict)", () => {
			const otherData = { userId: "user456", title: "Other Document" };
			expect(checkOwnership(user, otherData, "userId", "strict")).toBe(false);
		});

		it("should allow admin access (flexible)", () => {
			const adminUser = { id: "user456", roles: ["admin"] };
			expect(checkOwnership(adminUser, data, "userId", "flexible")).toBe(true);
		});

		it("should allow owner access (flexible)", () => {
			expect(checkOwnership(user, data, "userId", "flexible")).toBe(true);
		});

		it("should deny non-admin, non-owner access (flexible)", () => {
			const regularUser = { id: "user456", roles: ["user"] };
			const otherData = { userId: "user123", title: "Other Document" };
			expect(checkOwnership(regularUser, otherData, "userId", "flexible")).toBe(false);
		});
	});

	describe("validateAndSanitizeInput", () => {
		const schema = z.object({
			name: z.string(),
			email: z.string().email(),
			age: z.number().optional(),
		});

		it("should validate and sanitize valid input", () => {
			const input = {
				name: "  John Doe  ",
				email: "john@example.com",
				age: 30
			};
			const sanitizationRules: SanitizationRule[] = [{ type: "trim" }];
			
			const result = validateAndSanitizeInput(schema, input, sanitizationRules);
			
			expect(result.success).toBe(true);
			expect(result.data?.name).toBe("John Doe");
			expect(result.data?.email).toBe("john@example.com");
		});

		it("should return errors for invalid input", () => {
			const input = {
				name: "John Doe",
				email: "invalid-email",
			};
			
			const result = validateAndSanitizeInput(schema, input);
			
			expect(result.success).toBe(false);
			expect(result.errors).toBeDefined();
		});
	});

	describe("rateLimiter", () => {
		beforeEach(() => {
			// Clear rate limiter state
			rateLimiter.clear();
		});

		it("should allow requests within limit", () => {
			const key = "test-key-1";
			const windowMs = 60000; // 1 minute
			const maxRequests = 5;

			// First 5 requests should be allowed
			for (let i = 0; i < 5; i++) {
				expect(rateLimiter.isAllowed(key, windowMs, maxRequests)).toBe(true);
			}
		});

		it("should deny requests exceeding limit", () => {
			const key = "test-key-2";
			const windowMs = 60000; // 1 minute
			const maxRequests = 3;

			// First 3 requests should be allowed
			for (let i = 0; i < 3; i++) {
				expect(rateLimiter.isAllowed(key, windowMs, maxRequests)).toBe(true);
			}

			// 4th request should be denied
			expect(rateLimiter.isAllowed(key, windowMs, maxRequests)).toBe(false);
		});

		it("should handle different keys independently", () => {
			const windowMs = 60000;
			const maxRequests = 2;

			expect(rateLimiter.isAllowed("key1", windowMs, maxRequests)).toBe(true);
			expect(rateLimiter.isAllowed("key2", windowMs, maxRequests)).toBe(true);
			expect(rateLimiter.isAllowed("key1", windowMs, maxRequests)).toBe(true);
			expect(rateLimiter.isAllowed("key2", windowMs, maxRequests)).toBe(true);
			
			// Third request for each key should be denied
			expect(rateLimiter.isAllowed("key1", windowMs, maxRequests)).toBe(false);
			expect(rateLimiter.isAllowed("key2", windowMs, maxRequests)).toBe(false);
		});
	});
});