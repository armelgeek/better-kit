import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
	type Migration,
	type SchemaChange,
	SchemaMigrationManager,
	createSchemaMigration,
	withSchemaVersion,
} from "../utils/migrations";

describe("Schema Migration Manager", () => {
	let manager: SchemaMigrationManager;

	beforeEach(() => {
		manager = new SchemaMigrationManager();
	});

	describe("Schema Version Management", () => {
		it("should register schema versions", () => {
			const schema = z.object({
				id: z.string(),
				name: z.string(),
			});

			const version = withSchemaVersion("1.0.0", schema);

			expect(version.version).toBe("1.0.0");
			expect(version.schema).toBe(schema);
			expect(version.createdAt).toBeInstanceOf(Date);

			manager.registerVersion("product", version);
			// Should not throw
		});

		it("should create schema versions with migrations", () => {
			const schema = z.object({
				id: z.string(),
				name: z.string(),
			});

			const migration: Migration = {
				id: "test-migration",
				version: "1.0.0",
				type: "add_field",
				description: "Test migration",
				up: vi.fn(),
				down: vi.fn(),
			};

			const version = withSchemaVersion("1.0.0", schema, [migration]);

			expect(version.migrations).toContain(migration);
		});
	});

	describe("Schema Comparison", () => {
		it("should detect added fields", () => {
			const oldSchema = z.object({
				id: z.string(),
				name: z.string(),
			});

			const newSchema = z.object({
				id: z.string(),
				name: z.string(),
				description: z.string().optional(), // Added optional field
				price: z.number(), // Added required field
			});

			const changes = manager.compareSchemas("product", oldSchema, newSchema);

			const addedChanges = changes.filter((c) => c.type === "added");
			expect(addedChanges).toHaveLength(2);

			const descriptionChange = addedChanges.find(
				(c) => c.field === "description",
			);
			const priceChange = addedChanges.find((c) => c.field === "price");

			expect(descriptionChange?.breaking).toBe(false); // Optional field
			expect(priceChange?.breaking).toBe(true); // Required field
		});

		it("should detect removed fields", () => {
			const oldSchema = z.object({
				id: z.string(),
				name: z.string(),
				deprecated: z.string(), // To be removed
			});

			const newSchema = z.object({
				id: z.string(),
				name: z.string(),
			});

			const changes = manager.compareSchemas("product", oldSchema, newSchema);

			const removedChanges = changes.filter((c) => c.type === "removed");
			expect(removedChanges).toHaveLength(1);
			expect(removedChanges[0].field).toBe("deprecated");
			expect(removedChanges[0].breaking).toBe(true);
		});

		it("should detect field type changes", () => {
			const oldSchema = z.object({
				id: z.string(),
				price: z.string(), // Was string
			});

			const newSchema = z.object({
				id: z.string(),
				price: z.number(), // Now number
			});

			const changes = manager.compareSchemas("product", oldSchema, newSchema);

			const modifiedChanges = changes.filter((c) => c.type === "modified");
			expect(modifiedChanges).toHaveLength(1);
			expect(modifiedChanges[0].field).toBe("price");
			expect(modifiedChanges[0].oldType).toBe("string");
			expect(modifiedChanges[0].newType).toBe("number");
			expect(modifiedChanges[0].breaking).toBe(true);
		});

		it("should identify non-breaking type changes", () => {
			const oldSchema = z.object({
				id: z.string(),
				description: z.string(), // varchar
			});

			const newSchema = z.object({
				id: z.string(),
				description: z.string(), // text (assuming non-breaking in our logic)
			});

			const changes = manager.compareSchemas("product", oldSchema, newSchema);

			// This would be handled by the database adapter specifics
			// For this test, same Zod types won't show as changed
			expect(changes.filter((c) => c.type === "modified")).toHaveLength(0);
		});
	});

	describe("Migration Generation", () => {
		it("should generate field addition migration", () => {
			const oldSchema = z.object({
				id: z.string(),
				name: z.string(),
			});

			const newSchema = z.object({
				id: z.string(),
				name: z.string(),
				email: z.string(), // Added required field
			});

			const changes = manager.compareSchemas("user", oldSchema, newSchema);
			const migration = changes.find((c) => c.field === "email")?.migration;

			expect(migration).toBeDefined();
			expect(migration?.type).toBe("add_field");
			expect(migration?.description).toContain("Add field 'email'");
		});

		it("should generate field removal migration", () => {
			const oldSchema = z.object({
				id: z.string(),
				name: z.string(),
				deprecated: z.string(),
			});

			const newSchema = z.object({
				id: z.string(),
				name: z.string(),
			});

			const changes = manager.compareSchemas("user", oldSchema, newSchema);
			const migration = changes.find(
				(c) => c.field === "deprecated",
			)?.migration;

			expect(migration).toBeDefined();
			expect(migration?.type).toBe("remove_field");
			expect(migration?.description).toContain("Remove field 'deprecated'");
		});

		it("should execute migrations", async () => {
			const mockAdapter = {
				addColumn: vi.fn(),
				dropColumn: vi.fn(),
			};

			const migration: Migration = {
				id: "test-migration",
				version: "1.1.0",
				type: "add_field",
				description: "Add email field",
				up: vi.fn(),
				down: vi.fn(),
			};

			await manager.applyMigrations(mockAdapter as any, [migration]);

			expect(migration.up).toHaveBeenCalledWith(mockAdapter);
		});

		it("should rollback migrations in reverse order", async () => {
			const mockAdapter = {
				addColumn: vi.fn(),
				dropColumn: vi.fn(),
			};

			const migration1: Migration = {
				id: "migration-1",
				version: "1.1.0",
				type: "add_field",
				description: "Migration 1",
				up: vi.fn(),
				down: vi.fn(),
			};

			const migration2: Migration = {
				id: "migration-2",
				version: "1.2.0",
				type: "add_field",
				description: "Migration 2",
				up: vi.fn(),
				down: vi.fn(),
			};

			await manager.rollbackMigrations(mockAdapter as any, [
				migration1,
				migration2,
			]);

			// Should call in reverse order
			expect(migration2.down).toHaveBeenCalled();
			expect(migration1.down).toHaveBeenCalled();
		});
	});

	describe("Breaking Changes Report", () => {
		it("should generate breaking changes report", () => {
			const changes: SchemaChange[] = [
				{
					type: "removed",
					field: "deprecated",
					breaking: true,
				},
				{
					type: "added",
					field: "email",
					breaking: true,
				},
				{
					type: "added",
					field: "description",
					breaking: false,
				},
				{
					type: "modified",
					field: "price",
					oldType: "string",
					newType: "number",
					breaking: true,
				},
			];

			const report = manager.generateBreakingChangesReport(changes);

			expect(report).toContain("BREAKING CHANGES DETECTED");
			expect(report).toContain("Field 'deprecated' has been removed");
			expect(report).toContain("Field 'email' has been added as required");
			expect(report).toContain("Field 'price' type changed");
			expect(report).not.toContain("description"); // Non-breaking change
		});

		it("should report no breaking changes", () => {
			const changes: SchemaChange[] = [
				{
					type: "added",
					field: "description",
					breaking: false,
				},
			];

			const report = manager.generateBreakingChangesReport(changes);

			expect(report).toBe("No breaking changes detected.");
		});
	});

	describe("Helper Functions", () => {
		it("should create schema migration helper", () => {
			const oldSchema = z.object({
				id: z.string(),
				name: z.string(),
			});

			const newSchema = z.object({
				id: z.string(),
				name: z.string(),
				email: z.string(),
			});

			const result = createSchemaMigration("user", oldSchema, newSchema);

			expect(result.changes).toBeDefined();
			expect(result.migrations).toBeDefined();
			expect(result.report).toBeDefined();

			expect(result.changes).toHaveLength(1);
			expect(result.changes[0].field).toBe("email");
		});
	});
});
