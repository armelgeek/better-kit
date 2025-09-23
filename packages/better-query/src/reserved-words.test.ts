import { describe, it, expect } from "vitest";
import { generateCreateTableSQL } from "./adapters/kysely";
import { FieldAttribute } from "./types";

describe("Reserved Words Handling", () => {
	it("should escape reserved table names in SQLite", () => {
		const fields: Record<string, FieldAttribute> = {
			id: { type: "string", required: true },
			name: { type: "string", required: true },
		};

		const sql = generateCreateTableSQL("order", fields, "sqlite");
		
		// Should escape the table name "order" with double quotes
		expect(sql).toContain('CREATE TABLE IF NOT EXISTS "order"');
		expect(sql).not.toContain('CREATE TABLE IF NOT EXISTS order (');
	});

	it("should escape reserved column names in SQLite", () => {
		const fields: Record<string, FieldAttribute> = {
			id: { type: "string", required: true },
			order: { type: "string", required: true }, // "order" is reserved
			group: { type: "string", required: true }, // "group" is reserved
		};

		const sql = generateCreateTableSQL("test_table", fields, "sqlite");
		
		// Should escape reserved column names
		expect(sql).toContain('"order" TEXT');
		expect(sql).toContain('"group" TEXT');
	});

	it("should handle PostgreSQL reserved words", () => {
		const fields: Record<string, FieldAttribute> = {
			id: { type: "string", required: true },
			user: { type: "string", required: true }, // "user" is reserved in PostgreSQL
		};

		const sql = generateCreateTableSQL("order", fields, "postgres");
		
		// Should escape both table and column names
		expect(sql).toContain('CREATE TABLE IF NOT EXISTS "order"');
		expect(sql).toContain('"user" TEXT');
	});

	it("should not escape non-reserved words", () => {
		const fields: Record<string, FieldAttribute> = {
			id: { type: "string", required: true },
			name: { type: "string", required: true },
			email: { type: "string", required: true },
		};

		const sql = generateCreateTableSQL("product", fields, "sqlite");
		
		// Should not escape non-reserved words
		expect(sql).toContain('CREATE TABLE IF NOT EXISTS product');
		expect(sql).toContain('name TEXT');
		expect(sql).toContain('email TEXT');
		expect(sql).not.toContain('"product"');
		expect(sql).not.toContain('"name"');
		expect(sql).not.toContain('"email"');
	});

	it("should handle foreign key references with reserved words", () => {
		const fields: Record<string, FieldAttribute> = {
			id: { type: "string", required: true },
			orderId: { 
				type: "string", 
				required: true,
				references: {
					model: "order",
					field: "id"
				}
			},
		};

		const sql = generateCreateTableSQL("order_item", fields, "sqlite");
		
		// Should escape referenced table name
		expect(sql).toContain('REFERENCES "order"(id)');
	});

	it("should generate valid SQL for the order table example", () => {
		const fields: Record<string, FieldAttribute> = {
			id: { type: "string", required: true },
			userId: { type: "string", required: false },
			items: { type: "json", required: true },
			subtotal: { type: "number", required: false },
			tax: { type: "number", default: 0 },
			shipping: { type: "number", default: 0 },
			discount: { type: "number", default: 0 },
			total: { type: "number", required: false },
		};

		const sql = generateCreateTableSQL("order", fields, "sqlite");
		
		// Should generate valid SQL with escaped table name
		expect(sql).toContain('CREATE TABLE IF NOT EXISTS "order"');
		expect(sql).toContain('id TEXT PRIMARY KEY');
		expect(sql).toContain('userId TEXT');
		expect(sql).toContain('items TEXT');
		expect(sql).toContain('tax REAL DEFAULT 0');
		
		// Should be valid SQL (no syntax errors)
		expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS "order" \(\s+(.+\s*,?\s*)+\)/);
	});
});