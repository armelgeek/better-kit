import { z } from "zod";

// Base schema helper with common fields that users can extend
export const baseResourceSchema = z.object({
	id: z.string(),
	createdAt: z.date().default(() => new Date()),
	updatedAt: z.date().default(() => new Date()),
});
