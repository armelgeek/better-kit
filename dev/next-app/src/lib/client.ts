import { createReactAuthClient } from "better-auth/react";
import type { authMinimal as auth } from "./auth-minimal";

export const authClient = createReactAuthClient<typeof auth>({
	baseURL: "http://localhost:3000/api/auth",
});

export const client = authClient;
