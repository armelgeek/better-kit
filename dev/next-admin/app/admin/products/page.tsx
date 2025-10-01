"use client";
import { adminClient } from "@/lib/admin-client";
import { useAdminDelete, useAdminList } from "better-admin/react";
import { useState } from "react";

export default function ProductsPage() {
	const {
		data,
		loading,
		error,
		page,
		totalPages,
		total,
		setPage,
		setSearch,
		setSort,
		refetch,
	} = useAdminList(adminClient, "product");
	const { delete: deleteProduct } = useAdminDelete(adminClient, "product");
	const [searchQuery, setSearchQuery] = useState("");

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		setSearch(searchQuery);
	};

	const handleDelete = async (id: string) => {
		if (!confirm("Are you sure you want to delete this product?")) return;
		const success = await deleteProduct(id);
		if (success) {
			alert("Product deleted successfully!");
			refetch();
		}
	};

	if (loading) {
		return (
			<div className="flex justify-center items-center h-64">
				<div className="text-gray-500">Loading products...</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="bg-red-50 border border-red-200 rounded-lg p-4">
				<p className="text-red-800">Error: {(error as Error).message}</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold text-gray-900">Products</h1>
					<p className="text-gray-500 mt-1">
						Manage your product catalog ({total} total)
					</p>
				</div>
				<a
					href="/admin/products/new"
					className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
				>
					+ Add Product
				</a>
			</div>

			{/* Search */}
			<form onSubmit={handleSearch} className="flex gap-2">
				<input
					type="text"
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					placeholder="Search products..."
					className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
				<button
					type="submit"
					className="bg-gray-100 px-6 py-2 rounded-lg hover:bg-gray-200 transition"
				>
					Search
				</button>
			</form>

			{/* Table */}
			<div className="bg-white rounded-lg shadow overflow-hidden">
				<table className="min-w-full divide-y divide-gray-200">
					<thead className="bg-gray-50">
						<tr>
							<th
								className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
								onClick={() =>
									setSort(
										"name",
										page === 1 && data.length > 0 ? "desc" : "asc",
									)
								}
							>
								Name ↕
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Category
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Price
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Stock
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Status
							</th>
							<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
								Actions
							</th>
						</tr>
					</thead>
					<tbody className="bg-white divide-y divide-gray-200">
						{data.length === 0 ? (
							<tr>
								<td colSpan={6} className="px-6 py-8 text-center text-gray-500">
									No products found. Create your first product to get started!
								</td>
							</tr>
						) : (
							data.map((product: any) => (
								<tr key={product.id} className="hover:bg-gray-50">
									<td className="px-6 py-4 whitespace-nowrap">
										<div className="text-sm font-medium text-gray-900">
											{product.name}
										</div>
										{product.description && (
											<div className="text-sm text-gray-500">
												{product.description.substring(0, 50)}
												{product.description.length > 50 ? "..." : ""}
											</div>
										)}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
										{product.category || "-"}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
										${product.price.toFixed(2)}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
										{product.stock}
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										<span
											className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
												product.status === "active"
													? "bg-green-100 text-green-800"
													: product.status === "inactive"
														? "bg-red-100 text-red-800"
														: "bg-yellow-100 text-yellow-800"
											}`}
										>
											{product.status}
										</span>
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
										<a
											href={`/admin/products/${product.id}`}
											className="text-blue-600 hover:text-blue-900"
										>
											View
										</a>
										<a
											href={`/admin/products/${product.id}/edit`}
											className="text-indigo-600 hover:text-indigo-900"
										>
											Edit
										</a>
										<button
											onClick={() => handleDelete(product.id)}
											className="text-red-600 hover:text-red-900"
										>
											Delete
										</button>
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>

			{/* Pagination */}
			{totalPages > 1 && (
				<div className="flex justify-between items-center">
					<div className="text-sm text-gray-500">
						Page {page} of {totalPages}
					</div>
					<div className="flex gap-2">
						<button
							onClick={() => setPage(page - 1)}
							disabled={page === 1}
							className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Previous
						</button>
						<button
							onClick={() => setPage(page + 1)}
							disabled={page === totalPages}
							className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Next
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
