/**
 * Example: Create User Form
 * 
 * Shows how to use CrudForm component with Better Query
 * for creating new users with validation.
 */

"use client";

import { CrudForm } from "@/components/ui/crud-form";
import { useQuery } from "better-query/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CreateUserData {
	name: string;
	email: string;
	password: string;
	role: string;
}

export function CreateUserPage() {
	const router = useRouter();
	
	// Better Query integration - create operation
	const { create } = useQuery("user");

	// Define form fields
	const fields = [
		{
			name: "name",
			label: "Full Name",
			type: "text" as const,
			placeholder: "John Doe",
			required: true,
			description: "The user's full name",
		},
		{
			name: "email",
			label: "Email Address",
			type: "email" as const,
			placeholder: "john@example.com",
			required: true,
			description: "User's email for login",
		},
		{
			name: "password",
			label: "Password",
			type: "password" as const,
			placeholder: "••••••••",
			required: true,
			description: "Minimum 8 characters",
		},
		{
			name: "role",
			label: "Role",
			type: "text" as const,
			placeholder: "user",
			required: true,
			description: "User role (user, admin, etc.)",
		},
	];

	// Handle form submission
	const handleSubmit = async (data: CreateUserData) => {
		try {
			// Create user via Better Query
			await create.mutateAsync(data);

			// Show success message (you can use a toast library)
			alert("User created successfully!");

			// Redirect to users list
			router.push("/users");
		} catch (error) {
			// Handle error
			console.error("Failed to create user:", error);
			alert("Failed to create user. Please try again.");
		}
	};

	return (
		<div className="container mx-auto py-8 max-w-2xl">
			<div className="mb-6">
				<h1 className="text-3xl font-bold">Create User</h1>
				<p className="text-muted-foreground">
					Add a new user to your application
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>User Information</CardTitle>
				</CardHeader>
				<CardContent>
					<CrudForm
						fields={fields}
						onSubmit={handleSubmit}
						submitLabel="Create User"
						isLoading={create.isPending}
					/>
				</CardContent>
			</Card>
		</div>
	);
}
