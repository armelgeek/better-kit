import { CrudAdapter, CrudWhere, CrudOrderBy } from "../types/adapter";
import { IncludeOptions, FieldAttribute } from "../types";

/**
 * Drizzle ORM adapter for adiemus
 * 
 * Usage:
 * ```typescript
 * import { drizzle } from 'drizzle-orm/better-sqlite3';
 * import Database from 'better-sqlite3';
 * 
 * const sqlite = new Database('sqlite.db');
 * const db = drizzle(sqlite);
 * 
 * const crud = betterCrud({
 *   resources: [...],
 *   database: {
 *     adapter: new DrizzleCrudAdapter(db, schema),
 *   },
 * });
 * ```
 */
export class DrizzleCrudAdapter implements CrudAdapter {
	constructor(
		private db: any, // DrizzleDB type
		private schema: Record<string, any>, // Drizzle schema
	) {}

	async create(params: {
		model: string;
		data: Record<string, any>;
		include?: IncludeOptions;
	}): Promise<any> {
		const { model, data } = params;
		const table = this.schema[model];
		
		if (!table) {
			throw new Error(`Table ${model} not found in schema`);
		}

		// Add timestamps
		const now = new Date();
		if (!data.createdAt) data.createdAt = now;
		if (!data.updatedAt) data.updatedAt = now;

		const [result] = await this.db.insert(table).values(data).returning();
		return result;
	}

	async findFirst(params: {
		model: string;
		where?: CrudWhere[];
		include?: IncludeOptions;
		select?: string[];
	}): Promise<any | null> {
		const { model, where = [] } = params;
		const table = this.schema[model];
		
		if (!table) {
			throw new Error(`Table ${model} not found in schema`);
		}

		let query = this.db.select().from(table);
		
		// Apply where conditions
		for (const condition of where) {
			const column = table[condition.field];
			if (column) {
				query = this.applyWhereCondition(query, column, condition);
			}
		}

		const results = await query.limit(1);
		return results[0] || null;
	}

	async findMany(params: {
		model: string;
		where?: CrudWhere[];
		limit?: number;
		offset?: number;
		orderBy?: CrudOrderBy[];
		include?: IncludeOptions;
		select?: string[];
	}): Promise<any[]> {
		const { model, where = [], limit, offset, orderBy = [] } = params;
		const table = this.schema[model];
		
		if (!table) {
			throw new Error(`Table ${model} not found in schema`);
		}

		let query = this.db.select().from(table);
		
		// Apply where conditions
		for (const condition of where) {
			const column = table[condition.field];
			if (column) {
				query = this.applyWhereCondition(query, column, condition);
			}
		}

		// Apply ordering
		for (const order of orderBy) {
			const column = table[order.field];
			if (column) {
				if (order.direction === "desc") {
					query = query.orderBy(this.db.desc(column));
				} else {
					query = query.orderBy(column);
				}
			}
		}

		// Apply pagination
		if (limit) {
			query = query.limit(limit);
		}
		if (offset) {
			query = query.offset(offset);
		}

		return await query;
	}

	async update(params: {
		model: string;
		where: CrudWhere[];
		data: Record<string, any>;
		include?: IncludeOptions;
	}): Promise<any> {
		const { model, where, data } = params;
		const table = this.schema[model];
		
		if (!table) {
			throw new Error(`Table ${model} not found in schema`);
		}

		// Add updated timestamp
		data.updatedAt = new Date();

		let query = this.db.update(table).set(data);
		
		// Apply where conditions
		for (const condition of where) {
			const column = table[condition.field];
			if (column) {
				query = this.applyUpdateWhereCondition(query, column, condition);
			}
		}

		const [result] = await query.returning();
		return result;
	}

	async delete(params: {
		model: string;
		where: CrudWhere[];
		cascade?: boolean;
	}): Promise<void> {
		const { model, where } = params;
		const table = this.schema[model];
		
		if (!table) {
			throw new Error(`Table ${model} not found in schema`);
		}

		let query = this.db.delete(table);
		
		// Apply where conditions
		for (const condition of where) {
			const column = table[condition.field];
			if (column) {
				query = this.applyDeleteWhereCondition(query, column, condition);
			}
		}

		await query;
	}

	async count(params: {
		model: string;
		where?: CrudWhere[];
	}): Promise<number> {
		const { model, where = [] } = params;
		const table = this.schema[model];
		
		if (!table) {
			throw new Error(`Table ${model} not found in schema`);
		}

		let query = this.db.select({ count: this.db.count() }).from(table);
		
		// Apply where conditions
		for (const condition of where) {
			const column = table[condition.field];
			if (column) {
				query = this.applyWhereCondition(query, column, condition);
			}
		}

		const [result] = await query;
		return result.count;
	}

	async createSchema(data: { model: string; fields: Record<string, FieldAttribute> }[]): Promise<void> {
		// Note: Drizzle schema is typically defined at compile time
		// This method could be used for runtime schema validation or migration
		console.warn("Drizzle schema is typically defined at compile time. Auto-migration not supported.");
	}

	private applyWhereCondition(query: any, column: any, condition: CrudWhere): any {
		const { operator = "eq", value } = condition;
		
		switch (operator) {
			case "eq":
				return query.where(this.db.eq(column, value));
			case "ne":
				return query.where(this.db.ne(column, value));
			case "gt":
				return query.where(this.db.gt(column, value));
			case "gte":
				return query.where(this.db.gte(column, value));
			case "lt":
				return query.where(this.db.lt(column, value));
			case "lte":
				return query.where(this.db.lte(column, value));
			case "like":
				return query.where(this.db.like(column, value));
			case "notLike":
				return query.where(this.db.not(this.db.like(column, value)));
			case "in":
				return query.where(this.db.inArray(column, value));
			case "notIn":
				return query.where(this.db.not(this.db.inArray(column, value)));
			default:
				return query.where(this.db.eq(column, value));
		}
	}

	private applyUpdateWhereCondition(query: any, column: any, condition: CrudWhere): any {
		// Similar to applyWhereCondition but for update queries
		return this.applyWhereCondition(query, column, condition);
	}

	private applyDeleteWhereCondition(query: any, column: any, condition: CrudWhere): any {
		// Similar to applyWhereCondition but for delete queries
		return this.applyWhereCondition(query, column, condition);
	}
}

/**
 * Helper function to create Drizzle adapter with automatic schema inference
 */
export function createDrizzleAdapter(db: any, schema: Record<string, any>): DrizzleCrudAdapter {
	return new DrizzleCrudAdapter(db, schema);
}