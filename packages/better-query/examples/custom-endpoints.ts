import { z } from "zod";
import { adiemus, createResource, createCrudEndpoint } from "better-crud";

// Define the resource schema
const productSchema = z.object({
	id: z.string().optional(),
	name: z.string(),
	price: z.number(),
	description: z.string(),
	category: z.string(),
	inStock: z.boolean().default(true),
	createdAt: z.date().optional(),
	updatedAt: z.date().optional(),
});

// Create custom endpoints for the product resource
const productCustomEndpoints = {
	// Get product statistics
	getProductStats: createCrudEndpoint("/products/stats", {
		method: "GET",
		query: z.object({
			category: z.string().optional(),
		}),
	}, async (ctx) => {
		const { category } = ctx.query;
		const adapter = ctx.context.adapter;
		
		// Example implementation - you would use real database queries
		const totalProducts = 100; // await adapter.count({ model: "product" });
		const inStockProducts = 85; // await adapter.count({ model: "product", where: [{ field: "inStock", value: true }] });
		
		return ctx.json({
			total: totalProducts,
			inStock: inStockProducts,
			outOfStock: totalProducts - inStockProducts,
			category: category || "all",
		});
	}),

	// Bulk update products
	bulkUpdateProducts: createCrudEndpoint("/products/bulk-update", {
		method: "POST",
		body: z.object({
			updates: z.array(z.object({
				id: z.string(),
				fields: z.record(z.any()),
			})),
		}),
	}, async (ctx) => {
		const { updates } = ctx.body;
		const adapter = ctx.context.adapter;
		
		const results = [];
		for (const update of updates) {
			try {
				const result = await adapter.update({
					model: "product",
					where: [{ field: "id", value: update.id }],
					data: {
						...update.fields,
						updatedAt: new Date(),
					},
				});
				results.push({ id: update.id, success: true, data: result });
			} catch (error) {
				results.push({ 
					id: update.id, 
					success: false, 
					error: error instanceof Error ? error.message : String(error) 
				});
			}
		}
		
		return ctx.json({
			message: "Bulk update completed",
			results,
			successCount: results.filter(r => r.success).length,
			failureCount: results.filter(r => !r.success).length,
		});
	}),

	// Advanced search endpoint
	searchProducts: createCrudEndpoint("/products/search", {
		method: "GET",
		query: z.object({
			q: z.string(),
			filters: z.string().optional(), // JSON string of filters
			sort: z.string().optional(),
			page: z.string().optional().transform(val => val ? parseInt(val) : 1),
			limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
		}),
	}, async (ctx) => {
		const { q, filters, sort, page, limit } = ctx.query;
		const adapter = ctx.context.adapter;
		
		// Parse filters if provided
		let parsedFilters = {};
		if (filters) {
			try {
				parsedFilters = JSON.parse(filters);
			} catch (error) {
				return ctx.json({ error: "Invalid filters format" }, { status: 400 });
			}
		}
		
		// Build where conditions for search
		const whereConditions = [
			{ field: "name", operator: "like" as const, value: `%${q}%` },
		];
		
		// Add additional filters
		for (const [field, value] of Object.entries(parsedFilters)) {
			whereConditions.push({ field, operator: "eq" as const, value });
		}
		
		const { items, total } = await adapter.findMany({
			model: "product",
			where: whereConditions,
			offset: (page - 1) * limit,
			limit,
			orderBy: sort ? [{ field: sort, direction: "asc" as const }] : undefined,
		});
		
		return ctx.json({
			items,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
				hasNext: page * limit < total,
				hasPrev: page > 1,
			},
			query: q,
			filters: parsedFilters,
		});
	}),
};

// Create the CRUD instance with custom endpoints
const crud = adiemus({
	resources: [
		createResource({
			name: "product",
			schema: productSchema,
			// Standard CRUD endpoints configuration
			endpoints: {
				create: true,
				read: true,
				update: true,
				delete: true,
				list: true,
			},
			// Add custom endpoints
			customEndpoints: productCustomEndpoints,
		}),
	],
	database: {
		provider: "sqlite",
		url: "products.db",
	},
});

// The API now includes both standard CRUD endpoints and custom endpoints:
// - Standard: crud.api.createProduct, crud.api.getProduct, crud.api.updateProduct, etc.
// - Custom: crud.api.getProductStats, crud.api.bulkUpdateProducts, crud.api.searchProducts

export default crud;

// Example usage in an HTTP handler:
export async function handleRequest(request: Request) {
	return crud.handler(request);
}

// The custom endpoints will be available at:
// GET /products/stats?category=electronics
// POST /products/bulk-update
// GET /products/search?q=laptop&filters={"category":"electronics"}&sort=price