import Database from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { KyselyCrudAdapter } from "./kysely";

describe("KyselyCrudAdapter Data Transformation", () => {
	let adapter: KyselyCrudAdapter;
	let db: Kysely<any>;
	let sqliteDb: Database.Database;

	beforeEach(async () => {
		// Create in-memory SQLite database
		sqliteDb = new Database(":memory:");
		db = new Kysely({
			dialect: new SqliteDialect({
				database: sqliteDb,
			}),
		});

		adapter = new KyselyCrudAdapter(db);

		// Create a test table
		await db.schema
			.createTable("products")
			.addColumn("id", "text", (col) => col.primaryKey())
			.addColumn("name", "text", (col) => col.notNull())
			.addColumn("price", "real")
			.addColumn("tags", "text") // JSON array
			.addColumn("profile", "text") // JSON object
			.addColumn("createdAt", "text") // Date as ISO string
			.addColumn("updatedAt", "text") // Date as ISO string
			.execute();
	});

	afterEach(() => {
		sqliteDb.close();
	});

	it("should transform Date objects to ISO strings for SQLite", async () => {
		const testData = {
			id: "test-1",
			name: "Test Product",
			price: 99.99,
			createdAt: new Date("2024-01-01T10:00:00Z"),
			updatedAt: new Date("2024-01-01T11:00:00Z"),
		};

		const result = await adapter.create({
			model: "products",
			data: testData,
		});

		expect(result).toMatchObject({
			id: "test-1",
			name: "Test Product",
			price: 99.99,
		});

		// Verify dates are properly handled
		expect(result.createdAt).toBeInstanceOf(Date);
		expect(result.updatedAt).toBeInstanceOf(Date);
		expect(result.createdAt.toISOString()).toBe("2024-01-01T10:00:00.000Z");
		expect(result.updatedAt.toISOString()).toBe("2024-01-01T11:00:00.000Z");
	});

	it("should transform arrays to JSON strings for SQLite", async () => {
		const testData = {
			id: "test-2",
			name: "Product with Tags",
			price: 49.99,
			tags: ["electronics", "gadgets", "popular"],
		};

		const result = await adapter.create({
			model: "products",
			data: testData,
		});

		expect(result).toMatchObject({
			id: "test-2",
			name: "Product with Tags",
			price: 49.99,
		});

		// Verify array is properly handled
		expect(result).toBeDefined();
		expect(Array.isArray(result && result.tags)).toBe(true);
		expect(result && result.tags).toEqual([
			"electronics",
			"gadgets",
			"popular",
		]);
	});

	it("should transform objects to JSON strings for SQLite", async () => {
		const testData = {
			id: "test-3",
			name: "Product with Profile",
			price: 29.99,
			profile: {
				category: "electronics",
				featured: true,
				metadata: { color: "blue", size: "large" },
			},
		};

		const result = await adapter.create({
			model: "products",
			data: testData,
		});

		expect(result).toMatchObject({
			id: "test-3",
			name: "Product with Profile",
			price: 29.99,
		});

		// Verify object is properly handled
		expect(typeof result.profile).toBe("object");
		expect(result.profile).toEqual({
			category: "electronics",
			featured: true,
			metadata: { color: "blue", size: "large" },
		});
	});

	it("should handle complex data in findFirst", async () => {
		const testData = {
			id: "test-4",
			name: "Complex Product",
			price: 199.99,
			tags: ["premium", "limited"],
			profile: { featured: true, category: "luxury" },
			createdAt: new Date("2024-01-01T12:00:00Z"),
		};

		// Create the record
		await adapter.create({
			model: "products",
			data: testData,
		});

		// Find it back
		const result = await adapter.findFirst({
			model: "products",
			where: [{ field: "id", value: "test-4" }],
		});

		expect(result).toMatchObject({
			id: "test-4",
			name: "Complex Product",
			price: 199.99,
		});

		// Verify complex types are properly transformed back
		expect(Array.isArray(result.tags)).toBe(true);
		expect(result.tags).toEqual(["premium", "limited"]);
		expect(typeof result.profile).toBe("object");
		expect(result.profile).toEqual({ featured: true, category: "luxury" });
		expect(result.createdAt).toBeInstanceOf(Date);
	});

	it("should handle complex data in update operations", async () => {
		// First create a record
		const initialData = {
			id: "test-5",
			name: "Update Test",
			price: 50.0,
			tags: ["initial"],
		};

		await adapter.create({
			model: "products",
			data: initialData,
		});

		// Now update it with complex data
		const updateData = {
			name: "Updated Product",
			tags: ["updated", "new"],
			profile: { category: "updated", featured: false },
		};

		const result = await adapter.update({
			model: "products",
			where: [{ field: "id", value: "test-5" }],
			data: updateData,
		});

		expect(result).toMatchObject({
			id: "test-5",
			name: "Updated Product",
		});

		// Verify complex types are properly handled
		expect(Array.isArray(result.tags)).toBe(true);
		expect(result.tags).toEqual(["updated", "new"]);
		expect(typeof result.profile).toBe("object");
		expect(result.profile).toEqual({ category: "updated", featured: false });
		expect(result.updatedAt).toBeInstanceOf(Date);
	});
});
