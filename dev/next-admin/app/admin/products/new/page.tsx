"use client";
import { adminClient } from "@/lib/admin-client";
import { adminConfig } from "@/lib/admin";
import { useAdminCreate } from "better-admin/react";
import { AdminForm } from "better-admin/components";
import { generateFormFields } from "better-admin";
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

	// Get the product resource configuration
	const productResource = adminConfig.resources.get("product");
	if (!productResource) {
		return <div>Resource configuration not found</div>;
	}

	// Auto-generate form fields from the resource configuration
	const fields = generateFormFields(productResource, "create");

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

			{/* Form with auto-generated fields from admin config */}
			<AdminForm
				fields={fields}
				defaultValues={{}}
				title=""
				onSubmit={handleSubmit}
				onCancel={() => router.push("/admin/products")}
				submitLabel="Create Product"
				loading={loading}
			/>
		</div>
	);
}
