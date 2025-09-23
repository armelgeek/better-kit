import { betterAuth } from "better-auth";
import { betterQuery } from "../../../../packages/better-query/src/query";
import { createQueryClient, createResource } from "../../../../packages/better-query/src/";
import { 
	productSchema, 
	categorySchema, 
	orderSchema, 
	reviewSchema, 
	userProfileSchema 
} from "./schemas";

// Better Auth instance for authentication
export const auth = betterAuth({
	database: {
		provider: "sqlite",
		url: "data.db",
	},
	secret: process.env.BETTER_AUTH_SECRET ?? "secret",
	emailAndPassword: {
		enabled: true,
	},
	// Add session configuration for better integration
	session: {
		expiresIn: 60 * 60 * 24 * 7, // 7 days
		updateAge: 60 * 60 * 24, // 1 day
	},
});

// Better Query instance with comprehensive resource configuration
export const query = betterQuery({
	basePath: "/api/query",
	database: {
		provider: "sqlite",
		url: "data.db",
		autoMigrate: true,
	},
	resources: [
		// Product resource - demonstrates full CRUD with complex permissions
		createResource({
			name: "product",
			schema: productSchema,
			permissions: {
				// Allow anyone to read products
				read: async () => true,
				list: async () => true,
				// Require authentication for modifications
				create: async (context) => {
					// Check if user is authenticated
					return !!context.user;
				},
				update: async (context) => {
					// Allow updates by authenticated users
					// In real app, you might check if user owns the product or is admin
					return !!context.user;
				},
				delete: async (context) => {
					// Only allow deletion by authenticated users
					// In real app, you might require admin role
					return !!context.user;
				},
			},
			// Demonstrate hooks for business logic
			hooks: {
				beforeCreate: async (context) => {
					// Generate slug from name if not provided
					if (!context.data.seo?.slug && context.data.name) {
						const slug = context.data.name
							.toLowerCase()
							.replace(/[^a-z0-9]+/g, '-')
							.replace(/(^-|-$)/g, '');
						context.data.seo = { ...context.data.seo, slug };
					}
					
					// Set default status if not provided
					if (!context.data.status) {
						context.data.status = "draft";
					}
				},
				beforeUpdate: async (context) => {
					// Always update the updatedAt field
					context.data.updatedAt = new Date();
					
					// Update slug if name changed
					if (context.data.name && context.existingData?.name !== context.data.name) {
						const slug = context.data.name
							.toLowerCase()
							.replace(/[^a-z0-9]+/g, '-')
							.replace(/(^-|-$)/g, '');
						context.data.seo = { ...context.data.seo, slug };
					}
				},
				afterCreate: async (context) => {
					console.log(`Product created: ${context.result.name} (ID: ${context.result.id})`);
				},
			},
			// Enable specific endpoints (all are enabled by default)
			endpoints: {
				create: true,
				read: true,
				update: true,
				delete: true,
				list: true,
			},
		}),

		// Category resource - demonstrates hierarchical data
		createResource({
			name: "category",
			schema: categorySchema,
			permissions: {
				read: async () => true,
				list: async () => true,
				create: async (context) => !!context.user,
				update: async (context) => !!context.user,
				delete: async (context) => !!context.user,
			},
			hooks: {
				beforeCreate: async (context) => {
					// Generate slug from name
					if (!context.data.slug && context.data.name) {
						context.data.slug = context.data.name
							.toLowerCase()
							.replace(/[^a-z0-9]+/g, '-')
							.replace(/(^-|-$)/g, '');
					}
				},
			},
		}),

		// Order resource - demonstrates complex business logic
		createResource({
			name: "order",
			schema: orderSchema,
			permissions: {
				read: async (context) => {
					// Users can only read their own orders
					return !!context.user && (
						context.user.role === "admin" || 
						context.existingData?.userId === context.user.id
					);
				},
				list: async (context) => {
					// Users can only list their own orders, admins can see all
					return !!context.user;
				},
				create: async (context) => !!context.user,
				update: async (context) => {
					// Only allow order updates by admin or order owner
					return !!context.user && (
						context.user.role === "admin" || 
						context.existingData?.userId === context.user.id
					);
				},
				delete: async (context) => {
					// Only admins can delete orders
					return !!context.user && context.user.role === "admin";
				},
			},
			hooks: {
				beforeCreate: async (context) => {
					// Set userId from authenticated user
					if (context.user) {
						context.data.userId = context.user.id;
					}
					
					// Calculate totals
					const subtotal = context.data.items.reduce((sum, item) => 
						sum + (item.price * item.quantity), 0
					);
					context.data.subtotal = subtotal;
					context.data.total = subtotal + context.data.tax + context.data.shipping - context.data.discount;
				},
				beforeUpdate: async (context) => {
					// Prevent changing userId after creation
					if (context.data.userId && context.existingData?.userId !== context.data.userId) {
						throw new Error("Cannot change order owner");
					}
					
					// Recalculate totals if items changed
					if (context.data.items) {
						const subtotal = context.data.items.reduce((sum, item) => 
							sum + (item.price * item.quantity), 0
						);
						context.data.subtotal = subtotal;
						context.data.total = subtotal + (context.data.tax || 0) + 
							(context.data.shipping || 0) - (context.data.discount || 0);
					}
				},
			},
		}),

		// Review resource - demonstrates user-generated content
		createResource({
			name: "review",
			schema: reviewSchema,
			permissions: {
				read: async () => true, // Anyone can read approved reviews
				list: async () => true,
				create: async (context) => !!context.user,
				update: async (context) => {
					// Users can update their own reviews, admins can update any
					return !!context.user && (
						context.user.role === "admin" || 
						context.existingData?.userId === context.user.id
					);
				},
				delete: async (context) => {
					return !!context.user && (
						context.user.role === "admin" || 
						context.existingData?.userId === context.user.id
					);
				},
			},
			hooks: {
				beforeCreate: async (context) => {
					if (context.user) {
						context.data.userId = context.user.id;
					}
					// Set default status
					context.data.status = "pending";
				},
			},
		}),

		// User Profile resource - demonstrates profile management
		createResource({
			name: "userProfile",
			schema: userProfileSchema,
			permissions: {
				read: async (context) => {
					// Users can read their own profile, admins can read any
					return !!context.user && (
						context.user.role === "admin" || 
						context.existingData?.userId === context.user.id
					);
				},
				list: async (context) => {
					// Only admins can list all profiles
					return !!context.user && context.user.role === "admin";
				},
				create: async (context) => !!context.user,
				update: async (context) => {
					return !!context.user && (
						context.user.role === "admin" || 
						context.existingData?.userId === context.user.id
					);
				},
				delete: async (context) => {
					return !!context.user && (
						context.user.role === "admin" || 
						context.existingData?.userId === context.user.id
					);
				},
			},
			hooks: {
				beforeCreate: async (context) => {
					if (context.user) {
						context.data.userId = context.user.id;
					}
				},
			},
		}),
	],
	
	// Global hooks that apply to all resources
	hooks: {
		beforeCreate: async (context) => {
			console.log(`Creating ${context.resource.name}:`, context.data);
		},
		afterCreate: async (context) => {
			console.log(`Created ${context.resource.name} with ID:`, context.result.id);
		},
		beforeUpdate: async (context) => {
			console.log(`Updating ${context.resource.name}:`, context.data);
		},
		afterUpdate: async (context) => {
			console.log(`Updated ${context.resource.name}:`, context.result.id);
		},
		beforeDelete: async (context) => {
			console.log(`Deleting ${context.resource.name}:`, context.id);
		},
		afterDelete: async (context) => {
			console.log(`Deleted ${context.resource.name} with ID:`, context.id);
		},
	},

	// Enable CORS for development
	cors: {
		origin: ["http://localhost:3000"],
		credentials: true,
	},
});

// Type-safe query client
export const queryClient = createQueryClient<typeof query>({
	baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/query",
	// Add default headers
	headers: {
		"Content-Type": "application/json",
	},
});

// Export types for use in components
export type Auth = typeof auth;
export type Query = typeof query;
export type QueryClient = typeof queryClient;

// Legacy aliases for backward compatibility
export const crud = query;
export const crudClient = queryClient;
export type Crud = typeof query;
