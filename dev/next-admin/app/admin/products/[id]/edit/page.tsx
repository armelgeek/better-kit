"use client";
import { adminClient } from "@/lib/admin-client";
import { adminConfig } from "@/lib/admin";
import { useAdminGet, useAdminUpdate } from "better-admin/react";
import { AdminForm } from "better-admin/components";
import { generateFormFields } from "better-admin";
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

	// Get the product resource configuration
	const productResource = adminConfig.resources.get("product");
	if (!productResource) {
		return <div>Resource configuration not found</div>;
	}

	// Auto-generate form fields from the resource configuration
	const fields = generateFormFields(productResource, "edit", product as any);

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

			{/* Form with auto-generated fields from admin config */}
			<AdminForm
				fields={fields}
				defaultValues={{}}
				title=""
				onSubmit={handleSubmit}
				onCancel={() => router.push("/admin/products")}
				submitLabel="Save Changes"
				loading={updating}
			/>
		</div>
	);
}
