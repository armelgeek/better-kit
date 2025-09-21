/**
 * Example demonstrating the new CRUD client plugin system
 * This shows how to use client-side plugins similar to better-auth
 */

import { createCrudClient, auditClientPlugin, cacheClientPlugin, validationClientPlugin } from "better-crud/client";
import { z } from "zod";

// 1. Define schemas for validation
const productSchema = z.object({
	id: z.string().optional(),
	name: z.string().min(1, "Name is required"),
	price: z.number().positive("Price must be positive"),
	description: z.string().optional(),
	categoryId: z.string().optional(),
	status: z.enum(["active", "inactive"]).default("active"),
	createdAt: z.date().optional(),
	updatedAt: z.date().optional(),
});

const categorySchema = z.object({
	id: z.string().optional(),
	name: z.string().min(1, "Name is required"),
	description: z.string().optional(),
	createdAt: z.date().optional(),
});

// 2. Create the CRUD client with plugins
export const crudClient = createCrudClient({
	baseURL: "http://localhost:3000/api", // Your server URL
	
	// Configure client-side plugins
	plugins: [
		// Audit plugin - logs all operations
		auditClientPlugin({
			enabled: true,
			operations: ["create", "update", "delete"], // Only log write operations
			resources: ["product", "category"], // Only audit specific resources
			logToConsole: true,
			onLog: (event) => {
				// Custom logging - could send to analytics service
				console.log("📊 Audit Event:", {
					operation: event.operation,
					resource: event.resource,
					success: event.success,
					duration: event.duration,
					timestamp: event.timestamp,
				});

				// Send to external service (example)
				// analyticsService.track("crud_operation", event);
			},
		}),

		// Cache plugin - caches read operations
		cacheClientPlugin({
			enabled: true,
			defaultTTL: 300, // 5 minutes default
			maxSize: 1000, // Maximum 1000 cached entries
			resources: {
				product: {
					enabled: true,
					readTTL: 600, // 10 minutes for individual products
					listTTL: 60,  // 1 minute for product lists
				},
				category: {
					enabled: true,
					readTTL: 1800, // 30 minutes for categories (less frequent updates)
					listTTL: 300,  // 5 minutes for category lists
				},
			},
		}),

		// Validation plugin - validates data before sending
		validationClientPlugin({
			enabled: true,
			strict: false, // Don't throw errors, just warn
			schemas: {
				product: {
					create: productSchema,
					update: productSchema.partial(),
					query: z.object({
						page: z.number().optional(),
						limit: z.number().optional(),
						search: z.string().optional(),
						categoryId: z.string().optional(),
					}).optional(),
				},
				category: {
					create: categorySchema,
					update: categorySchema.partial(),
				},
			},
			globalRules: {
				trimStrings: true,      // Automatically trim string inputs
				validateEmails: true,   // Validate email formats
				sanitizeInput: true,    // Basic XSS protection
			},
			onValidationError: (error, context) => {
				console.warn("⚠️ Validation Error:", {
					resource: error.resource,
					operation: error.operation,
					errors: error.errors,
				});
				
				// Could show user-friendly error messages
				// toastService.error(`Validation failed for ${error.resource}`);
			},
		}),

		// Custom plugin example
		{
			id: "timestamp-client",
			name: "Timestamp Client Plugin",
			description: "Adds timestamps to requests",
			hooks: {
				onRequest: (context) => {
					// Add client timestamp to all requests
					if (context.body && typeof context.body === "object") {
						context.body.clientTimestamp = new Date().toISOString();
					}
					return context;
				},
				onSuccess: (context) => {
					console.log("✅ Request successful:", context.request.url);
				},
				onError: (context) => {
					console.error("❌ Request failed:", context.request.url, context.error.message);
				},
			},
		},
	],
});

// 3. Usage examples

// Create a product with validation and audit logging
async function createProduct() {
	try {
		const result = await crudClient.product.create({
			name: "Laptop",
			price: 999.99,
			description: "High-performance laptop",
			categoryId: "electronics",
		});
		
		console.log("Product created:", result.data);
		return result.data;
	} catch (error) {
		console.error("Failed to create product:", error);
	}
}

// Get product (will be cached)
async function getProduct(id: string) {
	try {
		const result = await crudClient.product.read(id);
		console.log("Product retrieved:", result.data);
		return result.data;
	} catch (error) {
		console.error("Failed to get product:", error);
	}
}

// List products with caching and validation
async function listProducts(filters?: any) {
	try {
		const result = await crudClient.product.list({
			page: 1,
			limit: 10,
			search: "laptop",
			...filters,
		});
		
		console.log("Products listed:", result.data);
		return result.data;
	} catch (error) {
		console.error("Failed to list products:", error);
	}
}

// Update product (invalidates cache)
async function updateProduct(id: string, updates: any) {
	try {
		const result = await crudClient.product.update(id, updates);
		console.log("Product updated:", result.data);
		return result.data;
	} catch (error) {
		console.error("Failed to update product:", error);
	}
}

// Delete product (logged and cache invalidated)
async function deleteProduct(id: string) {
	try {
		const result = await crudClient.product.delete(id);
		console.log("Product deleted:", result.data);
		return result.data;
	} catch (error) {
		console.error("Failed to delete product:", error);
	}
}

// Access cache plugin methods
const cachePlugin = crudClient.$cache; // If we exposed cache methods
if (cachePlugin) {
	// Get cache statistics
	console.log("Cache stats:", cachePlugin.getStats());
	
	// Clear cache for a specific resource
	cachePlugin.invalidateResource("product");
	
	// Clear entire cache
	cachePlugin.clearCache();
}

// Example usage
async function example() {
	console.log("🚀 Starting CRUD operations with plugins...");
	
	// These operations will be:
	// - Validated by the validation plugin
	// - Logged by the audit plugin  
	// - Cached by the cache plugin (for reads)
	
	const product = await createProduct();
	if (product?.id) {
		await getProduct(product.id); // Will be cached
		await getProduct(product.id); // Will use cache
		
		await updateProduct(product.id, { price: 1199.99 }); // Invalidates cache
		await getProduct(product.id); // Fresh request (cache invalidated)
		
		await deleteProduct(product.id); // Logged and cache invalidated
	}
	
	await listProducts(); // Cached for 1 minute
	
	console.log("✅ Example completed!");
}

// Run example (uncomment to test)
// example().catch(console.error);

export { createProduct, getProduct, listProducts, updateProduct, deleteProduct };