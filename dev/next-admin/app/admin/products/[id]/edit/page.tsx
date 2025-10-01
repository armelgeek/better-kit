"use client";
import { adminClient } from "@/lib/admin-client";
import { useAdminGet, useAdminUpdate } from "better-admin/react";
import { AdminForm } from "better-admin/components";
import { useRouter } from "next/navigation";

export default function EditProductPage({
	params,
}: {
	params: { id: string };
}) {
	const router = useRouter();
	const {
		data: product,
		loading: loadingProduct,
		error: loadError,
	} = useAdminGet(adminClient, "product", params.id);
	const {
		update,
		loading: updating,
		error: updateError,
	} = useAdminUpdate(adminClient, "product");

	const handleSubmit = async (data: any) => {
		const result = await update(params.id, data);

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
				<p className="text-red-800">
					Error loading product: {(loadError as Error).message}
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
					<p className="text-red-800">
						Error: {(updateError as Error).message}
					</p>
				</div>
			)}

			{/* Form using new AdminForm component */}
			<AdminForm
				fields={[
					{
						name: "name",
						label: "Product Name",
						type: "text",
						placeholder: "Enter product name",
						required: true,
						defaultValue: prod.name,
					},
					{
						name: "description",
						label: "Description",
						type: "textarea",
						placeholder: "Enter product description",
						defaultValue: prod.description,
					},
					{
						name: "category",
						label: "Category",
						type: "select",
						defaultValue: prod.category,
						options: [
							{ label: "Electronics", value: "electronics" },
							{ label: "Clothing", value: "clothing" },
							{ label: "Books", value: "books" },
							{ label: "Home & Garden", value: "home-garden" },
							{ label: "Other", value: "other" },
						],
					},
					{
						name: "price",
						label: "Price (USD)",
						type: "number",
						placeholder: "0.00",
						required: true,
						defaultValue: prod.price,
						validation: {
							min: { value: 0, message: "Price must be positive" },
						},
					},
					{
						name: "stock",
						label: "Stock",
						type: "number",
						placeholder: "0",
						defaultValue: prod.stock || 0,
						validation: {
							min: { value: 0, message: "Stock must be positive" },
						},
					},
					{
						name: "status",
						label: "Status",
						type: "select",
						required: true,
						defaultValue: prod.status || "draft",
						options: [
							{ label: "🟡 Draft", value: "draft" },
							{ label: "🟢 Active", value: "active" },
							{ label: "🔴 Inactive", value: "inactive" },
						],
					},
				]}
				onSubmit={handleSubmit}
				onCancel={() => router.push("/admin/products")}
				submitLabel="Save Changes"
				loading={updating}
			/>
		</div>
	);
}
