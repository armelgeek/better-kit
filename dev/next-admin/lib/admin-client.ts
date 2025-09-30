"use client";
import { createQueryClient } from "better-query/client";
import { createAdminClient } from "better-admin/client";

const queryClient = createQueryClient({
	baseURL:
		process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/query",
});

export const adminClient = createAdminClient(queryClient);
