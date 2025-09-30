export function apiRouteTemplate(): string {
	return `import { query } from "@/lib/query";

export const GET = query.handler;
export const POST = query.handler;
export const PATCH = query.handler;
export const DELETE = query.handler;`;
}
