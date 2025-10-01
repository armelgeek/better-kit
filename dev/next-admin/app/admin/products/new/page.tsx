"use client";
import { adminClient } from "@/lib/admin-client";
import { useAdminCreate } from "better-admin/react";
import { AdminForm } from "better-admin/components";
import { useRouter } from "next/navigation";

export default function NewProductPage() {
	const router = useRouter();
	const { create, loading, error } = useAdminCreate(adminClient, "product");

	const handleSubmit = async (data: any) => {
		const result = await create(data);

		if (result) {
			alert("Product created successfully!");
			router.push("/admin/products");
		}
	};

	return (
		<div className="max-w-4xl mx-auto space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-gray-900">Create Product</h1>
					<p className="text-gray-500 mt-1">
						Add a new product to your catalog
					</p>
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
			{error && (
				<div className="bg-red-50 border border-red-200 rounded-lg p-4">
					<p className="text-red-800">Error: {(error as Error).message}</p>
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
					},
					{
						name: "description",
						label: "Description",
						type: "textarea",
						placeholder: "Enter product description",
					},
					{
						name: "category",
						label: "Category",
						type: "select",
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
						validation: {
							min: { value: 0, message: "Price must be positive" },
						},
					},
					{
						name: "stock",
						label: "Stock",
						type: "number",
						placeholder: "0",
						defaultValue: 0,
						validation: {
							min: { value: 0, message: "Stock must be positive" },
						},
					},
					{
						name: "status",
						label: "Status",
						type: "select",
						required: true,
						defaultValue: "draft",
						options: [
							{ label: "🟡 Draft", value: "draft" },
							{ label: "🟢 Active", value: "active" },
							{ label: "🔴 Inactive", value: "inactive" },
						],
					},
				]}
				onSubmit={handleSubmit}
				onCancel={() => router.push("/admin/products")}
				submitLabel="Create Product"
				loading={loading}
			/>
		</div>
	);
}
