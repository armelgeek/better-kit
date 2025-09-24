import { AuthProvider } from "ra-core";
import { createAuthClient } from "better-auth/react";

const betterAuth = createAuthClient({
    baseURL: `${import.meta.env.VITE_APP_SERVER_URL}/api/auth`,
    plugins: [],
});

export const authProvider: AuthProvider = {
    async login(params) {
        const { username, password } = params;
        try {
            await betterAuth.signIn.email(username, password);
        } catch {
            throw new Error("Invalid credentials");
        }
    },
    async logout() {
        await betterAuth.signOut();
    },
    async checkError({ status }) {
        if (status === 401 || status === 403) {
            await betterAuth.signOut();
            throw new Error("Session expired");
        }
    },
    async checkAuth() {
        const session = await betterAuth.getSession?.();
        if (!session) throw new Error("Authentication required");
    },
    async getIdentity() {
        const session = await betterAuth.getSession?.();
        const user = session?.data?.user;
        if (user) {
            return {
                id: user.id,
                fullName: user.email,
                avatar: user.image ?? undefined,
            };
        }
        throw new Error("No user session found");
    },
};