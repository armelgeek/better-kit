/**
 * Practical example demonstrating custom operations with Drizzle ORM
 * This shows how to use both built-in and custom operations
 */

import { DrizzleCrudAdapter, betterQuery, createResource } from "better-query";
import Database from "better-sqlite3";
import { and, eq, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import {
	integer,
	primaryKey,
	sqliteTable,
	text,
} from "drizzle-orm/sqlite-core";
import { z } from "zod";

// Define Drizzle schema
const products = sqliteTable("products", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	price: integer("price").notNull(),
	categoryId: text("category_id").notNull(),
	status: text("status").notNull().default("active"),
	createdAt: text("created_at").notNull().default(sql`datetime('now')`),
	updatedAt: text("updated_at").notNull().default(sql`datetime('now')`),
});

const categories = sqliteTable("categories", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	createdAt: text("created_at").notNull().default(sql`datetime('now')`),
});

const productViews = sqliteTable("product_views", {
	id: text("id").primaryKey(),
	productId: text("product_id").notNull(),
	userId: text("user_id"),
	viewedAt: text("viewed_at").notNull().default(sql`datetime('now')`),
});

// Drizzle schema object
const schema = {
	products,
	categories,
	productViews,
};

// Enhanced Drizzle adapter with custom operations specific to our domain
class EcommerceDrizzleAdapter extends DrizzleCrudAdapter {
	constructor(db: any, schema: any) {
		super(db, schema);

		// Add ecommerce-specific custom operations
		this.customOperations = {
			...this.customOperations, // Keep the built-in ones

			// Get product analytics with views
			getProductAnalytics: async (params: {
				productId?: string;
				timeRange?: "day" | "week" | "month";
			}) => {
				const { productId, timeRange = "week" } = params;

				const timeCondition =
					timeRange === "day"
						? sql`datetime('now', '-1 day')`
						: timeRange === "week"
							? sql`datetime('now', '-7 days')`
							: sql`datetime('now', '-30 days')`;

				let query = this.db
					.select({
						productId: products.id,
						productName: products.name,
						price: products.price,
						totalViews: sql`COUNT(${productViews.id})`.as("totalViews"),
						uniqueViews: sql`COUNT(DISTINCT ${productViews.userId})`.as(
							"uniqueViews",
						),
					})
					.from(products)
					.leftJoin(productViews, eq(products.id, productViews.productId))
					.where(
						and(
							productId ? eq(products.id, productId) : undefined,
							sql`${productViews.viewedAt} >= ${timeCondition}`,
						),
					)
					.groupBy(products.id);

				return await query;
			},

			// Update product prices by category with percentage
			updatePricesByCategory: async (params: {
				categoryId: string;
				priceAdjustment: number; // percentage, e.g., 10 for 10% increase, -5 for 5% decrease
			}) => {
				const { categoryId, priceAdjustment } = params;

				return await this.db
					.update(products)
					.set({
						price: sql`ROUND(${products.price} * (1 + ${priceAdjustment} / 100.0))`,
						updatedAt: sql`datetime('now')`,
					})
					.where(eq(products.categoryId, categoryId))
					.returning();
			},

			// Get trending products based on recent views
			getTrendingProducts: async (params: {
				limit?: number;
				minViews?: number;
				timeRange?: "day" | "week" | "month";
			}) => {
				const { limit = 10, minViews = 5, timeRange = "week" } = params;

				const timeCondition =
					timeRange === "day"
						? sql`datetime('now', '-1 day')`
						: timeRange === "week"
							? sql`datetime('now', '-7 days')`
							: sql`datetime('now', '-30 days')`;

				return await this.db
					.select({
						id: products.id,
						name: products.name,
						price: products.price,
						categoryId: products.categoryId,
						viewCount: sql`COUNT(${productViews.id})`.as("viewCount"),
						uniqueViewers: sql`COUNT(DISTINCT ${productViews.userId})`.as(
							"uniqueViewers",
						),
						trendScore: sql`
							(COUNT(${productViews.id}) * 1.0 + COUNT(DISTINCT ${productViews.userId}) * 2.0) 
							/ ((julianday('now') - julianday(MIN(${productViews.viewedAt}))) + 1)
						`.as("trendScore"),
					})
					.from(products)
					.innerJoin(productViews, eq(products.id, productViews.productId))
					.where(
						and(
							eq(products.status, "active"),
							sql`${productViews.viewedAt} >= ${timeCondition}`,
						),
					)
					.groupBy(products.id)
					.having(sql`COUNT(${productViews.id}) >= ${minViews}`)
					.orderBy(sql`trendScore DESC`)
					.limit(limit);
			},

			// Complex search with full-text search simulation
			searchProducts: async (params: {
				query: string;
				categoryId?: string;
				priceRange?: { min: number; max: number };
				sortBy?: "relevance" | "price" | "name" | "newest";
				limit?: number;
			}) => {
				const {
					query,
					categoryId,
					priceRange,
					sortBy = "relevance",
					limit = 20,
				} = params;

				let whereConditions = [
					eq(products.status, "active"),
					or(
						sql`${products.name} LIKE ${`%${query}%`}`,
						sql`${products.name} LIKE ${`${query}%`}`,
					),
				];

				if (categoryId) {
					whereConditions.push(eq(products.categoryId, categoryId));
				}

				if (priceRange) {
					whereConditions.push(
						and(
							sql`${products.price} >= ${priceRange.min}`,
							sql`${products.price} <= ${priceRange.max}`,
						),
					);
				}

				let orderBy;
				switch (sortBy) {
					case "price":
						orderBy = products.price;
						break;
					case "name":
						orderBy = products.name;
						break;
					case "newest":
						orderBy = sql`${products.createdAt} DESC`;
						break;
					case "relevance":
					default:
						// Simple relevance scoring: exact matches first, then partial matches
						orderBy = sql`
							CASE 
								WHEN ${products.name} = ${query} THEN 1
								WHEN ${products.name} LIKE ${`${query}%`} THEN 2
								ELSE 3
							END,
							${products.name}
						`;
						break;
				}

				return await this.db
					.select({
						id: products.id,
						name: products.name,
						price: products.price,
						categoryId: products.categoryId,
						status: products.status,
						createdAt: products.createdAt,
					})
					.from(products)
					.where(and(...whereConditions))
					.orderBy(orderBy)
					.limit(limit);
			},

			// Bulk operation with validation
			bulkUpdateProductStatus: async (params: {
				productIds: string[];
				status: "active" | "inactive" | "discontinued";
				reason?: string;
			}) => {
				const { productIds, status, reason } = params;

				// First, validate all products exist
				const existingProducts = await this.db
					.select({ id: products.id })
					.from(products)
					.where(sql`${products.id} IN ${productIds}`);

				const existingIds = existingProducts.map((p) => p.id);
				const missingIds = productIds.filter((id) => !existingIds.includes(id));

				if (missingIds.length > 0) {
					throw new Error(`Products not found: ${missingIds.join(", ")}`);
				}

				// Update all products
				const results = await this.db
					.update(products)
					.set({
						status,
						updatedAt: sql`datetime('now')`,
					})
					.where(sql`${products.id} IN ${productIds}`)
					.returning();

				// Log the bulk operation (in a real app, this might go to an audit log)
				console.log(
					`Bulk status update: ${productIds.length} products set to ${status}${
						reason ? ` (${reason})` : ""
					}`,
				);

				return {
					updated: results,
					count: results.length,
					reason,
				};
			},
		};
	}
}

// Setup database and adapter
const sqlite = new Database(":memory:");
const db = drizzle(sqlite);
const adapter = new EcommerceDrizzleAdapter(db, schema);

// Initialize tables (in a real app, this would be done via migrations)
sqlite.exec(`
	CREATE TABLE IF NOT EXISTS products (
		id TEXT PRIMARY KEY,
		name TEXT NOT NULL,
		price INTEGER NOT NULL,
		category_id TEXT NOT NULL,
		status TEXT NOT NULL DEFAULT 'active',
		created_at TEXT NOT NULL DEFAULT (datetime('now')),
		updated_at TEXT NOT NULL DEFAULT (datetime('now'))
	);
	
	CREATE TABLE IF NOT EXISTS categories (
		id TEXT PRIMARY KEY,
		name TEXT NOT NULL,
		created_at TEXT NOT NULL DEFAULT (datetime('now'))
	);
	
	CREATE TABLE IF NOT EXISTS product_views (
		id TEXT PRIMARY KEY,
		product_id TEXT NOT NULL,
		user_id TEXT,
		viewed_at TEXT NOT NULL DEFAULT (datetime('now'))
	);
`);

// Create Better Query instance
export const ecommerceQuery = betterQuery({
	resources: [
		createResource({
			name: "product",
			schema: z.object({
				id: z.string().optional(),
				name: z.string().min(1),
				price: z.number().min(0),
				categoryId: z.string(),
				status: z
					.enum(["active", "inactive", "discontinued"])
					.default("active"),
			}),
		}),
		createResource({
			name: "category",
			schema: z.object({
				id: z.string().optional(),
				name: z.string().min(1),
			}),
		}),
	],
	database: { adapter },
});

// Example usage functions
export async function demonstrateCustomOperations() {
	console.log("=== Custom Operations Demo ===\n");

	// 1. Use built-in batch insert
	console.log("1. Using built-in batchInsert operation...");
	const categories = await ecommerceQuery.customOperation("batchInsert", {
		model: "category",
		data: [
			{ id: "cat-1", name: "Electronics" },
			{ id: "cat-2", name: "Clothing" },
			{ id: "cat-3", name: "Books" },
		],
	});
	console.log(`Created ${categories.length} categories`);

	const products = await ecommerceQuery.customOperation("batchInsert", {
		model: "product",
		data: [
			{ id: "prod-1", name: "Laptop", price: 999, categoryId: "cat-1" },
			{ id: "prod-2", name: "Phone", price: 599, categoryId: "cat-1" },
			{ id: "prod-3", name: "T-Shirt", price: 29, categoryId: "cat-2" },
			{ id: "prod-4", name: "Jeans", price: 79, categoryId: "cat-2" },
			{ id: "prod-5", name: "Novel", price: 15, categoryId: "cat-3" },
		],
	});
	console.log(`Created ${products.length} products\n`);

	// 2. Add some view data for analytics
	console.log("2. Adding view data...");
	await ecommerceQuery.customOperation("batchInsert", {
		model: "productViews",
		data: [
			{ id: "view-1", productId: "prod-1", userId: "user-1" },
			{ id: "view-2", productId: "prod-1", userId: "user-2" },
			{ id: "view-3", productId: "prod-2", userId: "user-1" },
			{ id: "view-4", productId: "prod-3", userId: "user-3" },
			{ id: "view-5", productId: "prod-1", userId: "user-3" },
		],
	});

	// 3. Use custom analytics operation
	console.log("3. Getting product analytics...");
	const analytics = await ecommerceQuery.customOperation(
		"getProductAnalytics",
		{
			timeRange: "week",
		},
	);
	console.log("Product Analytics:", analytics);
	console.log("");

	// 4. Use custom trending products operation
	console.log("4. Getting trending products...");
	const trending = await ecommerceQuery.customOperation("getTrendingProducts", {
		limit: 3,
		minViews: 1,
		timeRange: "week",
	});
	console.log("Trending Products:", trending);
	console.log("");

	// 5. Use custom search operation
	console.log("5. Searching products...");
	const searchResults = await ecommerceQuery.customOperation("searchProducts", {
		query: "Laptop",
		sortBy: "relevance",
		limit: 5,
	});
	console.log("Search Results:", searchResults);
	console.log("");

	// 6. Use custom price update operation
	console.log("6. Updating prices by category...");
	const priceUpdates = await ecommerceQuery.customOperation(
		"updatePricesByCategory",
		{
			categoryId: "cat-1",
			priceAdjustment: 10, // 10% increase
		},
	);
	console.log(`Updated prices for ${priceUpdates.length} electronics products`);
	console.log("Updated products:", priceUpdates);
	console.log("");

	// 7. Use custom bulk status update
	console.log("7. Bulk updating product status...");
	const bulkUpdate = await ecommerceQuery.customOperation(
		"bulkUpdateProductStatus",
		{
			productIds: ["prod-4", "prod-5"],
			status: "discontinued",
			reason: "End of season sale",
		},
	);
	console.log(`Bulk update result:`, bulkUpdate);
	console.log("");

	// 8. Use built-in aggregation operation
	console.log("8. Using built-in aggregation...");
	const stats = await ecommerceQuery.customOperation("aggregate", {
		model: "product",
		aggregations: [
			{ field: "price", operation: "avg" },
			{ field: "price", operation: "sum" },
			{ field: "id", operation: "count" },
		],
		groupBy: ["categoryId"],
	});
	console.log("Product statistics by category:", stats);

	// 9. Check available operations
	console.log("\n9. Available custom operations:");
	const operations = ecommerceQuery.getCustomOperations();
	console.log("Available operations:", Object.keys(operations));

	console.log("\n=== Demo Complete ===");
}

// Run the demo if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
	demonstrateCustomOperations().catch(console.error);
}
