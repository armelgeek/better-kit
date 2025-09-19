"use client";

import { useState } from "react";

export function CrudDemo() {
	const [products, setProducts] = useState<any[]>([]);
	const [newProduct, setNewProduct] = useState({
		name: "",
		price: 0,
		description: "",
		status: "draft" as const,
	});
	const [loading, setLoading] = useState(false);

	const fetchProducts = async () => {
		setLoading(true);
		try {
			const response = await fetch("/api/products", {
				headers: {
					"Content-Type": "application/json",
				},
			});

			if (response.ok) {
				const data = await response.json();
				setProducts(data.items || []);
			} else {
				console.error("Failed to fetch products:", response.statusText);
			}
		} catch (error) {
			console.error("Error fetching products:", error);
		} finally {
			setLoading(false);
		}
	};

	const createProduct = async () => {
		setLoading(true);
		try {
			const response = await fetch("/api/product", {
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
				console.error("Failed to create product:", response.statusText);
			}
		} catch (error) {
			console.error("Error creating product:", error);
		} finally {
			setLoading(false);
		}
	};

	const deleteProduct = async (id: string) => {
		setLoading(true);
		try {
			const response = await fetch(`/api/product/${id}`, {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
				},
			});

			if (response.ok) {
				setProducts(products.filter((p) => p.id !== id));
			} else {
				console.error("Failed to delete product:", response.statusText);
			}
		} catch (error) {
			console.error("Error deleting product:", error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="p-6 max-w-4xl mx-auto">
			<h1 className="text-3xl font-bold mb-6">CRUD Demo - Products</h1>

			{/* Create Product Form */}
			<div className="bg-gray-50 p-4 rounded-lg mb-6">
				<h2 className="text-xl font-semibold mb-4">Create Product</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<input
						type="text"
						placeholder="Product name"
						value={newProduct.name}
						onChange={(e) =>
							setNewProduct({ ...newProduct, name: e.target.value })
						}
						className="px-3 py-2 border rounded-md"
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
						className="px-3 py-2 border rounded-md"
					/>
					<input
						type="text"
						placeholder="Description"
						value={newProduct.description}
						onChange={(e) =>
							setNewProduct({ ...newProduct, description: e.target.value })
						}
						className="px-3 py-2 border rounded-md"
					/>
					<select
						value={newProduct.status}
						onChange={(e) =>
							setNewProduct({ ...newProduct, status: e.target.value as any })
						}
						className="px-3 py-2 border rounded-md"
					>
						<option value="draft">Draft</option>
						<option value="active">Active</option>
						<option value="inactive">Inactive</option>
					</select>
				</div>
				<button
					onClick={createProduct}
					disabled={loading || !newProduct.name}
					className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
				>
					{loading ? "Creating..." : "Create Product"}
				</button>
			</div>

			{/* Products List */}
			<div>
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-xl font-semibold">Products</h2>
					<button
						onClick={fetchProducts}
						disabled={loading}
						className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
					>
						{loading ? "Loading..." : "Refresh Products"}
					</button>
				</div>

				{products.length === 0 ? (
					<p className="text-gray-500">
						No products found. Create one above or click refresh to load.
					</p>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{products.map((product) => (
							<div
								key={product.id}
								className="border rounded-lg p-4 bg-white shadow"
							>
								<h3 className="font-semibold text-lg">{product.name}</h3>
								<p className="text-gray-600">${product.price}</p>
								{product.description && (
									<p className="text-sm text-gray-500 mt-2">
										{product.description}
									</p>
								)}
								<div className="flex justify-between items-center mt-4">
									<span
										className={`px-2 py-1 rounded text-xs ${
											product.status === "active"
												? "bg-green-100 text-green-800"
												: product.status === "inactive"
													? "bg-red-100 text-red-800"
													: "bg-gray-100 text-gray-800"
										}`}
									>
										{product.status}
									</span>
									<button
										onClick={() => deleteProduct(product.id)}
										disabled={loading}
										className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 disabled:opacity-50"
									>
										Delete
									</button>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
