/**
 * Example: Setting up Better Auth with Better Admin
 * 
 * This example shows how to configure better-auth and integrate it
 * with better-admin components.
 */

// 1. Setup better-auth client (typically in lib/auth-client.ts)
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

export const { signIn, signUp, signOut, useSession } = authClient;

// 2. Create auth provider for better-admin
import { createBetterAuthProvider } from "better-admin";

export const authProvider = createBetterAuthProvider({
	authClient,
	onError: (error) => {
		console.error("Auth error:", error);
	},
});

// 3. Use in your admin app
import { Admin } from "better-admin/components";

export function App() {
	return (
		<Admin authProvider={authProvider} dataProvider={dataProvider}>
			{/* Your resources and routes */}
		</Admin>
	);
}

// 4. Use auth in components
import { useBetterAuth } from "better-admin";

export function UserProfile() {
	const { user, isLoading } = useBetterAuth(authClient);

	if (isLoading) return <div>Loading...</div>;

	return (
		<div>
			<h1>Welcome, {user?.name}!</h1>
			<p>Email: {user?.email}</p>
		</div>
	);
}

// 5. Login page example
export function LoginPage() {
	const handleLogin = async (email: string, password: string) => {
		try {
			await authClient.signIn.email({ email, password });
			// Redirect to dashboard
		} catch (error) {
			console.error("Login failed:", error);
		}
	};

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				const formData = new FormData(e.currentTarget);
				handleLogin(
					formData.get("email") as string,
					formData.get("password") as string,
				);
			}}
		>
			<input type="email" name="email" required />
			<input type="password" name="password" required />
			<button type="submit">Sign In</button>
		</form>
	);
}
