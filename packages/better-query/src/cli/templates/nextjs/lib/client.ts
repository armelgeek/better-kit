export function clientConfigTemplate(): string {
	return `import { createQueryClient } from "better-query";
import type { QueryType } from "./query";

export const queryClient = createQueryClient<QueryType>({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/query",
});`;
}