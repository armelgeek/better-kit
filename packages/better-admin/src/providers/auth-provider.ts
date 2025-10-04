/**
 * Better Auth Provider for Better Admin
 * 
 * Provides authentication functionality using better-auth instead of ra-core.
 * This adapter allows admin components to work seamlessly with better-auth.
 */

export interface AuthProviderOptions {
	/**
	 * The better-auth client instance
	 */
	authClient: any;
	/**
	 * Optional custom error handler
	 */
	onError?: (error: Error) => void;
}

export interface User {
	id: string;
	email?: string;
	name?: string;
	image?: string;
	[key: string]: any;
}

export interface AuthProvider {
	/**
	 * Called when the user attempts to log in
	 */
	login: (params: { email: string; password: string }) => Promise<void>;
	/**
	 * Called when the user logs out
	 */
	logout: () => Promise<void>;
	/**
	 * Called when the user navigates to a protected page and the credentials haven't been checked yet
	 */
	checkAuth: () => Promise<void>;
	/**
	 * Called when the API returns an error
	 */
	checkError: (error: any) => Promise<void>;
	/**
	 * Called to retrieve the user identity
	 */
	getIdentity: () => Promise<User | null>;
	/**
	 * Called to retrieve the user permissions
	 */
	getPermissions?: () => Promise<any>;
}

/**
 * Creates an auth provider that integrates better-auth with better-admin
 * 
 * @example
 * ```ts
 * import { authClient } from './auth-client';
 * import { createBetterAuthProvider } from 'better-admin/providers/auth';
 * 
 * const authProvider = createBetterAuthProvider({
 *   authClient,
 * });
 * ```
 */
export function createBetterAuthProvider(
	options: AuthProviderOptions,
): AuthProvider {
	const { authClient, onError } = options;

	return {
		login: async ({ email, password }) => {
			try {
				const result = await authClient.signIn.email({
					email,
					password,
				});

				if (result.error) {
					throw new Error(result.error.message || "Login failed");
				}
			} catch (error) {
				if (onError) {
					onError(error as Error);
				}
				throw error;
			}
		},

		logout: async () => {
			try {
				await authClient.signOut();
			} catch (error) {
				if (onError) {
					onError(error as Error);
				}
				throw error;
			}
		},

		checkAuth: async () => {
			try {
				const session = await authClient.getSession();
				if (!session || !session.data) {
					throw new Error("Not authenticated");
				}
			} catch (error) {
				throw new Error("Not authenticated");
			}
		},

		checkError: async (error) => {
			const status = error?.status || error?.response?.status;
			if (status === 401 || status === 403) {
				throw new Error("Unauthorized");
			}
		},

		getIdentity: async () => {
			try {
				const session = await authClient.getSession();
				if (!session?.data?.user) {
					return null;
				}

				const user = session.data.user;
				return {
					id: user.id,
					email: user.email,
					name: user.name,
					image: user.image,
					...user,
				};
			} catch (error) {
				return null;
			}
		},

		getPermissions: async () => {
			try {
				const session = await authClient.getSession();
				return session?.data?.user?.role || null;
			} catch (error) {
				return null;
			}
		},
	};
}

/**
 * Hook to use the auth provider in React components
 * 
 * @example
 * ```tsx
 * import { useBetterAuth } from 'better-admin/providers/auth';
 * 
 * function MyComponent() {
 *   const { user, isLoading } = useBetterAuth();
 *   
 *   if (isLoading) return <div>Loading...</div>;
 *   
 *   return <div>Welcome {user?.name}</div>;
 * }
 * ```
 */
export function useBetterAuth(authClient: any) {
	// This uses better-auth's built-in React hooks
	const session = authClient.useSession();

	return {
		user: session.data?.user || null,
		isLoading: session.isPending,
		error: session.error,
		signIn: authClient.signIn,
		signOut: authClient.signOut,
		signUp: authClient.signUp,
	};
}
