"use client";
import { adminClient } from "@/lib/admin-client";
import { useAdminGet } from "better-admin/react";
import { useRouter } from "next/navigation";

export default function ViewProductPage({
	params,
}: {
	params: { id: string };
}) {
	const router = useRouter();
	const {
		data: product,
		loading,
		error,
	} = useAdminGet(adminClient, "product", params.id);

	if (loading) {
		return (
			<div className="flex justify-center items-center h-64">
				<div className="text-gray-500">Loading prod...</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="bg-red-50 border border-red-200 rounded-lg p-4">
				<p className="text-red-800">
					Error loading product: {(error as Error).message}
				</p>
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

	const prod = product as any;

	const formatDate = (date: any) => {
		if (!date) return "-";
		return new Date(date).toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	return (
		<div className="max-w-4xl mx-auto space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-gray-900">{prod.name}</h1>
					<p className="text-gray-500 mt-1">Product Details</p>
				</div>
				<div className="flex space-x-3">
					<button
						type="button"
						onClick={() => router.push("/admin/products")}
						className="text-gray-600 hover:text-gray-900 transition"
					>
						← Back to Products
					</button>
					<button
						onClick={() => router.push(`/admin/products/${params.id}/edit`)}
						className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
					>
						Edit Product
					</button>
				</div>
			</div>

			{/* Product Details Card */}
			<div className="bg-white rounded-lg shadow overflow-hidden">
				<div className="p-6 space-y-6">
					{/* Basic Information */}
					<div>
						<h2 className="text-lg font-semibold text-gray-900 mb-4">
							Basic Information
						</h2>
						<dl className="grid grid-cols-1 gap-4">
							<div>
								<dt className="text-sm font-medium text-gray-500">
									Product Name
								</dt>
								<dd className="mt-1 text-sm text-gray-900">{prod.name}</dd>
							</div>

							{prod.description && (
								<div>
									<dt className="text-sm font-medium text-gray-500">
										Description
									</dt>
									<dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
										{prod.description}
									</dd>
								</div>
							)}

							<div>
								<dt className="text-sm font-medium text-gray-500">Category</dt>
								<dd className="mt-1 text-sm text-gray-900 capitalize">
									{prod.category || "-"}
								</dd>
							</div>
						</dl>
					</div>

					{/* Pricing & Inventory */}
					<div className="border-t pt-6">
						<h2 className="text-lg font-semibold text-gray-900 mb-4">
							Pricing & Inventory
						</h2>
						<dl className="grid grid-cols-2 gap-4">
							<div>
								<dt className="text-sm font-medium text-gray-500">Price</dt>
								<dd className="mt-1 text-2xl font-bold text-gray-900">
									${prod.price.toFixed(2)}
								</dd>
							</div>

							<div>
								<dt className="text-sm font-medium text-gray-500">Stock</dt>
								<dd className="mt-1 text-2xl font-bold text-gray-900">
									{prod.stock}
								</dd>
							</div>
						</dl>
					</div>

					{/* Status */}
					<div className="border-t pt-6">
						<h2 className="text-lg font-semibold text-gray-900 mb-4">Status</h2>
						<span
							className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
								prod.status === "active"
									? "bg-green-100 text-green-800"
									: prod.status === "inactive"
										? "bg-red-100 text-red-800"
										: "bg-yellow-100 text-yellow-800"
							}`}
						>
							{prod.status === "active" && "🟢"}
							{prod.status === "inactive" && "🔴"}
							{prod.status === "draft" && "🟡"} {prod.status}
						</span>
					</div>

					{/* Timestamps */}
					{(prod.createdAt || prod.updatedAt) && (
						<div className="border-t pt-6">
							<h2 className="text-lg font-semibold text-gray-900 mb-4">
								Timestamps
							</h2>
							<dl className="grid grid-cols-2 gap-4">
								{prod.createdAt && (
									<div>
										<dt className="text-sm font-medium text-gray-500">
											Created At
										</dt>
										<dd className="mt-1 text-sm text-gray-900">
											{formatDate(prod.createdAt)}
										</dd>
									</div>
								)}

								{prod.updatedAt && (
									<div>
										<dt className="text-sm font-medium text-gray-500">
											Updated At
										</dt>
										<dd className="mt-1 text-sm text-gray-900">
											{formatDate(prod.updatedAt)}
										</dd>
									</div>
								)}
							</dl>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
