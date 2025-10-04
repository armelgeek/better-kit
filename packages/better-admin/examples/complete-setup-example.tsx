/**
 * Complete Better Admin Setup Example
 * 
 * This example shows a complete admin setup with both
 * better-auth and better-query providers integrated.
 */

// ============================================================================
// 1. Setup Database (lib/db.ts)
// ============================================================================
import Database from "better-sqlite3";

export const db = new Database("app.db");

// ============================================================================
// 2. Setup Better Auth Server (lib/auth.ts)
// ============================================================================
import { betterAuth } from "better-auth";

export const auth = betterAuth({
	database: db,
	emailAndPassword: {
		enabled: true,
	},
	socialProviders: {
		github: {
			clientId: process.env.GITHUB_CLIENT_ID!,
			clientSecret: process.env.GITHUB_CLIENT_SECRET!,
		},
	},
});

// ============================================================================
// 3. Setup Better Auth Client (lib/auth-client.ts)
// ============================================================================
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

export const { signIn, signUp, signOut, useSession } = authClient;

// ============================================================================
// 4. Setup Better Query (lib/query.ts)
// ============================================================================
import { betterQuery, createResource } from "better-query";

// Define User resource
const userResource = createResource({
	name: "user",
	schema: {
		id: { type: "string", primary: true },
		name: { type: "string", required: true },
		email: { type: "string", required: true },
		role: { type: "string" },
		createdAt: { type: "date" },
		updatedAt: { type: "date" },
	},
	middlewares: [
		{
			handler: async (context) => {
				const session = await auth.api.getSession({
					headers: context.request.headers,
				});
				if (session) {
					context.user = session.user;
				}
			},
		},
	],
	permissions: {
		create: async (context) => {
			const user = context.user as any;
			return user?.role === "admin";
		},
		read: async (context) => !!context.user,
		update: async (context) => {
			const user = context.user as any;
			return user?.role === "admin" || context.existingData?.id === user?.id;
		},
		delete: async (context) => {
			const user = context.user as any;
			return user?.role === "admin";
		},
	},
});

// Define Post resource
const postResource = createResource({
	name: "post",
	schema: {
		id: { type: "string", primary: true },
		title: { type: "string", required: true },
		content: { type: "string" },
		authorId: { type: "string", required: true },
		published: { type: "boolean", default: false },
		createdAt: { type: "date" },
		updatedAt: { type: "date" },
	},
	middlewares: [
		{
			handler: async (context) => {
				const session = await auth.api.getSession({
					headers: context.request.headers,
				});
				if (session) {
					context.user = session.user;
				}
			},
		},
	],
	permissions: {
		create: async (context) => !!context.user,
		read: async (context) => true, // Public reading
		update: async (context) => {
			const user = context.user as any;
			return context.existingData?.authorId === user?.id;
		},
		delete: async (context) => {
			const user = context.user as any;
			return context.existingData?.authorId === user?.id;
		},
	},
});

export const query = betterQuery({
	database: db,
	resources: [userResource, postResource],
});

// ============================================================================
// 5. Create Admin Providers (lib/admin-providers.ts)
// ============================================================================
import { createBetterAuthProvider, createBetterQueryProvider } from "better-admin";

export const authProvider = createBetterAuthProvider({
	authClient,
	onError: (error) => {
		console.error("Auth error:", error);
	},
});

export const dataProvider = createBetterQueryProvider({
	queryClient: query,
	onError: (error) => {
		console.error("Data error:", error);
	},
});

// ============================================================================
// 6. Login Page (app/login/page.tsx)
// ============================================================================
("use client");

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const router = useRouter();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		try {
			const result = await authClient.signIn.email({
				email,
				password,
			});

			if (result.error) {
				setError(result.error.message);
				return;
			}

			router.push("/admin");
		} catch (err) {
			setError("Login failed. Please try again.");
		}
	};

	return (
		<div className="flex items-center justify-center min-h-screen bg-gray-50">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>Sign In to Admin</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						{error && (
							<div className="p-3 bg-red-100 text-red-700 rounded text-sm">
								{error}
							</div>
						)}

						<div>
							<label className="text-sm font-medium">Email</label>
							<Input
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
							/>
						</div>

						<div>
							<label className="text-sm font-medium">Password</label>
							<Input
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
							/>
						</div>

						<Button type="submit" className="w-full">
							Sign In
						</Button>

						<div className="text-center text-sm text-gray-600">
							<p>Or sign in with:</p>
							<Button
								type="button"
								variant="outline"
								className="mt-2 w-full"
								onClick={() => authClient.signIn.social({ provider: "github" })}
							>
								GitHub
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}

// ============================================================================
// 7. Admin Layout with Auth Protection (app/admin/layout.tsx)
// ============================================================================
("use client");

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBetterAuth } from "better-admin";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
	const { user, isLoading } = useBetterAuth(authClient);
	const router = useRouter();

	useEffect(() => {
		if (!isLoading && !user) {
			router.push("/login");
		}
	}, [user, isLoading, router]);

	if (isLoading) {
		return <div className="flex items-center justify-center h-screen">Loading...</div>;
	}

	if (!user) {
		return null;
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<nav className="bg-white border-b">
				<div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
					<h1 className="text-xl font-bold">Admin Panel</h1>
					<div className="flex items-center gap-4">
						<span className="text-sm text-gray-600">Welcome, {user.name}</span>
						<Button variant="outline" onClick={() => authClient.signOut()}>
							Sign Out
						</Button>
					</div>
				</div>
			</nav>
			<main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
		</div>
	);
}

// ============================================================================
// 8. Users List Page (app/admin/users/page.tsx)
// ============================================================================
("use client");

import { useBetterQuery } from "better-admin";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function UsersPage() {
	const { list, remove } = useBetterQuery("user", query);
	const { data, isLoading } = list.useQuery({
		orderBy: { createdAt: "desc" },
	});

	const columns = [
		{ accessorKey: "name", header: "Name" },
		{ accessorKey: "email", header: "Email" },
		{ accessorKey: "role", header: "Role" },
		{
			id: "actions",
			cell: ({ row }: any) => (
				<div className="flex gap-2">
					<Button asChild size="sm">
						<Link href={`/admin/users/${row.original.id}/edit`}>Edit</Link>
					</Button>
					<Button
						size="sm"
						variant="destructive"
						onClick={async () => {
							if (confirm("Delete this user?")) {
								await remove.mutateAsync({ where: { id: row.original.id } });
							}
						}}
					>
						Delete
					</Button>
				</div>
			),
		},
	];

	if (isLoading) {
		return <div>Loading...</div>;
	}

	return (
		<div>
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-2xl font-bold">Users</h1>
				<Button asChild>
					<Link href="/admin/users/create">Create User</Link>
				</Button>
			</div>
			<DataTable columns={columns} data={data || []} />
		</div>
	);
}

// ============================================================================
// 9. User Create Page (app/admin/users/create/page.tsx)
// ============================================================================
("use client");

import { useBetterQuery } from "better-admin";
import { CrudForm } from "@/components/ui/crud-form";
import { useRouter } from "next/navigation";

export default function UserCreatePage() {
	const { create } = useBetterQuery("user", query);
	const router = useRouter();

	const fields = [
		{ name: "name", label: "Name", type: "text", required: true },
		{ name: "email", label: "Email", type: "email", required: true },
		{
			name: "role",
			label: "Role",
			type: "select",
			options: [
				{ value: "user", label: "User" },
				{ value: "admin", label: "Admin" },
			],
		},
	];

	return (
		<div>
			<h1 className="text-2xl font-bold mb-6">Create User</h1>
			<CrudForm
				fields={fields}
				onSubmit={async (data) => {
					await create.mutateAsync(data);
					router.push("/admin/users");
				}}
				submitLabel="Create User"
			/>
		</div>
	);
}

// ============================================================================
// 10. User Edit Page (app/admin/users/[id]/edit/page.tsx)
// ============================================================================
("use client");

import { useBetterQuery } from "better-admin";
import { CrudForm } from "@/components/ui/crud-form";
import { useRouter } from "next/navigation";

export default function UserEditPage({ params }: { params: { id: string } }) {
	const { get, update } = useBetterQuery("user", query);
	const { data, isLoading } = get.useQuery({ where: { id: params.id } });
	const router = useRouter();

	if (isLoading) {
		return <div>Loading...</div>;
	}

	const fields = [
		{ name: "name", label: "Name", type: "text", required: true },
		{ name: "email", label: "Email", type: "email", required: true },
		{
			name: "role",
			label: "Role",
			type: "select",
			options: [
				{ value: "user", label: "User" },
				{ value: "admin", label: "Admin" },
			],
		},
	];

	return (
		<div>
			<h1 className="text-2xl font-bold mb-6">Edit User</h1>
			<CrudForm
				fields={fields}
				defaultValues={data}
				onSubmit={async (formData) => {
					await update.mutateAsync({
						where: { id: params.id },
						data: formData,
					});
					router.push("/admin/users");
				}}
				submitLabel="Update User"
			/>
		</div>
	);
}

// ============================================================================
// 11. Dashboard with Multiple Resources (app/admin/page.tsx)
// ============================================================================
("use client");

import { useBetterQuery } from "better-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
	const { count: userCount } = useBetterQuery("user", query);
	const { count: postCount } = useBetterQuery("post", query);

	const { data: totalUsers } = userCount.useQuery();
	const { data: totalPosts } = postCount.useQuery();

	return (
		<div>
			<h1 className="text-2xl font-bold mb-6">Dashboard</h1>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<CardTitle>Total Users</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-4xl font-bold">{totalUsers || 0}</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Total Posts</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-4xl font-bold">{totalPosts || 0}</p>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
