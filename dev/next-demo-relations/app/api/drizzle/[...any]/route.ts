import { queryDrizzle } from "@/lib/query-drizzle";

/**
 * API Route for Drizzle ORM implementation
 * Handles all CRUD operations for resources with relationships
 */

export const GET = queryDrizzle.handler;
export const POST = queryDrizzle.handler;
export const PUT = queryDrizzle.handler;
export const PATCH = queryDrizzle.handler;
export const DELETE = queryDrizzle.handler;
