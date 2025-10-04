/**
 * Example: Edit User Form
 * 
 * Shows how to use CrudForm component with Better Query
 * for editing existing users (get + update operations).
 */

"use client";

import { CrudForm } from "@/components/ui/crud-form";
import { useQuery } from "better-query/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EditUserPageProps {
	params: {
		id: string;
	};
}

interface UpdateUserData {
	name: string;
	email: string;
	role: string;
}

export function EditUserPage({ params }: EditUserPageProps) {
	const router = useRouter();
	const userId = params.id;

	// Better Query integration - get and update operations
	const { get, update } = useQuery("user");
	const { data: user, isLoading, error } = get.useQuery({
		where: { id: userId },
	});

	// Define form fields
	const fields = [
		{
			name: "name",
			label: "Full Name",
			type: "text" as const,
			placeholder: "John Doe",
			required: true,
		},
		{
			name: "email",
			label: "Email Address",
			type: "email" as const,
			placeholder: "john@example.com",
			required: true,
		},
		{
			name: "role",
			label: "Role",
			type: "text" as const,
			placeholder: "user",
			required: true,
		},
	];

	// Handle form submission
	const handleSubmit = async (data: UpdateUserData) => {
		try {
			// Update user via Better Query
			await update.mutateAsync({
				where: { id: userId },
				data,
			});

			// Show success message
			alert("User updated successfully!");

			// Redirect to users list
			router.push("/users");
		} catch (error) {
			// Handle error
			console.error("Failed to update user:", error);
			alert("Failed to update user. Please try again.");
		}
	};

	// Handle loading state
	if (isLoading) {
		return (
			<div className="container mx-auto py-8 max-w-2xl">
				<div className="p-8 text-center">Loading user...</div>
			</div>
		);
	}

	// Handle error state
	if (error) {
		return (
			<div className="container mx-auto py-8 max-w-2xl">
				<div className="p-8 text-center text-red-600">
					Error loading user: {error.message}
				</div>
			</div>
		);
	}

	// Handle user not found
	if (!user) {
		return (
			<div className="container mx-auto py-8 max-w-2xl">
				<div className="p-8 text-center">User not found</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto py-8 max-w-2xl">
			<div className="mb-6">
				<h1 className="text-3xl font-bold">Edit User</h1>
				<p className="text-muted-foreground">
					Update user information
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>User Information</CardTitle>
				</CardHeader>
				<CardContent>
					<CrudForm
						fields={fields}
						defaultValues={user}
						onSubmit={handleSubmit}
						submitLabel="Update User"
						isLoading={update.isPending}
					/>
				</CardContent>
			</Card>
		</div>
	);
}
