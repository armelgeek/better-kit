import { Kysely, sql } from "kysely";
import { CrudAdapter, CrudDatabaseConfig, FieldAttribute } from "../types";

/**
 * Transform data before sending to SQLite database
 * Converts Date objects to ISO strings and complex objects/arrays to JSON strings
 */
function transformFromData(data: Record<string, any>): Record<string, any> {
	const transformed = { ...data };

	for (const key in transformed) {
		const value = transformed[key];

		// Convert Date objects to ISO strings
		if (value instanceof Date) {
			transformed[key] = value.toISOString();
		}
		// Convert arrays to JSON strings
		else if (Array.isArray(value)) {
			transformed[key] = JSON.stringify(value);
		}
		// Convert objects (but not null) to JSON strings
		else if (value !== null && typeof value === "object") {
			transformed[key] = JSON.stringify(value);
		}
	}

	return transformed;
}

/**
 * Transform data after reading from SQLite database
 * Converts ISO strings back to Date objects and JSON strings back to objects/arrays
 */
function transformToData(data: Record<string, any>): Record<string, any> {
	const transformed = { ...data };

	for (const key in transformed) {
		const value = transformed[key];

		// Skip null/undefined values
		if (value === null || value === undefined) {
			continue;
		}

		// Convert ISO date strings back to Date objects for timestamp fields
		if (
			typeof value === "string" &&
			(key === "createdAt" || key === "updatedAt" || key === "publishedAt")
		) {
			const dateValue = new Date(value);
			if (!isNaN(dateValue.getTime())) {
				transformed[key] = dateValue;
			}
		}
		// Try to parse JSON strings back to objects/arrays for known complex fields
		else if (
			typeof value === "string" &&
			(key === "tags" ||
				key === "items" ||
				key === "shippingAddress" ||
				key === "profile")
		) {
			try {
				transformed[key] = JSON.parse(value);
			} catch {
				// If parsing fails, keep as string
			}
		}
	}

	return transformed;
}

export class KyselyCrudAdapter implements CrudAdapter {
	constructor(private db: Kysely<any>) {}

	async create(params: { model: string; data: Record<string, any> }) {
		const { model, data } = params;

		// Add timestamps if they don't exist
		const now = new Date();
		if (!data.createdAt) data.createdAt = now;
		if (!data.updatedAt) data.updatedAt = now;

		// Transform data for SQLite compatibility
		const transformedData = transformFromData(data);

		const result = await this.db
			.insertInto(model)
			.values(transformedData)
			.returningAll()
			.executeTakeFirst();

		// Transform result back to proper types
		return result ? transformToData(result) : result;
	}

	async findFirst(params: {
		model: string;
		where?: Array<{ field: string; value: any; operator?: string }>;
	}) {
		const { model, where = [] } = params;

		let query = this.db.selectFrom(model).selectAll();

		for (const condition of where) {
			const operator = condition.operator || "=";
			query = query.where(condition.field, operator as any, condition.value);
		}

		const result = await query.executeTakeFirst();
		return result ? transformToData(result) : result;
	}

	async findMany(params: {
		model: string;
		where?: Array<{ field: string; value: any; operator?: string }>;
		limit?: number;
		offset?: number;
		orderBy?: Array<{ field: string; direction: "asc" | "desc" }>;
	}) {
		const { model, where = [], limit, offset, orderBy = [] } = params;

		let query = this.db.selectFrom(model).selectAll();

		// Apply where conditions
		for (const condition of where) {
			const operator = condition.operator || "=";
			query = query.where(condition.field, operator as any, condition.value);
		}

		// Apply ordering
		for (const order of orderBy) {
			query = query.orderBy(order.field, order.direction);
		}

		// Apply pagination
		if (limit) {
			query = query.limit(limit);
		}
		if (offset) {
			query = query.offset(offset);
		}

		return (await query.execute()).map((item) => transformToData(item));
	}

	async update(params: {
		model: string;
		where: Array<{ field: string; value: any; operator?: string }>;
		data: Record<string, any>;
	}) {
		const { model, where, data } = params;

		// Add updated timestamp
		data.updatedAt = new Date();

		// Transform data for SQLite compatibility
		const transformedData = transformFromData(data);

		let query = this.db.updateTable(model).set(transformedData);

		for (const condition of where) {
			const operator = condition.operator || "=";
			query = query.where(condition.field, operator as any, condition.value);
		}

		const result = await query.returningAll().executeTakeFirst();
		return result ? transformToData(result) : result;
	}

	async delete(params: {
		model: string;
		where: Array<{ field: string; value: any; operator?: string }>;
	}) {
		const { model, where } = params;

		let query = this.db.deleteFrom(model);

		for (const condition of where) {
			const operator = condition.operator || "=";
			query = query.where(condition.field, operator as any, condition.value);
		}

		await query.execute();
	}

	async count(params: {
		model: string;
		where?: Array<{ field: string; value: any; operator?: string }>;
	}) {
		const { model, where = [] } = params;

		let query = this.db.selectFrom(model).select(sql`count(*)`.as("count"));

		for (const condition of where) {
			const operator = condition.operator || "=";
			query = query.where(condition.field, operator as any, condition.value);
		}

		const result = await query.executeTakeFirst();
		return Number(result?.count || 0);
	}
}

/**
 * Creates a Kysely database instance based on the configuration
 */
export function createKyselyDatabase(config: CrudDatabaseConfig): Kysely<any> {
	// This is a simplified implementation
	// In a real scenario, you'd handle different database providers
	if (config.provider === "sqlite") {
		try {
			// For SQLite with better-sqlite3
			const Database = require("better-sqlite3");
			const { Kysely, SqliteDialect } = require("kysely");

			return new Kysely({
				dialect: new SqliteDialect({
					database: new Database(config.url.replace("sqlite:", "")),
				}),
			});
		} catch (error) {
			throw new Error(
				"better-sqlite3 is required for SQLite support. Please install it: npm install better-sqlite3",
			);
		}
	} else if (config.provider === "postgres") {
		try {
			// For PostgreSQL
			const { Pool } = require("pg");
			const { Kysely, PostgresDialect } = require("kysely");

			return new Kysely({
				dialect: new PostgresDialect({
					pool: new Pool({
						connectionString: config.url,
					}),
				}),
			});
		} catch (error) {
			throw new Error(
				"pg is required for PostgreSQL support. Please install it: npm install pg @types/pg",
			);
		}
	} else if (config.provider === "mysql") {
		try {
			// For MySQL
			const { createPool } = require("mysql2");
			const { Kysely, MysqlDialect } = require("kysely");

			return new Kysely({
				dialect: new MysqlDialect({
					pool: createPool(config.url),
				}),
			});
		} catch (error) {
			throw new Error(
				"mysql2 is required for MySQL support. Please install it: npm install mysql2",
			);
		}
	}

	throw new Error(`Unsupported database provider: ${config.provider}`);
}

/**
 * Generate CREATE TABLE SQL for a resource
 */
export function generateCreateTableSQL(
	tableName: string,
	fields: Record<string, FieldAttribute>,
	provider: string = "sqlite",
): string {
	const columns: string[] = [];

	// Always add ID column if not present
	if (!fields.id) {
		if (provider === "postgres") {
			columns.push("id VARCHAR(255) PRIMARY KEY");
		} else {
			columns.push("id TEXT PRIMARY KEY");
		}
	}

	for (const [fieldName, field] of Object.entries(fields)) {
		let columnDef = fieldName;

		// Handle data types
		if (provider === "postgres") {
			switch (field.type) {
				case "string":
					columnDef += field.length ? ` VARCHAR(${field.length})` : " TEXT";
					break;
				case "number":
					columnDef += " NUMERIC";
					break;
				case "boolean":
					columnDef += " BOOLEAN";
					break;
				case "date":
					columnDef += " TIMESTAMP";
					break;
				case "json":
					columnDef += " JSONB";
					break;
			}
		} else {
			// SQLite/MySQL
			switch (field.type) {
				case "string":
					columnDef += " TEXT";
					break;
				case "number":
					columnDef += " REAL";
					break;
				case "boolean":
					columnDef += " INTEGER";
					break;
				case "date":
					columnDef += " TEXT";
					break;
				case "json":
					columnDef += " TEXT";
					break;
			}
		}

		// Add PRIMARY KEY for id field
		if (fieldName === "id") {
			columnDef += " PRIMARY KEY";
		}

		// Handle constraints
		if (field.required && !field.default) {
			columnDef += " NOT NULL";
		}

		if (field.unique) {
			columnDef += " UNIQUE";
		}

		if (field.default !== undefined) {
			// Handle different default value types
			if (typeof field.default === "string") {
				columnDef += ` DEFAULT '${field.default}'`;
			} else if (typeof field.default === "number") {
				columnDef += ` DEFAULT ${field.default}`;
			} else if (typeof field.default === "boolean") {
				columnDef += ` DEFAULT ${field.default ? 1 : 0}`; // SQLite boolean representation
			} else if (field.default instanceof Date) {
				// For date defaults, use CURRENT_TIMESTAMP instead of the actual date string
				columnDef += " DEFAULT CURRENT_TIMESTAMP";
			} else if (Array.isArray(field.default)) {
				// For array defaults (like tags), serialize to JSON string
				columnDef += ` DEFAULT '${JSON.stringify(field.default)}'`;
			} else {
				// For other objects, serialize to JSON
				columnDef += ` DEFAULT '${JSON.stringify(field.default)}'`;
			}
		}

		columns.push(columnDef);
	}

	// Add standard timestamps if not present
	if (!fields.createdAt) {
		if (provider === "postgres") {
			columns.push("created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
		} else {
			columns.push("created_at TEXT DEFAULT CURRENT_TIMESTAMP");
		}
	}

	if (!fields.updatedAt) {
		if (provider === "postgres") {
			columns.push("updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
		} else {
			columns.push("updated_at TEXT DEFAULT CURRENT_TIMESTAMP");
		}
	}

	return `CREATE TABLE IF NOT EXISTS ${tableName} (\n  ${columns.join(
		",\n  ",
	)}\n)`;
}
