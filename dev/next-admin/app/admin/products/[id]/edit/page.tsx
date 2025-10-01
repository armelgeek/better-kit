"use client";
import { adminClient } from "@/lib/admin-client";
import { useAdminGet, useAdminUpdate } from "better-admin/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditProductPage({
	params,
}: {
	params: { id: string };
}) {
	const router = useRouter();
	const { data: product, loading: loadingProduct, error: loadError } = useAdminGet(
		adminClient,
		"product",
		params.id,
	);
	const { update, loading: updating, error: updateError } = useAdminUpdate(
		adminClient,
		"product",
	);

	const [formData, setFormData] = useState({
		name: "",
		description: "",
		category: "",
		price: 0,
		stock: 0,
		status: "draft" as "draft" | "active" | "inactive",
	});

	// Populate form when product loads
	useEffect(() => {
		if (product) {
			const prod = product as any;
			setFormData({
				name: prod.name || "",
				description: prod.description || "",
				category: prod.category || "",
				price: prod.price || 0,
				stock: prod.stock || 0,
				status: prod.status || "draft",
			});
		}
	}, [product]);

	const handleChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>,
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]:
				name === "price" || name === "stock"
					? Number.parseFloat(value) || 0
					: value,
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		const result = await update(params.id, formData);

		if (result) {
			alert("Product updated successfully!");
			router.push("/admin/products");
		}
	};

	if (loadingProduct) {
		return (
			<div className="flex justify-center items-center h-64">
				<div className="text-gray-500">Loading product...</div>
			</div>
		);
	}

	if (loadError) {
		return (
			<div className="bg-red-50 border border-red-200 rounded-lg p-4">
				<p className="text-red-800">Error loading product: {(loadError as Error).message}</p>
				<button
					onClick={() => router.push("/admin/products")}
					className="mt-4 text-blue-600 hover:text-blue-800"
				>
					← Back to Products
				</button>
			</div>
		);
	}

	if (!product) {
		return (
			<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
				<p className="text-yellow-800">Product not found</p>
				<button
					onClick={() => router.push("/admin/products")}
					className="mt-4 text-blue-600 hover:text-blue-800"
				>
					← Back to Products
				</button>
			</div>
		);
	}

	return (
		<div className="max-w-4xl mx-auto space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
					<p className="text-gray-500 mt-1">Update product information</p>
				</div>
				<button
					type="button"
					onClick={() => router.push("/admin/products")}
					className="text-gray-600 hover:text-gray-900 transition"
				>
					← Back to Products
				</button>
			</div>

			{/* Error Display */}
			{updateError && (
				<div className="bg-red-50 border border-red-200 rounded-lg p-4">
					<p className="text-red-800">Error: {(updateError as Error).message}</p>
				</div>
			)}

			{/* Form */}
			<form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
				{/* Product Name */}
				<div>
					<label
						htmlFor="name"
						className="block text-sm font-medium text-gray-700 mb-2"
					>
						Product Name <span className="text-red-500">*</span>
					</label>
					<input
						type="text"
						id="name"
						name="name"
						value={formData.name}
						onChange={handleChange}
						required
						className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="Enter product name"
					/>
					<p className="mt-1 text-sm text-gray-500">
						The name will be displayed to customers
					</p>
				</div>

				{/* Description */}
				<div>
					<label
						htmlFor="description"
						className="block text-sm font-medium text-gray-700 mb-2"
					>
						Description
					</label>
					<textarea
						id="description"
						name="description"
						value={formData.description}
						onChange={handleChange}
						rows={5}
						className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="Enter product description"
					/>
				</div>

				{/* Category */}
				<div>
					<label
						htmlFor="category"
						className="block text-sm font-medium text-gray-700 mb-2"
					>
						Category
					</label>
					<select
						id="category"
						name="category"
						value={formData.category}
						onChange={handleChange}
						className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="">Select a category</option>
						<option value="electronics">Electronics</option>
						<option value="clothing">Clothing</option>
						<option value="books">Books</option>
						<option value="home-garden">Home & Garden</option>
						<option value="other">Other</option>
					</select>
				</div>

				{/* Price and Stock - Side by Side */}
				<div className="grid grid-cols-2 gap-4">
					{/* Price */}
					<div>
						<label
							htmlFor="price"
							className="block text-sm font-medium text-gray-700 mb-2"
						>
							Price (USD) <span className="text-red-500">*</span>
						</label>
						<input
							type="number"
							id="price"
							name="price"
							value={formData.price}
							onChange={handleChange}
							min="0"
							step="0.01"
							required
							className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="0.00"
						/>
					</div>

					{/* Stock */}
					<div>
						<label
							htmlFor="stock"
							className="block text-sm font-medium text-gray-700 mb-2"
						>
							Stock
						</label>
						<input
							type="number"
							id="stock"
							name="stock"
							value={formData.stock}
							onChange={handleChange}
							min="0"
							className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="0"
						/>
					</div>
				</div>

				{/* Status */}
				<div>
					<label
						htmlFor="status"
						className="block text-sm font-medium text-gray-700 mb-2"
					>
						Status <span className="text-red-500">*</span>
					</label>
					<select
						id="status"
						name="status"
						value={formData.status}
						onChange={handleChange}
						required
						className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="draft">🟡 Draft</option>
						<option value="active">🟢 Active</option>
						<option value="inactive">🔴 Inactive</option>
					</select>
				</div>

				{/* Form Actions */}
				<div className="flex justify-end space-x-4 pt-4 border-t">
					<button
						type="button"
						onClick={() => router.push("/admin/products")}
						className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
						disabled={updating}
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={updating}
						className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{updating ? "Saving..." : "Save Changes"}
					</button>
				</div>
			</form>
		</div>
	);
}
