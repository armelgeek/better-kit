import { Kysely, sql } from "kysely";
import { CrudAdapter, CrudAdapterConfig, CrudWhere, CrudOrderBy } from "../types/adapter";
import { FieldAttribute, IncludeOptions } from "../types";
import { RelationshipManager } from "../utils/relationships";

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
	private relationshipManager?: RelationshipManager;
	public config?: {
		provider: "sqlite" | "postgres" | "mysql" | "custom";
		transform?: {
			date?: boolean;
			boolean?: boolean;
		};
	};

	constructor(private db: Kysely<any>) {}

	setRelationshipManager(manager: RelationshipManager) {
		this.relationshipManager = manager;
	}

	async create(params: { model: string; data: Record<string, any>; include?: IncludeOptions }) {
		const { model, data, include } = params;

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

		if (!result) return result;

		// Transform result back to proper types
		const transformedResult = transformToData(result);

		// Include related data if requested
		if (include && this.relationshipManager) {
			return await this.includeRelatedData(model, transformedResult, include);
		}

		return transformedResult;
	}

	async findFirst(params: {
		model: string;
		where?: CrudWhere[];
		include?: IncludeOptions;
		select?: string[];
	}) {
		const { model, where = [], include, select } = params;

		// If no includes, use simple query
		if (!include || !this.relationshipManager) {
			let query = this.db.selectFrom(model).selectAll();

			for (const condition of where) {
				const operator = condition.operator || "=";
				query = query.where(condition.field, operator as any, condition.value);
			}

			const result = await query.executeTakeFirst();
			return result ? transformToData(result) : result;
		}

		// Use relationship-aware query
		return await this.findWithRelations(model, { where, include, limit: 1 });
	}

	async findMany(params: {
		model: string;
		where?: CrudWhere[];
		limit?: number;
		offset?: number;
		orderBy?: CrudOrderBy[];
		include?: IncludeOptions;
		select?: string[];
	}) {
		const { model, where = [], limit, offset, orderBy = [], include, select } = params;

		// If no includes, use simple query
		if (!include || !this.relationshipManager) {
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

		// Use relationship-aware query
		return await this.findWithRelations(model, { where, limit, offset, orderBy, include });
	}

	async update(params: {
		model: string;
		where: CrudWhere[];
		data: Record<string, any>;
		include?: IncludeOptions;
	}) {
		const { model, where, data, include } = params;

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
		
		if (!result) return result;

		// Transform result back to proper types
		const transformedResult = transformToData(result);

		// Include related data if requested
		if (include && this.relationshipManager) {
			return await this.includeRelatedData(model, transformedResult, include);
		}

		return transformedResult;
	}

	async delete(params: {
		model: string;
		where: CrudWhere[];
		cascade?: boolean;
	}) {
		const { model, where, cascade = false } = params;

		// TODO: Implement cascade delete logic
		if (cascade && this.relationshipManager) {
			await this.handleCascadeDelete(model, where);
		}

		let query = this.db.deleteFrom(model);

		for (const condition of where) {
			const operator = condition.operator || "=";
			query = query.where(condition.field, operator as any, condition.value);
		}

		await query.execute();
	}

	async count(params: {
		model: string;
		where?: CrudWhere[];
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

	async createWithRelations(params: {
		model: string;
		data: Record<string, any>;
		relations?: Record<string, any>;
		include?: IncludeOptions;
	}): Promise<any> {
		const { model, data, relations, include } = params;

		// Start transaction
		return await this.db.transaction().execute(async (trx) => {
			// Create main record
			const adapter = new KyselyCrudAdapter(trx);
			adapter.setRelationshipManager(this.relationshipManager!);
			
			const mainRecord = await adapter.create({ model, data });

			// Create related records if any
			if (relations && this.relationshipManager) {
				await this.handleRelationCreation(mainRecord, relations, model, trx);
			}

			// Return with includes if requested
			if (include) {
				return await adapter.includeRelatedData(model, mainRecord, include);
			}

			return mainRecord;
		});
	}

	async updateWithRelations(params: {
		model: string;
		where: CrudWhere[];
		data: Record<string, any>;
		relations?: Record<string, any>;
		include?: IncludeOptions;
	}): Promise<any> {
		const { model, where, data, relations, include } = params;

		// Start transaction
		return await this.db.transaction().execute(async (trx) => {
			// Update main record
			const adapter = new KyselyCrudAdapter(trx);
			adapter.setRelationshipManager(this.relationshipManager!);
			
			const mainRecord = await adapter.update({ model, where, data });

			// Update related records if any
			if (relations && this.relationshipManager) {
				await this.handleRelationUpdate(mainRecord, relations, model, trx);
			}

			// Return with includes if requested
			if (include) {
				return await adapter.includeRelatedData(model, mainRecord, include);
			}

			return mainRecord;
		});
	}

	async validateReferences(params: {
		model: string;
		data: Record<string, any>;
		operation: "create" | "update" | "delete";
	}): Promise<{ valid: boolean; errors: string[] }> {
		const { model, data, operation } = params;
		const errors: string[] = [];

		if (!this.relationshipManager) {
			return { valid: true, errors };
		}

		// TODO: Implement comprehensive referential integrity validation
		// This would check foreign key references exist, prevent deletion of referenced records, etc.

		return { valid: errors.length === 0, errors };
	}

	async createSchema(data: { model: string; fields: Record<string, FieldAttribute> }[]): Promise<void> {
		try {
			for (const { model, fields } of data) {
				// Get provider from config or default to sqlite
				const provider = this.config?.provider || "sqlite";
				
				// Generate and execute CREATE TABLE SQL
				const createTableSQL = generateCreateTableSQL(model, fields, provider);
				
				// Execute the SQL using Kysely's sql template literal
				await sql`${sql.raw(createTableSQL)}`.execute(this.db);
			}
		} catch (error) {
			console.error("Error creating schema:", error);
			throw error;
		}
	}

	private async findWithRelations(
		model: string,
		params: {
			where?: CrudWhere[];
			limit?: number;
			offset?: number;
			orderBy?: CrudOrderBy[];
			include: IncludeOptions;
		}
	): Promise<any[]> {
		if (!this.relationshipManager) return [];

		const { where = [], limit, offset, orderBy = [], include } = params;
		
		// Resolve includes
		const resolvedIncludes = this.relationshipManager.resolveIncludes(model, include);
		
		if (resolvedIncludes.length === 0) {
			// Fall back to simple query
			return await this.findMany({ model, where, limit, offset, orderBy });
		}

		// Generate joins
		const joins = this.relationshipManager.generateJoins(model, resolvedIncludes, "main");
		
		// Build complex query with joins
		let query = this.db.selectFrom(`${model} as main`);
		
		// Select main table fields explicitly
		const mainSchema = this.relationshipManager.relationshipContext.schemas.get(model);
		if (mainSchema) {
			for (const fieldName of Object.keys(mainSchema.fields)) {
				query = query.select(`main.${fieldName} as ${fieldName}`);
			}
		}
		
		// Add join selects
		for (const include of resolvedIncludes) {
			const alias = `main_${include.relationName}`;
			const targetSchema = this.relationshipManager.relationshipContext.schemas.get(include.relation.target);
			if (targetSchema) {
				for (const fieldName of Object.keys(targetSchema.fields)) {
					query = query.select(`${alias}.${fieldName} as ${alias}_${fieldName}`);
				}
			}
		}

		// Apply joins
		for (const join of joins) {
			query = query.leftJoin(
				`${join.table} as ${join.alias}`,
				(builder) => {
					const parts = join.condition.split(" = ");
					const left = parts[0]?.trim();
					const right = parts[1]?.trim();
					if (left && right) {
						return builder.onRef(left, "=", right);
					}
					return builder;
				}
			);
		}

		// Apply where conditions
		for (const condition of where) {
			const operator = condition.operator || "=";
			query = query.where(`main.${condition.field}`, operator as any, condition.value);
		}

		// Apply ordering
		for (const order of orderBy) {
			query = query.orderBy(`main.${order.field}`, order.direction);
		}

		// Apply pagination
		if (limit) {
			query = query.limit(limit);
		}
		if (offset) {
			query = query.offset(offset);
		}

		const results = await query.execute();

		// Transform flat results into nested structure
		const transformedResults = results.map(transformToData);
		const nestedResults = this.relationshipManager.transformJoinedResults(
			transformedResults,
			resolvedIncludes,
			model
		);

		return limit === 1 ? [nestedResults[0]].filter(Boolean) : nestedResults;
	}

	private async includeRelatedData(
		model: string,
		record: any,
		include: IncludeOptions
	): Promise<any> {
		if (!this.relationshipManager) return record;

		const resolvedIncludes = this.relationshipManager.resolveIncludes(model, include);
		
		for (const resolvedInclude of resolvedIncludes) {
			const { relationName, relation } = resolvedInclude;
			
			// Load related data based on relationship type
			switch (relation.type) {
				case "belongsTo":
					if (record[relation.foreignKey || `${relation.target}Id`]) {
						const related = await this.findFirst({
							model: relation.target,
							where: [{ field: "id", value: record[relation.foreignKey || `${relation.target}Id`] }],
						});
						record[relationName] = related;
					}
					break;
				case "hasOne":
					const relatedOne = await this.findFirst({
						model: relation.target,
						where: [{ field: relation.foreignKey || `${model}Id`, value: record.id }],
					});
					record[relationName] = relatedOne;
					break;
				case "hasMany":
					const relatedMany = await this.findMany({
						model: relation.target,
						where: [{ field: relation.foreignKey || `${model}Id`, value: record.id }],
					});
					record[relationName] = relatedMany;
					break;
				case "belongsToMany":
					// TODO: Implement many-to-many relationship loading
					record[relationName] = [];
					break;
			}
		}

		return record;
	}

	private async handleCascadeDelete(
		model: string,
		where: CrudWhere[]
	): Promise<void> {
		// TODO: Implement cascade delete logic
		// This would find all related records that should be deleted
		// and delete them recursively
	}

	private async handleRelationCreation(
		mainRecord: any,
		relations: Record<string, any>,
		model: string,
		trx: Kysely<any>
	): Promise<void> {
		// TODO: Implement relation creation logic
		// This would create related records and update foreign keys
	}

	private async handleRelationUpdate(
		mainRecord: any,
		relations: Record<string, any>,
		model: string,
		trx: Kysely<any>
	): Promise<void> {
		// TODO: Implement relation update logic
		// This would update/create/delete related records as needed
	}
}

/**
 * Creates a Kysely database instance based on the configuration
 */
export function createKyselyDatabase(config: { provider: string; url: string; autoMigrate?: boolean }): Kysely<any> {
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
	const foreignKeys: string[] = [];

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

		// Handle foreign key references
		if (field.references) {
			if (provider === "postgres") {
				foreignKeys.push(
					`FOREIGN KEY (${fieldName}) REFERENCES ${field.references.model}(${field.references.field}) ON DELETE ${field.references.onDelete?.toUpperCase() || "CASCADE"}`
				);
			} else {
				// For SQLite, add foreign key constraint separately
				foreignKeys.push(
					`FOREIGN KEY (${fieldName}) REFERENCES ${field.references.model}(${field.references.field}) ON DELETE ${field.references.onDelete?.toUpperCase() || "CASCADE"}`
				);
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

	// Combine columns and foreign keys
	const allConstraints = [...columns, ...foreignKeys];

	return `CREATE TABLE IF NOT EXISTS ${tableName} (\n  ${allConstraints.join(
		",\n  ",
	)}\n)`;
}

/**
 * Creates a Kysely adapter instance (for use with provider config)
 */
export function createKyselyAdapter(options: { database: { provider: string; url: string; autoMigrate?: boolean } }): Kysely<any> | null {
	if (!("provider" in options.database)) {
		return null;
	}
	
	return createKyselyDatabase(options.database as any);
}

/**
 * Creates a CRUD adapter using Kysely - follows better-auth pattern
 */
export function kyselyCrudAdapter(
	db: Kysely<any>,
	config?: CrudAdapterConfig,
): CrudAdapter {
	const adapter = new KyselyCrudAdapter(db);
	
	// Set configuration
	if (config) {
		adapter.config = {
			provider: config.provider,
			transform: config.transform || {
				date: true,
				boolean: config.provider === "sqlite",
			},
		};
	}
	
	return adapter;
}
