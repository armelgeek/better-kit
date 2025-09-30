import { betterAuth } from "better-auth";

export const auth = betterAuth({
	database: {
		provider: "sqlite",
		url: "./admin-auth.db",
	},
	emailAndPassword: {
		enabled: true,
	},
	secret: process.env.BETTER_AUTH_SECRET || "demo-secret-key",
});
