/**
 * Plugin Client Configuration Example
 * 
 * This example shows how to configure and use plugin clients with better-auth,
 * specifically for the CRUD plugin.
 */

import { betterAuth } from "better-auth";
import { categorySchema, createCrudClient, createResource, crud, productSchema } from "better-auth/plugins";
import { createReactAuthClient } from "better-auth/react";

// 1. Server-side configuration with CRUD plugin
export const auth = betterAuth({
	secret: "better-auth-secret.1234567890",
	database: {
		provider: "sqlite",
		url: "./prisma/db.sqlite",
	},
	emailAndPassword: {
		enabled: true,
	},
	plugins: [
		// Configure CRUD plugin with resources
		crud({
			resources: [
				createResource({
					name: "product",
					schema: productSchema,
					permissions: {
						create: async () => true,
						read: async () => true,
						update: async () => true,
						delete: async () => true,
						list: async () => true,
					},
				}),
				createResource({
					name: "category",
					schema: categorySchema,
				}),
			],
		}),
	],
});

// 2. Client-side configuration with plugin support

// Option A: Enhanced auth client with plugin configuration
export const authClient = createReactAuthClient<typeof auth>({
	baseURL: "http://localhost:3000/api/auth",
	pluginConfigs: {
		crud: {
			baseURL: "http://localhost:3000/api/auth",
			// Optionally configure resources for better type inference
			resources: [
				{ name: "product", schema: productSchema },
				{ name: "category", schema: categorySchema },
			],
		},
	},
});

// Option B: Standalone CRUD client
export const crudClient = createCrudClient({
	baseURL: "http://localhost:3000/api/auth",
	resources: [
		{ name: "product", schema: productSchema },
		{ name: "category", schema: categorySchema },
	],
});

// 3. Usage examples

// Using the enhanced auth client (if plugin configuration is implemented)
export async function createProductWithAuthClient(productData: any) {
	// This would work once plugin client integration is fully implemented
	// return authClient.crud.product.create(productData);
	
	// For now, use the standalone client
	return crudClient.product.create(productData);
}

// Using the standalone CRUD client
export async function createProductWithCrudClient(productData: any) {
	try {
		const result = await crudClient.product.create(productData);
		if (result.error) {
			console.error("Failed to create product:", result.error);
			return null;
		}
		return result.data;
	} catch (error) {
		console.error("Error creating product:", error);
		return null;
	}
}

export async function listProducts() {
	return crudClient.product.list({
		page: 1,
		limit: 10,
		sortBy: "createdAt",
		sortOrder: "desc",
	});
}

export async function updateProduct(id: string, updates: any) {
	return crudClient.product.update(id, updates);
}

export async function deleteProduct(id: string) {
	return crudClient.product.delete(id);
}

// Category operations
export async function createCategory(categoryData: any) {
	return crudClient.category.create(categoryData);
}

export async function listCategories() {
	return crudClient.category.list();
}

// 4. React hook example
import { useEffect, useState } from "react";

export function useProducts() {
	const [products, setProducts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function fetchProducts() {
			try {
				setLoading(true);
				const result = await listProducts();
				if (result.error) {
					setError(result.error.message);
				} else {
					setProducts(result.data?.items || []);
				}
			} catch (err) {
				setError("Failed to fetch products");
			} finally {
				setLoading(false);
			}
		}

		fetchProducts();
	}, []);

	return { products, loading, error };
}

// 5. Error handling with typed error codes
export function handleCrudError(error: any) {
	if (error.code === crudClient.$ERROR_CODES.VALIDATION_FAILED) {
		return "Please check your input data.";
	} else if (error.code === crudClient.$ERROR_CODES.UNAUTHORIZED) {
		return "You need to be logged in to perform this action.";
	} else if (error.code === crudClient.$ERROR_CODES.FORBIDDEN) {
		return "You don't have permission to perform this action.";
	} else if (error.code === crudClient.$ERROR_CODES.NOT_FOUND) {
		return "The requested resource was not found.";
	}
	return "An unexpected error occurred.";
}