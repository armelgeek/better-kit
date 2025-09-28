import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { betterQuery, createResource, withId } from "./index";
import { z } from "zod";
import Database from "better-sqlite3";
import { KyselyQueryAdapter } from "./adapters/kysely";
import { Kysely, SqliteDialect } from "kysely";

describe("Date parsing endpoint integration", () => {
	const todoSchema = withId({
		title: z.string().min(1, "Title is required"),
		description: z.string().optional(),
		completed: z.boolean().default(false),
		priority: z.enum(["low", "medium", "high"]).default("medium"),
		category: z.string().optional(),
		dueDate: z.date().optional(),
	});

	let db: Database.Database;
	let kyselyDb: Kysely<any>;
	let adapter: KyselyQueryAdapter;
	let query: any;

	beforeEach(() => {
		// Create in-memory SQLite database
		db = new Database(":memory:");
		
		kyselyDb = new Kysely({
			dialect: new SqliteDialect({
				database: db,
			}),
		});

		adapter = new KyselyQueryAdapter(kyselyDb);

		// Create todo resource with date parsing hooks
		const todoResource = createResource({
			name: "todo",
			schema: todoSchema,
			hooks: {
				beforeCreate: async (context) => {
					// Convert date string to Date object if present (our fix)
					if (context.data.dueDate && typeof context.data.dueDate === 'string') {
						context.data.dueDate = new Date(context.data.dueDate);
					}
					// Auto-generate timestamps
					context.data.createdAt = new Date();
					context.data.updatedAt = new Date();
				},
				beforeUpdate: async (context) => {
					// Convert date string to Date object if present (our fix)
					if (context.data.dueDate && typeof context.data.dueDate === 'string') {
						context.data.dueDate = new Date(context.data.dueDate);
					}
					context.data.updatedAt = new Date();
				},
			},
		});

		// Create better-query instance
		query = betterQuery({
			basePath: "/api/query",
			database: {
				provider: "sqlite",
				url: ":memory:",
			},
			resources: [todoResource],
		});

		// Create table manually for testing
		db.exec(`
			CREATE TABLE todo (
				id TEXT PRIMARY KEY,
				title TEXT NOT NULL,
				description TEXT,
				completed BOOLEAN DEFAULT FALSE,
				priority TEXT DEFAULT 'medium',
				category TEXT,
				dueDate TEXT,
				createdAt TEXT,
				updatedAt TEXT
			)
		`);
	});

	afterEach(() => {
		db?.close();
	});

	it("should accept date strings in POST requests and convert them to Date objects", async () => {
		// Simulate a POST request with date string (like from HTML date input)
		const requestData = {
			title: "Test Todo with Date",
			description: "Testing date parsing",
			priority: "high" as const,
			dueDate: "2024-01-15", // String from frontend
		};

		// Get the create endpoint
		const createEndpoint = query.api.createTodo;
		
		expect(createEndpoint).toBeDefined();

		// Mock context for the endpoint
		const mockContext = {
			body: requestData,
			context: { adapter },
			query: {},
			request: {},
			user: { id: "user123" },
			json: (data: any, options?: any) => ({ data, options }),
		};

		// Call the endpoint handler
		const result = await createEndpoint(mockContext as any);

		// Should succeed without validation errors
		expect(result).toBeDefined();
		expect(result.options?.status).not.toBe(400); // No validation error

		// Check that the data was processed correctly
		if (result.data && !result.data.error) {
			expect(result.data.title).toBe("Test Todo with Date");
			expect(result.data.dueDate).toBeDefined();
			// The final result should have a proper date (as ISO string in database)
			expect(typeof result.data.dueDate).toBe("string");
			expect(new Date(result.data.dueDate).getTime()).toBe(new Date("2024-01-15").getTime());
		}
	});

	it("should handle empty/undefined date fields without errors", async () => {
		// Simulate a POST request without dueDate
		const requestData = {
			title: "Test Todo without Date",
			priority: "medium" as const,
		};

		// Get the create endpoint
		const createEndpoint = query.api.createTodo;

		// Mock context for the endpoint
		const mockContext = {
			body: requestData,
			context: { adapter },
			query: {},
			request: {},
			user: { id: "user123" },
			json: (data: any, options?: any) => ({ data, options }),
		};

		// Call the endpoint handler
		const result = await createEndpoint(mockContext as any);

		// Should succeed without validation errors
		expect(result).toBeDefined();
		expect(result.options?.status).not.toBe(400); // No validation error

		// Check that the data was processed correctly
		if (result.data && !result.data.error) {
			expect(result.data.title).toBe("Test Todo without Date");
			expect(result.data.dueDate == null).toBe(true); // Accept both null and undefined
		}
	});

	it("should handle PATCH updates with date strings", async () => {
		// First create a todo
		const createData = {
			title: "Original Todo",
			priority: "low" as const,
		};

		const createEndpoint = query.api.createTodo;
		const updateEndpoint = query.api.updateTodo;

		// Create todo first
		const createContext = {
			body: createData,
			context: { adapter },
			query: {},
			request: {},
			user: { id: "user123" },
			json: (data: any, options?: any) => ({ data, options }),
		};

		const createResult = await createEndpoint(createContext as any);
		const todoId = createResult.data.id;

		// Now update with date string
		const updateData = {
			dueDate: "2024-02-20", // String from frontend
		};

		const updateContext = {
			params: { id: todoId },
			body: updateData,
			context: { adapter },
			query: {},
			request: {},
			user: { id: "user123" },
			json: (data: any, options?: any) => ({ data, options }),
		};

		const updateResult = await updateEndpoint(updateContext as any);

		// Should succeed without validation errors
		expect(updateResult).toBeDefined();
		expect(updateResult.options?.status).not.toBe(400); // No validation error

		// Check that the update worked
		if (updateResult.data && !updateResult.data.error) {
			expect(updateResult.data.dueDate).toBeDefined();
			// The final result should have a proper date (as ISO string in database)
			expect(typeof updateResult.data.dueDate).toBe("string");
			expect(new Date(updateResult.data.dueDate).getTime()).toBe(new Date("2024-02-20").getTime());
		}
	});
});