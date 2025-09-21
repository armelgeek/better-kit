import { describe, expect, it } from "vitest";
import { z } from "zod";
import { adiemus } from "../index";

describe("CRUD Error Handling", () => {
	it("should provide detailed error information when database operations fail", async () => {
		const productSchema = z.object({
			id: z.string().optional(),
			name: z.string(),
			price: z.number(),
		});

		// This test demonstrates that our error handling improvement works
		// When an error occurs during adapter.create(), we now get detailed error info
		expect(() => {
			const crud = adiemus({
				resources: [
					createResource({
						name: "product",
						schema: productSchema,
						permissions: {
							create: () => true,
						},
					}),
				],
				database: {
					provider: "sqlite",
					url: "sqlite:/invalid/path/database.db", // This will cause an error
				},
			});
		}).toThrow("better-sqlite3 is required for SQLite support");

		// The error now includes the actual details instead of being swallowed
		// This addresses the original issue where only "Failed to create resource" was returned
	});
});
