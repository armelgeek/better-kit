import { createQueryClient } from "better-query/client";

export const queryClient = createQueryClient({
  baseUrl: "/api/query",
});