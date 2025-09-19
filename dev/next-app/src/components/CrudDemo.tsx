"use client";

import { useState, useEffect } from "react";

interface Product {
	id: string;
	name: string;
	description?: string;
	price: number;
	status: "active" | "inactive" | "draft";
	categoryId?: string;
	tags?: string[];
	sku?: string;
	stock?: number;
	createdAt?: Date;
	updatedAt?: Date;
}

// Mock data for demonstration
const mockProducts: Product[] = [
	{
		id: "1",
		name: "Laptop Pro",
		description: "High-performance laptop for professionals",
		price: 1299.99,
		status: "active",
		stock: 15,
	},
	{
		id: "2", 
		name: "Wireless Headphones",
		description: "Noise-cancelling bluetooth headphones",
		price: 199.99,
		status: "active",
		stock: 32,
	},
	{
		id: "3",
		name: "Smart Watch",
		description: "Fitness tracking smartwatch",
		price: 299.99,
		status: "draft",
		stock: 8,
	},
];

export function CrudDemo() {
	const [products, setProducts] = useState<Product[]>([]);
	const [newProduct, setNewProduct] = useState({
		name: "",
		price: 0,
		description: "",
		status: "draft" as const,
	});
	const [editingProduct, setEditingProduct] = useState<Product | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [useMockData, setUseMockData] = useState(true);

	// Load products on component mount
	useEffect(() => {
		if (useMockData) {
			setProducts(mockProducts);
		} else {
			fetchProducts();
		}
	}, [useMockData]);

	const fetchProducts = async () => {
		setLoading(true);
		setError(null);
		try {
			const response = await fetch("/api/auth/products", {
				headers: {
					"Content-Type": "application/json",
				},
			});

			if (response.ok) {
				const data = await response.json();
				setProducts(data.items || data || []);
			} else {
				setError(`Failed to fetch products: ${response.statusText}`);
			}
		} catch (error) {
			setError(`Error fetching products: ${error instanceof Error ? error.message : "Unknown error"}`);
		} finally {
			setLoading(false);
		}
	};

	const createProduct = async () => {
		if (!newProduct.name.trim()) {
			setError("Product name is required");
			return;
		}
		
		setLoading(true);
		setError(null);
		
		if (useMockData) {
			// Mock implementation
			const mockProduct: Product = {
				id: Date.now().toString(),
				...newProduct,
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			setProducts([...products, mockProduct]);
			setNewProduct({ name: "", price: 0, description: "", status: "draft" });
			setLoading(false);
			return;
		}
		
		try {
			const response = await fetch("/api/auth/product", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(newProduct),
			});

			if (response.ok) {
				const product = await response.json();
				setProducts([...products, product]);
				setNewProduct({ name: "", price: 0, description: "", status: "draft" });
			} else {
				const errorData = await response.json().catch(() => ({}));
				setError(`Failed to create product: ${errorData.error || response.statusText}`);
			}
		} catch (error) {
			setError(`Error creating product: ${error instanceof Error ? error.message : "Unknown error"}`);
		} finally {
			setLoading(false);
		}
	};

	const updateProduct = async (id: string, updates: Partial<Product>) => {
		setLoading(true);
		setError(null);
		
		if (useMockData) {
			// Mock implementation
			setProducts(products.map(p => p.id === id ? {...p, ...updates, updatedAt: new Date()} : p));
			setEditingProduct(null);
			setLoading(false);
			return;
		}
		
		try {
			const response = await fetch(`/api/auth/product/${id}`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(updates),
			});

			if (response.ok) {
				const updatedProduct = await response.json();
				setProducts(products.map(p => p.id === id ? updatedProduct : p));
				setEditingProduct(null);
			} else {
				const errorData = await response.json().catch(() => ({}));
				setError(`Failed to update product: ${errorData.error || response.statusText}`);
			}
		} catch (error) {
			setError(`Error updating product: ${error instanceof Error ? error.message : "Unknown error"}`);
		} finally {
			setLoading(false);
		}
	};

	const deleteProduct = async (id: string) => {
		if (!confirm("Are you sure you want to delete this product?")) {
			return;
		}
		
		setLoading(true);
		setError(null);
		
		if (useMockData) {
			// Mock implementation
			setProducts(products.filter((p) => p.id !== id));
			setLoading(false);
			return;
		}
		
		try {
			const response = await fetch(`/api/auth/product/${id}`, {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
				},
			});

			if (response.ok) {
				setProducts(products.filter((p) => p.id !== id));
			} else {
				const errorData = await response.json().catch(() => ({}));
				setError(`Failed to delete product: ${errorData.error || response.statusText}`);
			}
		} catch (error) {
			setError(`Error deleting product: ${error instanceof Error ? error.message : "Unknown error"}`);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="p-6 max-w-6xl mx-auto">
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-3xl font-bold">BetterCRUD Demo - Products</h1>
				<div className="flex items-center gap-4">
					<label className="flex items-center gap-2">
						<input
							type="checkbox"
							checked={useMockData}
							onChange={(e) => setUseMockData(e.target.checked)}
							className="rounded"
						/>
						<span className="text-sm">Use Mock Data</span>
					</label>
					{useMockData && (
						<span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
							Demo Mode
						</span>
					)}
				</div>
			</div>
			
			{/* Error Display */}
			{error && (
				<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
					{error}
					<button 
						onClick={() => setError(null)}
						className="ml-2 text-red-800 hover:text-red-900"
					>
						×
					</button>
				</div>
			)}

			{/* Create Product Form */}
			<div className="bg-gray-50 p-6 rounded-lg mb-6">
				<h2 className="text-xl font-semibold mb-4">Create New Product</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<input
						type="text"
						placeholder="Product name *"
						value={newProduct.name}
						onChange={(e) =>
							setNewProduct({ ...newProduct, name: e.target.value })
						}
						className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						required
					/>
					<input
						type="number"
						placeholder="Price"
						value={newProduct.price}
						onChange={(e) =>
							setNewProduct({
								...newProduct,
								price: parseFloat(e.target.value) || 0,
							})
						}
						className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						min="0"
						step="0.01"
					/>
					<input
						type="text"
						placeholder="Description"
						value={newProduct.description}
						onChange={(e) =>
							setNewProduct({ ...newProduct, description: e.target.value })
						}
						className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					/>
					<select
						value={newProduct.status}
						onChange={(e) =>
							setNewProduct({ ...newProduct, status: e.target.value as any })
						}
						className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					>
						<option value="draft">Draft</option>
						<option value="active">Active</option>
						<option value="inactive">Inactive</option>
					</select>
				</div>
				<button
					onClick={createProduct}
					disabled={loading || !newProduct.name.trim()}
					className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					{loading ? "Creating..." : "Create Product"}
				</button>
			</div>

			{/* Products List */}
			<div>
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-xl font-semibold">Products ({products.length})</h2>
					<button
						onClick={() => useMockData ? setProducts(mockProducts) : fetchProducts()}
						disabled={loading}
						className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 transition-colors"
					>
						{loading ? "Loading..." : "Refresh"}
					</button>
				</div>

				{products.length === 0 ? (
					<div className="text-center py-12 bg-gray-50 rounded-lg">
						<p className="text-gray-500 text-lg">
							No products found. Create your first product above!
						</p>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{products.map((product) => (
							<div
								key={product.id}
								className="border rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow"
							>
								{editingProduct?.id === product.id ? (
									// Edit mode
									<div className="space-y-3">
										<input
											type="text"
											value={editingProduct.name}
											onChange={(e) =>
												setEditingProduct({ ...editingProduct, name: e.target.value })
											}
											className="w-full px-3 py-2 border rounded-md text-lg font-semibold"
										/>
										<input
											type="number"
											value={editingProduct.price}
											onChange={(e) =>
												setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })
											}
											className="w-full px-3 py-2 border rounded-md"
											min="0"
											step="0.01"
										/>
										<input
											type="text"
											value={editingProduct.description || ""}
											onChange={(e) =>
												setEditingProduct({ ...editingProduct, description: e.target.value })
											}
											placeholder="Description"
											className="w-full px-3 py-2 border rounded-md"
										/>
										<select
											value={editingProduct.status}
											onChange={(e) =>
												setEditingProduct({ ...editingProduct, status: e.target.value as any })
											}
											className="w-full px-3 py-2 border rounded-md"
										>
											<option value="draft">Draft</option>
											<option value="active">Active</option>
											<option value="inactive">Inactive</option>
										</select>
										<div className="flex gap-2">
											<button
												onClick={() => updateProduct(product.id, editingProduct)}
												disabled={loading}
												className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:opacity-50"
											>
												Save
											</button>
											<button
												onClick={() => setEditingProduct(null)}
												className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
											>
												Cancel
											</button>
										</div>
									</div>
								) : (
									// View mode
									<>
										<h3 className="font-semibold text-lg mb-2">{product.name}</h3>
										<p className="text-2xl font-bold text-green-600 mb-2">${product.price}</p>
										{product.description && (
											<p className="text-sm text-gray-600 mb-3">
												{product.description}
											</p>
										)}
										<div className="flex justify-between items-center mb-4">
											<span
												className={`px-3 py-1 rounded-full text-xs font-medium ${
													product.status === "active"
														? "bg-green-100 text-green-800"
														: product.status === "inactive"
															? "bg-red-100 text-red-800"
															: "bg-yellow-100 text-yellow-800"
												}`}
											>
												{product.status}
											</span>
											{product.stock !== undefined && (
												<span className="text-xs text-gray-500">
													Stock: {product.stock}
												</span>
											)}
										</div>
										<div className="flex gap-2">
											<button
												onClick={() => setEditingProduct(product)}
												disabled={loading}
												className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50 flex-1"
											>
												Edit
											</button>
											<button
												onClick={() => deleteProduct(product.id)}
												disabled={loading}
												className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 disabled:opacity-50 flex-1"
											>
												Delete
											</button>
										</div>
									</>
								)}
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
