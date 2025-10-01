"use client";
import { adminClient } from "@/lib/admin-client";
import { useAdminDelete, useAdminList } from "better-admin/react";
import { DataTable, Badge, Button } from "better-admin/components";
import { useRouter } from "next/navigation";

export default function ProductsPage() {
	const router = useRouter();
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

	const handleDelete = async (product: any) => {
		if (!confirm(`Are you sure you want to delete "${product.name}"?`)) return;
		const success = await deleteProduct(product.id);
		if (success) {
			alert("Product deleted successfully!");
			refetch();
		}
	};

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
				<Button
					onClick={() => router.push("/admin/products/new")}
				>
					+ Add Product
				</Button>
			</div>

			{/* Data Table with new component */}
			<DataTable
				data={data}
				loading={loading}
				searchable={true}
				searchPlaceholder="Search products..."
				onSearch={(query) => setSearch(query)}
				page={page}
				totalPages={totalPages}
				onPageChange={setPage}
				sortBy="name"
				onSort={(column) => setSort(column, "asc")}
				emptyMessage="No products found. Create your first product to get started!"
				columns={[
					{
						key: "name",
						label: "Name",
						sortable: true,
						render: (value, row) => (
							<div>
								<div className="text-sm font-medium text-gray-900">{value}</div>
								{row.description && (
									<div className="text-sm text-gray-500">
										{row.description.substring(0, 50)}
										{row.description.length > 50 ? "..." : ""}
									</div>
								)}
							</div>
						),
					},
					{
						key: "category",
						label: "Category",
						render: (value) => value || "-",
					},
					{
						key: "price",
						label: "Price",
						render: (value) => `$${value.toFixed(2)}`,
					},
					{
						key: "stock",
						label: "Stock",
					},
					{
						key: "status",
						label: "Status",
						render: (value) => (
							<Badge
								variant={
									value === "active"
										? "success"
										: value === "inactive"
											? "destructive"
											: "warning"
								}
							>
								{value}
							</Badge>
						),
					},
				]}
				actions={[
					{
						label: "View",
						onClick: (row) => router.push(`/admin/products/${row.id}`),
						variant: "ghost",
					},
					{
						label: "Edit",
						onClick: (row) => router.push(`/admin/products/${row.id}/edit`),
						variant: "ghost",
					},
					{
						label: "Delete",
						onClick: handleDelete,
						variant: "destructive",
					},
				]}
			/>
		</div>
	);
}
