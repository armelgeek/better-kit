import { betterAuth } from "better-auth";

// Minimal auth configuration for testing
export const authMinimal = betterAuth({
	database: {
		provider: "sqlite",
		url: ":memory:",
	},
	secret: "test-secret",
	emailAndPassword: {
		enabled: true,
	},
});

export type AuthMinimal = typeof authMinimal;