import { z } from "zod";
import { createCrudEndpoints } from "../src/endpoints";
import { CrudResourceConfig } from "../src/types";

/**
 * Example showcasing all security features in the CRUD system
 */

// Define a product schema with validation
const productSchema = z.object({
	id: z.string().optional(),
	name: z.string().min(1, "Product name is required"),
	description: z.string().optional(),
	price: z.number().min(0, "Price must be positive"),
	category: z.string().optional(),
	tags: z.array(z.string()).default([]),
	status: z.enum(["active", "inactive", "draft"]).default("draft"),
	userId: z.string(), // Owner field
	createdAt: z.date().optional(),
	updatedAt: z.date().optional(),
});

// Advanced security configuration example
const secureProductResource: CrudResourceConfig = {
	name: "product",
	schema: productSchema,
	tableName: "products",
	
	// Ownership-based security
	ownership: {
		field: "userId", // Field that identifies the owner
		strategy: "flexible", // Allow owners + admins
	},
	
	// Scope-based permissions
	scopes: {
		create: ["product:write"],
		read: ["product:read"],
		update: ["product:write"],
		delete: ["product:delete"],
		list: ["product:read"],
	},
	
	// Custom permission functions (optional, in addition to scopes)
	permissions: {
		create: async (context) => {
			// Additional business logic for create permission
			const user = context.user;
			if (!user) return false;
			
			// Check if user has reached their product limit
			const userProductCount = await getUserProductCount(user.id);
			const maxProducts = user.plan === "premium" ? 1000 : 10;
			
			return userProductCount < maxProducts;
		},
		update: async (context) => {
			// Only allow updates to active products
			if (context.existingData?.status === "archived") {
				return false;
			}
			return true;
		},
	},
	
	// Input sanitization rules
	sanitization: {
		global: [
			{ type: "trim" }, // Remove whitespace
			{ type: "escape" }, // Escape HTML characters
		],
		fields: {
			description: [
				{ type: "strip" }, // Remove < and > characters
			],
			name: [
				{ type: "custom", customFn: (value: string) => value.replace(/[^\w\s-]/g, "") },
			],
		},
	},
	
	// Lifecycle hooks
	hooks: {
		// Before operations
		onCreate: async (context) => {
			// Add timestamps and user tracking
			context.data.createdAt = new Date();
			context.data.updatedAt = new Date();
			context.data.userId = context.user?.id;
			
			// Validate business rules
			if (context.data.price > 10000) {
				throw new Error("Products over $10,000 require approval");
			}
		},
		
		onUpdate: async (context) => {
			// Update timestamp
			context.data.updatedAt = new Date();
			
			// Log significant price changes
			const oldPrice = context.existingData?.price || 0;
			const newPrice = context.data.price;
			
			if (Math.abs(newPrice - oldPrice) > oldPrice * 0.5) {
				console.log(`Significant price change for product ${context.id}: ${oldPrice} -> ${newPrice}`);
			}
		},
		
		onDelete: async (context) => {
			// Soft delete instead of hard delete
			if (context.existingData?.status !== "draft") {
				throw new Error("Only draft products can be deleted");
			}
		},
		
		// After operations
		afterCreate: async (context) => {
			// Send notifications
			await sendProductCreatedNotification(context.user, context.result);
			
			// Update analytics
			await updateProductAnalytics("product_created", context.result);
		},
		
		afterUpdate: async (context) => {
			// Clear cache
			await clearProductCache(context.id);
			
			// Send update notifications to followers
			await notifyProductFollowers(context.id, context.result);
		},
		
		afterDelete: async (context) => {
			// Clean up related data
			await deleteProductImages(context.id);
			await removeFromWishlists(context.id);
		},
	},
	
	// Advanced search configuration
	search: {
		fields: ["name", "description", "tags"],
		strategy: "contains",
		caseSensitive: false,
	},
	
	// Enable/disable specific endpoints
	endpoints: {
		create: true,
		read: true,
		update: true,
		delete: true,
		list: true,
	},
};

// Example usage with advanced security
const productCrud = createCrudEndpoints(secureProductResource);

/**
 * Example API usage with advanced security features
 */

// 1. Create product with validation and hooks
// POST /product
// Headers: Authorization: Bearer <token>
// Body: {
//   "name": "Secure Product",
//   "description": "<script>alert('xss')</script>Safe description",
//   "price": 99.99,
//   "category": "electronics",
//   "tags": ["secure", "tested"]
// }
// 
// Result: 
// - Input sanitized (HTML escaped)
// - User scopes checked
// - Ownership automatically assigned
// - Hooks executed (timestamps, notifications)
// - Audit log created

// 2. List products with advanced filtering and search
// GET /products?search=secure&filters={"price":{"operator":"gte","value":50}}&sortBy=createdAt&sortOrder=desc&page=1&limit=20
//
// Result:
// - Search across name, description, tags
// - Filter by price >= 50
// - Sort by creation date descending
// - Paginated results
// - Ownership filtering applied automatically

// 3. Update product with ownership check
// PATCH /product/123
// Headers: Authorization: Bearer <token>
// Body: { "price": 149.99, "status": "active" }
//
// Result:
// - Ownership verified (user owns product OR is admin)
// - Scopes checked (product:write)
// - Hooks executed (price change logging, cache clearing)
// - Audit log created

// 4. Advanced search with multiple filters
// GET /products?q=electronics&searchFields=name,category&filters={"price":{"operator":"between","value":[50,200]},"status":{"operator":"eq","value":"active"}}&dateRange={"field":"createdAt","start":"2024-01-01","end":"2024-12-31"}
//
// Result:
// - Full-text search in name and category
// - Price between $50-$200
// - Only active products
// - Created in 2024
// - Results filtered by ownership

// Mock helper functions for the example
async function getUserProductCount(userId: string): Promise<number> {
	// Implementation would query database
	return 5;
}

async function sendProductCreatedNotification(user: any, product: any): Promise<void> {
	console.log(`Notification: User ${user.id} created product ${product.name}`);
}

async function updateProductAnalytics(event: string, product: any): Promise<void> {
	console.log(`Analytics: ${event} for product ${product.id}`);
}

async function clearProductCache(productId: string): Promise<void> {
	console.log(`Cache cleared for product ${productId}`);
}

async function notifyProductFollowers(productId: string, product: any): Promise<void> {
	console.log(`Notifying followers of product ${productId} update`);
}

async function deleteProductImages(productId: string): Promise<void> {
	console.log(`Deleted images for product ${productId}`);
}

async function removeFromWishlists(productId: string): Promise<void> {
	console.log(`Removed product ${productId} from wishlists`);
}

export {
	secureProductResource,
	productCrud,
	productSchema,
};