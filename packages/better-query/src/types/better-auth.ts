/**
 * Better Auth type extensions for better-query
 * This file provides type-safe integration with Better Auth
 */

import type {
	QueryHookContext,
	QueryOptions,
	QueryPermissionContext,
} from "../types";

/**
 * Enhanced permission context with typed Better Auth user
 */
export interface BetterAuthPermissionContext<TUser = any>
	extends Omit<QueryPermissionContext, "user"> {
	/** Typed user from Better Auth */
	user?: TUser & {
		id: string;
		email: string;
		role?: string;
		orgId?: string;
		scopes?: string[];
		[key: string]: any;
	};
}

/**
 * Enhanced hook context with typed Better Auth user
 */
export interface BetterAuthHookContext<TUser = any>
	extends Omit<QueryHookContext, "user"> {
	/** Typed user from Better Auth */
	user?: TUser & {
		id: string;
		email: string;
		role?: string;
		orgId?: string;
		scopes?: string[];
		[key: string]: any;
	};
}

/**
 * Enhanced query options with Better Auth integration
 */
export interface BetterAuthQueryOptions<TUser = any> extends QueryOptions {
	/**
	 * Better Auth integration configuration
	 */
	betterAuth?: {
		/**
		 * Better Auth instance
		 */
		auth?: any;

		/**
		 * Role-based permissions configuration
		 */
		roles?: Record<
			string,
			{
				/**
				 * Resources this role can access
				 */
				resources?: string[];

				/**
				 * Operations this role can perform
				 */
				operations?: ("create" | "read" | "update" | "delete" | "list")[];

				/**
				 * Additional scopes for this role
				 */
				scopes?: string[];
			}
		>;

		/**
		 * Session validation configuration
		 */
		session?: {
			/**
			 * Auto-validate sessions on each request
			 */
			autoValidate?: boolean;

			/**
			 * Custom session validation function
			 */
			validate?: (session: any) => Promise<boolean> | boolean;
		};
	};
}

/**
 * Type helper to create a Better Auth integrated query instance
 */
export interface BetterAuthQuery<TUser = any> {
	/**
	 * Get typed user from context
	 */
	getUser: (context: QueryPermissionContext | QueryHookContext) =>
		| (TUser & {
				id: string;
				email: string;
				role?: string;
				orgId?: string;
				scopes?: string[];
		  })
		| null;

	/**
	 * Check if user has specific role
	 */
	hasRole: (
		context: QueryPermissionContext | QueryHookContext,
		role: string,
	) => boolean;

	/**
	 * Check if user has any of the specified roles
	 */
	hasAnyRole: (
		context: QueryPermissionContext | QueryHookContext,
		roles: string[],
	) => boolean;

	/**
	 * Check if user belongs to organization
	 */
	belongsToOrg: (
		context: QueryPermissionContext | QueryHookContext,
		orgId: string,
	) => boolean;

	/**
	 * Check if user has required scopes
	 */
	hasScopes: (
		context: QueryPermissionContext | QueryHookContext,
		scopes: string[],
	) => boolean;
}

/**
 * Type-safe permission function with Better Auth user
 */
export type BetterAuthPermissionFunction<TUser = any> = (
	context: BetterAuthPermissionContext<TUser>,
) => Promise<boolean> | boolean;

/**
 * Type-safe hook function with Better Auth user
 */
export type BetterAuthHookFunction<TUser = any> = (
	context: BetterAuthHookContext<TUser>,
) => Promise<void> | void;

/**
 * Declaration merging for global Better Auth user type
 */
declare global {
	namespace BetterQuery {
		interface User {
			id: string;
			email: string;
			role?: string;
			orgId?: string;
			scopes?: string[];
		}
	}
}

/**
 * Utility type to extract user type from Better Auth instance
 */
export type ExtractBetterAuthUser<T> = T extends {
	$inferredTypes: { User: infer U };
}
	? U
	: any;

/**
 * Create type-safe Better Auth integration helper
 */
export function createBetterAuthIntegration<
	TAuth extends { $inferredTypes: { User: any } },
>(auth: TAuth): BetterAuthQuery<ExtractBetterAuthUser<TAuth>> {
	type User = ExtractBetterAuthUser<TAuth>;

	return {
		getUser: (context: QueryPermissionContext | QueryHookContext) =>
			context.user as (User & { scopes?: string[] }) | null,

		hasRole: (
			context: QueryPermissionContext | QueryHookContext,
			role: string,
		) => {
			const user = context.user as User & { role?: string };
			return user?.role === role;
		},

		hasAnyRole: (
			context: QueryPermissionContext | QueryHookContext,
			roles: string[],
		) => {
			const user = context.user as User & { role?: string };
			return user?.role ? roles.includes(user.role) : false;
		},

		belongsToOrg: (
			context: QueryPermissionContext | QueryHookContext,
			orgId: string,
		) => {
			const user = context.user as User & { orgId?: string };
			return user?.orgId === orgId;
		},

		hasScopes: (
			context: QueryPermissionContext | QueryHookContext,
			requiredScopes: string[],
		) => {
			const user = context.user as User & { scopes?: string[] };
			const userScopes = user?.scopes || [];
			return requiredScopes.every((scope) => userScopes.includes(scope));
		},
	};
}

// Types are exported as interfaces above
