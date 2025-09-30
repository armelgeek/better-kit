import { z } from "zod";

/**
 * Base schema helper with common fields that users can extend
 * Example usage:
 *
 * const mySchema = z.object({
 *   id: z.string().optional(),
 *   name: z.string().min(1),
 *   createdAt: z.date().default(() => new Date()),
 *   updatedAt: z.date().default(() => new Date()),
 * });
 */

// Helper for creating schemas with common timestamp fields
export const withTimestamps = <T extends z.ZodRawShape>(shape: T) =>
	z.object({
		...shape,
		createdAt: z.date().default(() => new Date()),
		updatedAt: z.date().default(() => new Date()),
	});

// Helper for creating schemas with id and timestamps
export const withId = <T extends z.ZodRawShape>(shape: T) =>
	z.object({
		id: z.string().optional(),
		...shape,
		createdAt: z.date().default(() => new Date()),
		updatedAt: z.date().default(() => new Date()),
	});
