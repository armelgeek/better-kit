import { createAuthClient } from "better-auth/react";
import type { auth } from "@/lib/auth";

export const authClient = createAuthClient({
  baseURL: "/api/auth",
});

export type AuthClient = typeof authClient;