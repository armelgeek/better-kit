import type {
	QueryHookContext,
	QueryMiddleware,
	QueryPermissionContext,
} from "../types";
import type { Plugin } from "../types/plugins";
import { extractSecurityContext } from "../utils/security";

/**
 * Better Auth integration plugin for better-query
 * Provides seamless integration with Better Auth for user context and permissions
 */

export interface BetterAuthUser {
	id: string;
	email: string;
	name?: string;
	role?: string;
	orgId?: string;
	[key: string]: any;
}

export interface BetterAuthSession {
	user: BetterAuthUser;
	session: {
		id: string;
		expiresAt: Date;
		token: string;
		[key: string]: any;
	};
}

export interface BetterAuthPluginOptions {
	/**
	 * Better Auth instance to integrate with
	 */
	auth?: any;

	/**
	 * Custom user extraction function
	 * If not provided, will try to extract from request.user or auth.api.getCurrentSession()
	 */
	getUserFromRequest?: (
		request: any,
	) => Promise<BetterAuthUser | null> | BetterAuthUser | null;

	/**
	 * Role-based permission mapping
	 * Maps Better Auth roles to permissions
	 */
	rolePermissions?: Record<
		string,
		{
			resources?: string[];
			operations?: ("create" | "read" | "update" | "delete" | "list")[];
			scopes?: string[];
		}
	>;

	/**
	 * Default role for authenticated users without explicit roles
	 */
	defaultRole?: string;

	/**
	 * Session validation settings
	 */
	session?: {
		/**
		 * Whether to automatically validate sessions on each request
		 */
		autoValidate?: boolean;

		/**
		 * Custom session validation function
		 */
		validate?: (session: any) => Promise<boolean> | boolean;
	};
}

/**
 * Better Auth integration plugin
 */
export const betterAuth = (options: BetterAuthPluginOptions = {}): Plugin => {
	const {
		auth,
		getUserFromRequest,
		rolePermissions = {},
		defaultRole = "user",
		session = { autoValidate: true },
	} = options;

	return {
		id: "better-auth",

		async init(context: any) {
			// Initialize Better Auth integration
			if (auth) {
				// Store auth instance in plugin context for later use
				(context as any).betterAuth = auth;
			}
		},

		middleware: [
			{
				path: "*",
				async handler(ctx: any) {
					// Extract user from request using Better Auth
					let user: BetterAuthUser | null = null;

					if (getUserFromRequest) {
						user = await getUserFromRequest(ctx.request);
					} else if (auth) {
						// Try to get current session from Better Auth
						try {
							// Use the correct Better Auth API method
							const sessionResult = await auth.api.getSession({
								headers: ctx.request.headers,
							});
							user = sessionResult?.user || null;
						} catch (error) {
							// Session validation failed or no session
							user = null;
						}
					} else {
						// Fallback to extracting from request.user
						user = ctx.request.user || null;
					}

					// Attach user to request context
					ctx.request.user = user;

					// Extract and attach security context
					const securityContext = extractSecurityContext(ctx.request);
					ctx.request.securityContext = securityContext;

					// Add role-based scopes to user context
					if (user && user.role) {
						const roleConfig = rolePermissions[user.role];
						if (roleConfig) {
							user.scopes = [
								...(user.scopes || []),
								...(roleConfig.scopes || []),
							];
						}
					}
				},
			},
		] as QueryMiddleware[],

		// Enhance permission checks with Better Auth role-based permissions
		hooks: {
			beforeCreate: async (context: QueryHookContext) => {
				await enforceRolePermissions(context, "create", rolePermissions);
			},
			beforeRead: async (context: QueryHookContext) => {
				await enforceRolePermissions(context, "read", rolePermissions);
			},
			beforeUpdate: async (context: QueryHookContext) => {
				await enforceRolePermissions(context, "update", rolePermissions);
			},
			beforeDelete: async (context: QueryHookContext) => {
				await enforceRolePermissions(context, "delete", rolePermissions);
			},
			beforeList: async (context: QueryHookContext) => {
				await enforceRolePermissions(context, "list", rolePermissions);
			},
		},
	};
};

/**
 * Enforce role-based permissions
 */
async function enforceRolePermissions(
	context: QueryHookContext,
	operation: "create" | "read" | "update" | "delete" | "list",
	rolePermissions: Record<string, any>,
): Promise<void> {
	const user = context.user;
	if (!user || !user.role) {
		return; // No role-based restrictions for non-authenticated users
	}

	const roleConfig = rolePermissions[user.role];
	if (!roleConfig) {
		return; // No specific role configuration
	}

	// Check resource access - "*" means all resources
	if (roleConfig.resources && roleConfig.resources.length > 0) {
		const hasAccess =
			roleConfig.resources.includes("*") ||
			roleConfig.resources.includes(context.resource);
		if (!hasAccess) {
			throw new Error(
				`Role '${user.role}' does not have access to resource '${context.resource}'`,
			);
		}
	}

	// Check operation access
	if (roleConfig.operations && !roleConfig.operations.includes(operation)) {
		throw new Error(
			`Role '${user.role}' does not have permission to ${operation} on resource '${context.resource}'`,
		);
	}
}

/**
 * Helper to create typed user context from Better Auth
 */
export function createBetterAuthContext<TUser = BetterAuthUser>() {
	return {
		/**
		 * Extract typed user from context
		 */
		getUser: (
			context: QueryPermissionContext | QueryHookContext,
		): TUser | null => {
			return context.user as TUser | null;
		},

		/**
		 * Check if user has specific role
		 */
		hasRole: (
			context: QueryPermissionContext | QueryHookContext,
			role: string,
		): boolean => {
			const user = context.user as TUser & { role?: string };
			return user?.role === role;
		},

		/**
		 * Check if user has any of the specified roles
		 */
		hasAnyRole: (
			context: QueryPermissionContext | QueryHookContext,
			roles: string[],
		): boolean => {
			const user = context.user as TUser & { role?: string };
			return user?.role ? roles.includes(user.role) : false;
		},

		/**
		 * Check if user belongs to specific organization
		 */
		belongsToOrg: (
			context: QueryPermissionContext | QueryHookContext,
			orgId: string,
		): boolean => {
			const user = context.user as TUser & { orgId?: string };
			return user?.orgId === orgId;
		},
	};
}

/**
 * TypeScript declaration merging for Better Auth user types
 * This allows users to extend the user interface in their own code
 */
declare global {
	namespace BetterQuery {
		interface User extends BetterAuthUser {}
	}
}

// Functions are already exported above
