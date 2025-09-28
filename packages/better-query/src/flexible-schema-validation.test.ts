import { describe, it, expect } from "vitest";
import { z } from "zod";

// Test to validate our flexible schema function works correctly
describe("Flexible Schema Date Handling", () => {
	// Original todo schema with strict date validation
	const todoSchema = z.object({
		id: z.string().optional(),
		title: z.string().min(1, "Title is required"),
		description: z.string().optional(),
		completed: z.boolean().default(false),
		priority: z.enum(["low", "medium", "high"]).default("medium"),
		category: z.string().optional(),
		dueDate: z.date().optional(),
		createdAt: z.date().optional(),
		updatedAt: z.date().optional(),
	});

	// Simulate the createFlexibleSchema function from our fix
	function createFlexibleSchema(schema: z.ZodObject<any>, isPartial = false) {
		const shape = schema.shape;
		const flexibleShape: Record<string, any> = {};
		
		for (const [key, fieldSchema] of Object.entries(shape)) {
			const fieldSchemaAny = fieldSchema as any;
			
			// Check if this field is a date or optional date
			if (fieldSchemaAny._def?.typeName === 'ZodDate') {
				// Replace date with union of string or date
				flexibleShape[key] = z.union([z.string(), z.date()]);
			} else if (fieldSchemaAny._def?.typeName === 'ZodOptional' && 
					   fieldSchemaAny._def?.innerType?._def?.typeName === 'ZodDate') {
				// Replace optional date with optional union of string or date
				flexibleShape[key] = z.union([z.string(), z.date()]).optional();
			} else {
				// Keep the original field schema
				flexibleShape[key] = fieldSchemaAny;
			}
		}
		
		const flexibleSchema = z.object(flexibleShape);
		return isPartial ? flexibleSchema.partial() : flexibleSchema;
	}

	it("should reject date strings with original strict schema", () => {
		const frontendData = {
			title: "Test Todo",
			priority: "medium" as const,
			dueDate: "2024-01-15", // String - should fail validation
		};

		// Original schema should reject string dates
		expect(() => todoSchema.parse(frontendData)).toThrow();
	});

	it("should accept date strings with flexible schema", () => {
		const frontendData = {
			title: "Test Todo",
			priority: "medium" as const,
			dueDate: "2024-01-15", // String - should now pass validation
		};

		const flexibleSchema = createFlexibleSchema(todoSchema);

		// Flexible schema should accept string dates
		const result = flexibleSchema.parse(frontendData);
		expect(result.title).toBe("Test Todo");
		expect(result.dueDate).toBe("2024-01-15");
		expect(typeof result.dueDate).toBe("string");
	});

	it("should accept Date objects with flexible schema", () => {
		const frontendData = {
			title: "Test Todo",
			priority: "medium" as const,
			dueDate: new Date("2024-01-15"), // Date object - should pass validation
		};

		const flexibleSchema = createFlexibleSchema(todoSchema);

		// Flexible schema should accept Date objects too
		const result = flexibleSchema.parse(frontendData);
		expect(result.title).toBe("Test Todo");
		expect(result.dueDate).toBeInstanceOf(Date);
	});

	it("should handle optional date fields correctly", () => {
		const frontendData = {
			title: "Test Todo",
			priority: "medium" as const,
			// No dueDate provided
		};

		const flexibleSchema = createFlexibleSchema(todoSchema);

		// Should work without optional date field
		const result = flexibleSchema.parse(frontendData);
		expect(result.title).toBe("Test Todo");
		expect(result.dueDate).toBeUndefined();
	});

	it("should work with partial schemas for PATCH operations", () => {
		const updateData = {
			dueDate: "2024-02-20", // String - should pass validation
		};

		const flexiblePartialSchema = createFlexibleSchema(todoSchema, true);

		// Partial schema should accept just the date field
		const result = flexiblePartialSchema.parse(updateData);
		expect(result.dueDate).toBe("2024-02-20");
		expect(typeof result.dueDate).toBe("string");
	});

	it("should demonstrate the complete flow: flexible validation -> hook transformation -> strict validation", () => {
		const frontendData = {
			title: "Complete Flow Test",
			priority: "high" as const,
			dueDate: "2024-03-15", // String from frontend
		};

		// Step 1: Flexible schema accepts the string
		const flexibleSchema = createFlexibleSchema(todoSchema);
		const flexibleResult = flexibleSchema.parse(frontendData);
		expect(flexibleResult.dueDate).toBe("2024-03-15");
		expect(typeof flexibleResult.dueDate).toBe("string");

		// Step 2: Hook transforms the string to Date (simulated)
		const hookTransformed = { ...flexibleResult };
		if (hookTransformed.dueDate && typeof hookTransformed.dueDate === 'string') {
			hookTransformed.dueDate = new Date(hookTransformed.dueDate);
		}
		hookTransformed.createdAt = new Date();
		hookTransformed.updatedAt = new Date();

		// Step 3: Original strict schema accepts the transformed data
		const strictResult = todoSchema.parse(hookTransformed);
		expect(strictResult.title).toBe("Complete Flow Test");
		expect(strictResult.dueDate).toBeInstanceOf(Date);
		expect(strictResult.createdAt).toBeInstanceOf(Date);
		expect(strictResult.updatedAt).toBeInstanceOf(Date);

		// Verify the date was correctly parsed
		expect(strictResult.dueDate?.getTime()).toBe(new Date("2024-03-15").getTime());
	});
});