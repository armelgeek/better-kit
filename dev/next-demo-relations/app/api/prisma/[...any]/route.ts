import { queryPrisma } from "@/lib/query-prisma";

/**
 * API Route for Prisma ORM implementation
 * Handles all CRUD operations for resources with relationships
 */

export const GET = queryPrisma.handler;
export const POST = queryPrisma.handler;
export const PUT = queryPrisma.handler;
export const PATCH = queryPrisma.handler;
export const DELETE = queryPrisma.handler;
