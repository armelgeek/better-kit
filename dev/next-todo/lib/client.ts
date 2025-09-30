import { createQueryClient } from "better-query/client";

export const queryClient = createQueryClient({
	baseURL: "/api/query",
});
