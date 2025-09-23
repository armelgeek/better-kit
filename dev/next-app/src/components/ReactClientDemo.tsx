"use client";

import React, { useState } from "react";
import { reactQueryClient } from "../lib/client";
import { useResource } from "../../../../packages/better-query/src/client/react";

/**
 * Demo component showing client-side operations using the React client
 * This demonstrates the difference from server actions
 */
export function ReactClientDemo() {
	const [productName, setProductName] = useState("");
	const [price, setPrice] = useState("");
	const [result, setResult] = useState<any>(null);
	const [loading, setLoading] = useState(false);

	// Using the React client for direct API calls (client-side)
	const handleCreateProduct = async () => {
		setLoading(true);
		try {
			const response = await reactQueryClient.product.create({
				name: productName,
				price: parseFloat(price),
				description: "Created via React client",
				status: "active",
			});
			
			setResult(response);
			console.log("Response from React client:", response);
		} catch (error) {
			console.error("Error:", error);
			setResult({ error: error });
		} finally {
			setLoading(false);
		}
	};

	const handleListProducts = async () => {
		setLoading(true);
		try {
			const response = await reactQueryClient.product.list({
				page: 1,
				limit: 10,
			});
			
			setResult(response);
			console.log("Products from React client:", response);
		} catch (error) {
			console.error("Error:", error);
			setResult({ error: error });
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="border p-4 rounded-lg">
			<h3 className="text-lg font-semibold mb-4">React Client Demo (Client-Side)</h3>
			
			<div className="space-y-4">
				<div>
					<label className="block text-sm font-medium mb-1">Product Name:</label>
					<input
						type="text"
						value={productName}
						onChange={(e) => setProductName(e.target.value)}
						className="w-full p-2 border rounded"
						placeholder="Enter product name"
					/>
				</div>
				
				<div>
					<label className="block text-sm font-medium mb-1">Price:</label>
					<input
						type="number"
						value={price}
						onChange={(e) => setPrice(e.target.value)}
						className="w-full p-2 border rounded"
						placeholder="Enter price"
						step="0.01"
					/>
				</div>

				<div className="space-x-2">
					<button
						onClick={handleCreateProduct}
						disabled={loading || !productName || !price}
						className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
					>
						{loading ? "Creating..." : "Create Product (Client-Side)"}
					</button>
					
					<button
						onClick={handleListProducts}
						disabled={loading}
						className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
					>
						{loading ? "Loading..." : "List Products (Client-Side)"}
					</button>
				</div>

				{result && (
					<div className="mt-4 p-3 bg-gray-100 rounded">
						<h4 className="font-medium mb-2">Result:</h4>
						<pre className="text-sm overflow-auto">
							{JSON.stringify(result, null, 2)}
						</pre>
					</div>
				)}
			</div>

			<div className="mt-4 text-sm text-gray-600">
				<p><strong>Note:</strong> This component uses the React client which makes direct fetch calls to the API (client-side), 
				unlike the server-side queryClient which uses server actions.</p>
				<p>Check the browser Network tab to see the direct API calls being made.</p>
			</div>
		</div>
	);
}

/**
 * Demo component using the useResource hook
 */
export function ReactHooksDemo() {
	// Using the React hooks for state management
	const productHooks = useResource(reactQueryClient, "product");
	const { data: products, loading: listLoading, error: listError, refetch } = productHooks.useList({
		page: 1,
		limit: 5,
	});
	
	const { create, loading: createLoading, error: createError } = productHooks.useCreate();

	const [formData, setFormData] = useState({
		name: "",
		price: "",
		description: "",
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.name || !formData.price) return;

		const result = await create({
			name: formData.name,
			price: parseFloat(formData.price),
			description: formData.description,
			status: "active",
		});

		if (result.data) {
			setFormData({ name: "", price: "", description: "" });
			refetch(); // Refresh the list
		}
	};

	return (
		<div className="border p-4 rounded-lg">
			<h3 className="text-lg font-semibold mb-4">React Hooks Demo</h3>
			
			<form onSubmit={handleSubmit} className="space-y-4 mb-6">
				<div>
					<input
						type="text"
						value={formData.name}
						onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
						className="w-full p-2 border rounded"
						placeholder="Product name"
						required
					/>
				</div>
				
				<div>
					<input
						type="number"
						value={formData.price}
						onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
						className="w-full p-2 border rounded"
						placeholder="Price"
						step="0.01"
						required
					/>
				</div>
				
				<div>
					<textarea
						value={formData.description}
						onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
						className="w-full p-2 border rounded"
						placeholder="Description (optional)"
						rows={3}
					/>
				</div>

				<button
					type="submit"
					disabled={createLoading || !formData.name || !formData.price}
					className="px-4 py-2 bg-purple-500 text-white rounded disabled:opacity-50"
				>
					{createLoading ? "Creating..." : "Create with Hook"}
				</button>
			</form>

			{createError && (
				<div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
					Error: {createError.message}
				</div>
			)}

			<div>
				<h4 className="font-medium mb-2">Products (using useResource hook):</h4>
				{listLoading && <p>Loading products...</p>}
				{listError && <p className="text-red-600">Error: {listError.message}</p>}
				{products && (
					<div className="space-y-2">
						{products.items?.map((product: any) => (
							<div key={product.id} className="p-2 border rounded text-sm">
								<strong>{product.name}</strong> - ${product.price}
								{product.description && <p className="text-gray-600">{product.description}</p>}
							</div>
						)) || <p>No products found</p>}
					</div>
				)}
			</div>
		</div>
	);
}