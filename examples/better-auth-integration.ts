/**
 * Complete Better Auth + Better Query integration example
 * This example demonstrates all the new features:
 * - Native Better Auth integration
 * - Automatic user context typing
 * - Role-based permissions
 * - Transparent session handling
 * - Schema migration management
 */

import { betterAuth } from "better-auth";
import { betterQuery, createQueryClient, createResource, betterAuth as betterAuthPlugin, withSchemaVersion, createSchemaMigration } from "better-query";
import { z } from "zod";

// 1. Setup Better Auth
export const auth = betterAuth({
	database: {
		provider: "sqlite",
		url: "auth.db",
	},
	secret: process.env.BETTER_AUTH_SECRET ?? "secret",
	emailAndPassword: {
		enabled: true,
	},
	session: {
		expiresIn: 60 * 60 * 24 * 7, // 7 days
	},
});

// 2. Define user interface that extends Better Auth
interface CustomUser extends typeof auth.$inferredTypes.User {
	role: "admin" | "user" | "moderator";
	orgId?: string;
}

// 3. Define schemas with versioning
const productSchemaV1 = withSchemaVersion("1.0.0", z.object({
	id: z.string().optional(),
	name: z.string().min(1),
	price: z.number().positive(),
	status: z.enum(["active", "inactive"]).default("active"),
	createdAt: z.date().default(() => new Date()),
	updatedAt: z.date().default(() => new Date()),
}));

const productSchemaV2 = withSchemaVersion("2.0.0", z.object({
	id: z.string().optional(),
	name: z.string().min(1),
	description: z.string().optional(), // Added field (non-breaking)
	price: z.number().positive(),
	category: z.string().min(1), // Added required field (breaking)
	status: z.enum(["active", "inactive", "draft"]).default("active"), // Modified enum (breaking)
	createdAt: z.date().default(() => new Date()),
	updatedAt: z.date().default(() => new Date()),
}));

// 4. Check for schema breaking changes
const { changes, migrations, report } = createSchemaMigration(
	"product",
	productSchemaV1.schema,
	productSchemaV2.schema,
	"1.0.0",
	"2.0.0"
);

console.log("Schema Migration Report:");
console.log(report);

// 5. Setup Better Query with Better Auth integration
export const query = betterQuery({
	basePath: "/api/query",
	database: {
		provider: "sqlite",
		url: "data.db",
		autoMigrate: true,
	},
	
	// Enable Better Auth plugin
	plugins: [
		betterAuthPlugin({
			auth,
			
			// Define role-based permissions
			rolePermissions: {
				admin: {
					resources: ["*"], // Access to all resources
					operations: ["create", "read", "update", "delete", "list"],
					scopes: ["admin", "write", "read"]
				},
				moderator: {
					resources: ["product", "category", "review"],
					operations: ["read", "update", "list"],
					scopes: ["moderate", "read"]
				},
				user: {
					resources: ["product", "review"],
					operations: ["read", "create", "list"],
					scopes: ["read"]
				}
			},
			
			session: {
				autoValidate: true
			}
		})
	],
	
	resources: [
		createResource({
			name: "product",
			schema: productSchemaV2.schema, // Using v2 schema
			
			// Type-safe permissions with Better Auth user
			permissions: {
				read: async () => true, // Public read access
				list: async () => true,
				
				create: async (context) => {
					// User must be authenticated
					return !!context.user;
				},
				
				update: async (context) => {
					const user = context.user as CustomUser;
					
					// Admins can update anything
					if (user?.role === "admin") return true;
					
					// Users can only update their own products
					return !!user && context.existingData?.createdBy === user.id;
				},
				
				delete: async (context) => {
					const user = context.user as CustomUser;
					return user?.role === "admin";
				}
			},
			
			hooks: {
				beforeCreate: async (context) => {
					// Automatically set the creator
					if (context.user) {
						context.data.createdBy = context.user.id;
					}
				},
				
				beforeUpdate: async (context) => {
					// Update the timestamp
					context.data.updatedAt = new Date();
				}
			}
		}),
		
		createResource({
			name: "review",
			schema: z.object({
				id: z.string().optional(),
				productId: z.string(),
				userId: z.string(),
				rating: z.number().min(1).max(5),
				comment: z.string().min(10),
				status: z.enum(["pending", "approved", "rejected"]).default("pending"),
				createdAt: z.date().default(() => new Date()),
			}),
			
			permissions: {
				read: async (context) => {
					// Only show approved reviews to non-owners
					if (!context.user) return context.existingData?.status === "approved";
					
					const user = context.user as CustomUser;
					// Admins and moderators see all, users see their own + approved
					return user.role === "admin" || user.role === "moderator" || 
						   context.existingData?.userId === user.id ||
						   context.existingData?.status === "approved";
				},
				
				list: async () => true,
				
				create: async (context) => !!context.user,
				
				update: async (context) => {
					const user = context.user as CustomUser;
					
					// Moderators can change status
					if (user?.role === "moderator" || user?.role === "admin") {
						return true;
					}
					
					// Users can edit their own pending reviews
					return context.existingData?.userId === user?.id && 
						   context.existingData?.status === "pending";
				},
				
				delete: async (context) => {
					const user = context.user as CustomUser;
					return user?.role === "admin" || 
						   (context.existingData?.userId === user?.id && context.existingData?.status === "pending");
				}
			},
			
			hooks: {
				beforeCreate: async (context) => {
					// Set user ID and default status
					if (context.user) {
						context.data.userId = context.user.id;
						context.data.status = "pending";
					}
				},
				
				afterCreate: async (context) => {
					// Send notification to moderators
					console.log(`New review created by ${context.user?.email} for product ${context.data.productId}`);
				}
			}
		})
	]
});

// 6. Create typed client
export const queryClient = createQueryClient<typeof query>({
	baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/query",
});

// 7. Helper functions for working with Better Auth context
export function getUserFromContext(context: any): CustomUser | null {
	return context.user as CustomUser | null;
}

export function requireAdmin(context: any): void {
	const user = getUserFromContext(context);
	if (!user || user.role !== "admin") {
		throw new Error("Admin access required");
	}
}

export function requireAuthentication(context: any): CustomUser {
	const user = getUserFromContext(context);
	if (!user) {
		throw new Error("Authentication required");
	}
	return user;
}

export function belongsToSameOrg(context: any, resourceOrgId: string): boolean {
	const user = getUserFromContext(context);
	return user?.orgId === resourceOrgId;
}

// 8. Export types for client usage
export type Auth = typeof auth;
export type Query = typeof query;
export type QueryClient = typeof queryClient;

// Example usage in API routes:
/*
// pages/api/auth/[...all].ts (Next.js)
export { auth as GET, auth as POST } from "../../lib/auth-config";

// pages/api/query/[...all].ts (Next.js)
export const handler = query.handler;
export { handler as GET, handler as POST };

// lib/client.ts (Frontend)
import { createBetterAuthIntegration } from "better-query";
import { auth, query } from "./auth-config";

const betterAuthIntegration = createBetterAuthIntegration(auth);

// Now you have type-safe user context helpers:
// betterAuthIntegration.getUser(context)
// betterAuthIntegration.hasRole(context, "admin")
// betterAuthIntegration.hasAnyRole(context, ["admin", "moderator"])
// betterAuthIntegration.belongsToOrg(context, "org-123")
// betterAuthIntegration.hasScopes(context, ["read", "write"])
*/

export { auth, query, queryClient };