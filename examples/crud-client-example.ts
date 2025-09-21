/**
 * Example demonstrating the new CRUD client system
 * This shows how to use the client in a way similar to better-auth
 */

import { adiemus, createCrudClient, createResource } from "better-crud";
import { z } from "zod";

// 1. Define schemas
const productSchema = z.object({
	id: z.string().optional(),
	name: z.string(),
	price: z.number(),
	description: z.string().optional(),
	status: z.enum(["active", "inactive"]).default("active"),
	createdAt: z.date().default(() => new Date()),
	updatedAt: z.date().default(() => new Date()),
});

const categorySchema = z.object({
	id: z.string().optional(),
	name: z.string(),
	description: z.string().optional(),
	createdAt: z.date().default(() => new Date()),
});

// 2. Create the CRUD server instance
export const crud = adiemus({
	resources: [
		createResource({
			name: "product",
			schema: productSchema,
			permissions: {
				create: async (context) => !!context.user, // Only authenticated users can create
				read: async () => true, // Anyone can read
				update: async (context) => !!context.user, // Only authenticated users can update
				delete: async (context) => !!context.user, // Only authenticated users can delete
				list: async () => true, // Anyone can list
			},
		}),
		createResource({
			name: "category",
			schema: categorySchema,
		}),
	],
	database: {
		provider: "sqlite",
		url: "sqlite:./database.db",
		autoMigrate: true,
	},
});

// 3. Create the typed client
export const crudClient = createCrudClient<typeof crud>({
	baseURL: "http://localhost:3000/api",
});

// 4. Example usage functions

export async function createProduct() {
	// Type-safe product creation with custom headers
	const result = await crudClient.product.create(
		{
			name: "Tee shirt",
			price: 29.99,
			description: "A comfortable cotton tee shirt",
			status: "active",
		},
		{
			headers: {
				Authorization: "Bearer your-token-here",
				"Content-Type": "application/json",
			},
		},
	);

	if (result.error) {
		throw new Error(`Failed to create product: ${result.error}`);
	}

	return result.data;
}

export async function getProduct(id: string) {
	const result = await crudClient.product.read(id, {
		headers: {
			Authorization: "Bearer your-token-here",
		},
	});

	if (result.error) {
		throw new Error(`Failed to get product: ${result.error}`);
	}

	return result.data;
}

export async function updateProduct(
	id: string,
	updates: Partial<z.infer<typeof productSchema>>,
) {
	const result = await crudClient.product.update(id, updates, {
		headers: {
			Authorization: "Bearer your-token-here",
			"Content-Type": "application/json",
		},
	});

	if (result.error) {
		throw new Error(`Failed to update product: ${result.error}`);
	}

	return result.data;
}

export async function deleteProduct(id: string) {
	const result = await crudClient.product.delete(id, {
		headers: {
			Authorization: "Bearer your-token-here",
		},
	});

	if (result.error) {
		throw new Error(`Failed to delete product: ${result.error}`);
	}

	return result.data;
}

export async function listProducts(options?: {
	page?: number;
	limit?: number;
	search?: string;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
}) {
	const result = await crudClient.product.list(options, {
		headers: {
			Authorization: "Bearer your-token-here",
		},
	});

	if (result.error) {
		throw new Error(`Failed to list products: ${result.error}`);
	}

	return result.data;
}

// 5. Example React hook (if using React)
/*
import { useState, useEffect } from 'react';

export function useProducts() {
	const [products, setProducts] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchProducts = async (options?: Parameters<typeof listProducts>[0]) => {
		setLoading(true);
		setError(null);
		try {
			const data = await listProducts(options);
			setProducts(data.items);
			return data;
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Unknown error');
			throw err;
		} finally {
			setLoading(false);
		}
	};

	const createNewProduct = async (productData: Parameters<typeof createProduct>[0]) => {
		try {
			const newProduct = await createProduct(productData);
			setProducts(prev => [...prev, newProduct]);
			return newProduct;
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Unknown error');
			throw err;
		}
	};

	useEffect(() => {
		fetchProducts();
	}, []);

	return {
		products,
		loading,
		error,
		fetchProducts,
		createProduct: createNewProduct,
		updateProduct: async (id: string, updates: Parameters<typeof updateProduct>[1]) => {
			const updated = await updateProduct(id, updates);
			setProducts(prev => prev.map(p => p.id === id ? updated : p));
			return updated;
		},
		deleteProduct: async (id: string) => {
			await deleteProduct(id);
			setProducts(prev => prev.filter(p => p.id !== id));
		},
	};
}
*/

// 6. Example usage in API routes (Next.js App Router)
/*
// app/api/products/route.ts
import { crud } from '@/lib/crud-config';

export const GET = crud.handler;
export const POST = crud.handler;

// app/api/products/[id]/route.ts
export const GET = crud.handler;
export const PATCH = crud.handler;
export const DELETE = crud.handler;
*/

// 7. Example frontend usage
/*
async function handleCreateProduct(formData: FormData) {
	try {
		const product = await crudClient.products.create({
			name: formData.get('name') as string,
			price: parseFloat(formData.get('price') as string),
			description: formData.get('description') as string,
		}, {
			headers: {
				'Authorization': `Bearer ${getAuthToken()}`,
			}
		});
		
		console.log('Created product:', product);
	} catch (error) {
		console.error('Failed to create product:', error);
	}
}
*/
