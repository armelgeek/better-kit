import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createResource, withId } from "../index";

describe("Date parsing fix for todo app", () => {
	const todoSchema = withId({
		title: z.string().min(1, "Title is required"),
		description: z.string().optional(),
		completed: z.boolean().default(false),
		priority: z.enum(["low", "medium", "high"]).default("medium"),
		category: z.string().optional(),
		dueDate: z.date().optional(),
	});

	it("should handle date string conversion in beforeCreate hook", async () => {
		const todoResource = createResource({
			name: "todo",
			schema: todoSchema,
			hooks: {
				beforeCreate: async (context) => {
					// Convert date string to Date object if present (like our fix)
					if (
						context.data.dueDate &&
						typeof context.data.dueDate === "string"
					) {
						context.data.dueDate = new Date(context.data.dueDate);
					}
					// Auto-generate timestamps
					context.data.createdAt = new Date();
					context.data.updatedAt = new Date();
				},
			},
		});

		// Simulate frontend sending a date string (like from HTML date input)
		const mockContext = {
			user: { id: "user123" },
			resource: "todo",
			operation: "create" as const,
			data: {
				title: "Test Todo",
				description: "Test description",
				priority: "medium" as const,
				dueDate: "2024-01-15", // String from HTML date input
			},
			adapter: {} as any,
		};

		// Before hook: dueDate is string
		expect(typeof mockContext.data.dueDate).toBe("string");

		// Execute the hook
		await todoResource.hooks!.beforeCreate!(mockContext);

		// After hook: dueDate should be converted to Date
		expect(mockContext.data.dueDate).toBeInstanceOf(Date);
		expect(mockContext.data.createdAt).toBeInstanceOf(Date);
		expect(mockContext.data.updatedAt).toBeInstanceOf(Date);

		// Schema validation should now pass
		const parsed = todoSchema.parse(mockContext.data);
		expect(parsed.dueDate).toBeInstanceOf(Date);
		expect(parsed.title).toBe("Test Todo");
	});

	it("should handle date string conversion in beforeUpdate hook", async () => {
		const todoResource = createResource({
			name: "todo",
			schema: todoSchema,
			hooks: {
				beforeUpdate: async (context) => {
					// Convert date string to Date object if present (like our fix)
					if (
						context.data.dueDate &&
						typeof context.data.dueDate === "string"
					) {
						context.data.dueDate = new Date(context.data.dueDate);
					}
					context.data.updatedAt = new Date();
				},
			},
		});

		// Simulate frontend sending a date string in an update
		const mockContext = {
			user: { id: "user123" },
			resource: "todo",
			operation: "update" as const,
			data: {
				dueDate: "2024-02-20", // String from HTML date input
			},
			adapter: {} as any,
		};

		// Before hook: dueDate is string
		expect(typeof mockContext.data.dueDate).toBe("string");

		// Execute the hook
		await todoResource.hooks!.beforeUpdate!(mockContext);

		// After hook: dueDate should be converted to Date
		expect(mockContext.data.dueDate).toBeInstanceOf(Date);
		expect(mockContext.data.updatedAt).toBeInstanceOf(Date);
	});

	it("should handle empty dueDate without errors", async () => {
		const todoResource = createResource({
			name: "todo",
			schema: todoSchema,
			hooks: {
				beforeCreate: async (context) => {
					// Convert date string to Date object if present (like our fix)
					if (
						context.data.dueDate &&
						typeof context.data.dueDate === "string"
					) {
						context.data.dueDate = new Date(context.data.dueDate);
					}
					context.data.createdAt = new Date();
					context.data.updatedAt = new Date();
				},
			},
		});

		// Simulate frontend sending empty dueDate (common case)
		const mockContext = {
			user: { id: "user123" },
			resource: "todo",
			operation: "create" as const,
			data: {
				title: "Test Todo without date",
				priority: "medium" as const,
				// dueDate is not provided/empty
			},
			adapter: {} as any,
		};

		// Execute the hook
		await todoResource.hooks!.beforeCreate!(mockContext);

		// Should not have dueDate and should pass validation
		expect(mockContext.data.dueDate).toBeUndefined();

		// Schema validation should pass
		const parsed = todoSchema.parse(mockContext.data);
		expect(parsed.dueDate).toBeUndefined();
		expect(parsed.title).toBe("Test Todo without date");
	});
});
