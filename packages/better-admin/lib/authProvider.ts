import { AuthProvider } from "ra-core";

export interface BetterAuthConfig {
	baseURL: string;
	plugins?: any[];
}

/**
 * Creates an auth provider for better-auth integration
 * This is a placeholder implementation - in a real scenario, 
 * you would integrate with your actual better-auth instance
 */
export function createBetterAuthProvider(config: BetterAuthConfig): AuthProvider {
	const { baseURL } = config;

	return {
		async login(params) {
			const { username, password } = params;
			try {
				const response = await fetch(`${baseURL}/signin`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ email: username, password }),
				});
				
				if (!response.ok) {
					throw new Error('Invalid credentials');
				}
				
				return Promise.resolve();
			} catch (error) {
				throw new Error("Invalid credentials");
			}
		},
		
		async logout() {
			try {
				await fetch(`${baseURL}/signout`, { method: 'POST' });
				return Promise.resolve();
			} catch {
				// Even if the request fails, we should log out locally
				return Promise.resolve();
			}
		},
		
		async checkError({ status }) {
			if (status === 401 || status === 403) {
				throw new Error("Session expired");
			}
		},
		
		async checkAuth() {
			try {
				const response = await fetch(`${baseURL}/session`);
				if (!response.ok) {
					throw new Error("Authentication required");
				}
				return Promise.resolve();
			} catch {
				throw new Error("Authentication required");
			}
		},
		
		async getIdentity() {
			try {
				const response = await fetch(`${baseURL}/session`);
				if (!response.ok) {
					throw new Error("No user session found");
				}
				
				const session = await response.json();
				const user = session?.user;
				
				if (user) {
					return {
						id: user.id,
						fullName: user.name || user.email,
						avatar: user.image,
					};
				}
				
				throw new Error("No user session found");
			} catch (error) {
				throw new Error("No user session found");
			}
		},
	};
}

// Default auth provider for development
export const authProvider = createBetterAuthProvider({
	baseURL: "/api/auth",
});