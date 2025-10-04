/**
 * Example: User Management with Data Table
 * 
 * Shows how to use DataTable component with Better Query
 * for a complete user listing with search and pagination.
 */

"use client";

import { DataTable } from "@/components/ui/data-table";
import { useQuery } from "better-query/react";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface User {
	id: string;
	name: string;
	email: string;
	role: string;
	status: "active" | "inactive";
	createdAt: Date;
}

export function UsersListPage() {
	// Better Query integration - list operation
	const { list, remove } = useQuery("user");
	const { data: users, isLoading, error } = list.useQuery();

	// Define table columns
	const columns: ColumnDef<User>[] = [
		{
			accessorKey: "name",
			header: "Name",
		},
		{
			accessorKey: "email",
			header: "Email",
		},
		{
			accessorKey: "role",
			header: "Role",
			cell: ({ row }) => (
				<Badge variant="outline">{row.getValue("role")}</Badge>
			),
		},
		{
			accessorKey: "status",
			header: "Status",
			cell: ({ row }) => {
				const status = row.getValue("status") as string;
				return (
					<Badge variant={status === "active" ? "default" : "secondary"}>
						{status}
					</Badge>
				);
			},
		},
		{
			id: "actions",
			header: "Actions",
			cell: ({ row }) => {
				const user = row.original;
				return (
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								// Navigate to edit page
								window.location.href = `/users/${user.id}/edit`;
							}}
						>
							Edit
						</Button>
						<Button
							variant="destructive"
							size="sm"
							onClick={async () => {
								if (confirm(`Delete user ${user.name}?`)) {
									await remove.mutateAsync({
										where: { id: user.id },
									});
								}
							}}
						>
							Delete
						</Button>
					</div>
				);
			},
		},
	];

	// Handle loading state
	if (isLoading) {
		return <div className="p-8">Loading users...</div>;
	}

	// Handle error state
	if (error) {
		return (
			<div className="p-8 text-red-600">
				Error loading users: {error.message}
			</div>
		);
	}

	return (
		<div className="container mx-auto py-8">
			<div className="mb-6 flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">Users</h1>
					<p className="text-muted-foreground">
						Manage your application users
					</p>
				</div>
				<Button
					onClick={() => {
						window.location.href = "/users/create";
					}}
				>
					Create User
				</Button>
			</div>

			<DataTable
				columns={columns}
				data={users || []}
				searchKey="name"
				searchPlaceholder="Search by name..."
			/>
		</div>
	);
}
