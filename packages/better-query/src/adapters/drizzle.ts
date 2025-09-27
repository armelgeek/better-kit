import { CrudAdapter, CrudWhere, CrudOrderBy, CustomOperations } from "../types/adapter";
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
	public customOperations: CustomOperations = {};

	constructor(
		private db: any, // DrizzleDB type
		private schema: Record<string, any>, // Drizzle schema
	) {
		this.initializeCustomOperations();
	}

	private initializeCustomOperations() {
		// Drizzle-specific custom operations
		this.customOperations = {
			// Raw SQL query execution
			rawQuery: async (params: { sql: string; values?: any[] }) => {
				const { sql, values = [] } = params;
				return await this.db.execute(sql, values);
			},

			// Batch operations for better performance
			batchInsert: async (params: { model: string; data: Record<string, any>[] }) => {
				const { model, data } = params;
				const table = this.schema[model];
				if (!table) {
					throw new Error(`Table ${model} not found in schema`);
				}
				
				// Add timestamps to all records
				const now = new Date();
				const dataWithTimestamps = data.map(item => ({
					...item,
					createdAt: item.createdAt || now,
					updatedAt: item.updatedAt || now,
				}));
				
				return await this.db.insert(table).values(dataWithTimestamps).returning();
			},

			// Upsert operation (insert or update on conflict)
			upsert: async (params: { 
				model: string; 
				data: Record<string, any>; 
				conflictColumns: string[];
				updateColumns?: string[] 
			}) => {
				const { model, data, conflictColumns, updateColumns } = params;
				const table = this.schema[model];
				if (!table) {
					throw new Error(`Table ${model} not found in schema`);
				}

				const now = new Date();
				data.updatedAt = now;
				if (!data.createdAt) data.createdAt = now;

				let query = this.db.insert(table).values(data);
				
				// Handle conflict resolution
				const conflictCols = conflictColumns.map(col => table[col]).filter(Boolean);
				if (conflictCols.length > 0) {
					const updateData: Record<string, any> = {};
					const columnsToUpdate = updateColumns || Object.keys(data).filter(key => !conflictColumns.includes(key));
					
					for (const col of columnsToUpdate) {
						if (table[col]) {
							updateData[col] = data[col];
						}
					}
					updateData.updatedAt = now;

					query = query.onConflictDoUpdate({
						target: conflictCols,
						set: updateData,
					});
				}
				
				return await query.returning();
			},

			// Advanced aggregations
			aggregate: async (params: {
				model: string;
				aggregations: { field: string; operation: 'sum' | 'avg' | 'min' | 'max' | 'count' }[];
				where?: CrudWhere[];
				groupBy?: string[];
			}) => {
				const { model, aggregations, where = [], groupBy = [] } = params;
				const table = this.schema[model];
				if (!table) {
					throw new Error(`Table ${model} not found in schema`);
				}

				const selectObj: Record<string, any> = {};
				
				// Build aggregation select
				for (const agg of aggregations) {
					const column = table[agg.field];
					if (column) {
						switch (agg.operation) {
							case 'sum':
								selectObj[`${agg.field}_sum`] = this.db.sum(column);
								break;
							case 'avg':
								selectObj[`${agg.field}_avg`] = this.db.avg(column);
								break;
							case 'min':
								selectObj[`${agg.field}_min`] = this.db.min(column);
								break;
							case 'max':
								selectObj[`${agg.field}_max`] = this.db.max(column);
								break;
							case 'count':
								selectObj[`${agg.field}_count`] = this.db.count(column);
								break;
						}
					}
				}

				let query = this.db.select(selectObj).from(table);
				
				// Apply where conditions
				for (const condition of where) {
					const column = table[condition.field];
					if (column) {
						query = this.applyWhereCondition(query, column, condition);
					}
				}

				// Apply group by
				if (groupBy.length > 0) {
					const groupColumns = groupBy.map(field => table[field]).filter(Boolean);
					if (groupColumns.length > 0) {
						query = query.groupBy(...groupColumns);
					}
				}

				return await query;
			},

			// Complex joins with custom logic
			customJoin: async (params: {
				baseModel: string;
				joins: Array<{
					model: string;
					type: 'inner' | 'left' | 'right';
					on: { left: string; right: string };
				}>;
				select?: Record<string, string[]>;
				where?: Record<string, CrudWhere[]>;
			}) => {
				const { baseModel, joins, select, where } = params;
				const baseTable = this.schema[baseModel];
				if (!baseTable) {
					throw new Error(`Base table ${baseModel} not found in schema`);
				}

				// Build select clause
				let selectObj: Record<string, any> = {};
				if (select) {
					for (const [model, fields] of Object.entries(select)) {
						const table = this.schema[model];
						if (table) {
							for (const field of fields) {
								if (table[field]) {
									selectObj[`${model}_${field}`] = table[field];
								}
							}
						}
					}
				} else {
					// Select all from base table if no specific selection
					selectObj = baseTable;
				}

				let query = this.db.select(selectObj).from(baseTable);

				// Apply joins
				for (const join of joins) {
					const joinTable = this.schema[join.model];
					if (!joinTable) continue;

					const leftCol = baseTable[join.on.left];
					const rightCol = joinTable[join.on.right];
					
					if (leftCol && rightCol) {
						switch (join.type) {
							case 'inner':
								query = query.innerJoin(joinTable, this.db.eq(leftCol, rightCol));
								break;
							case 'left':
								query = query.leftJoin(joinTable, this.db.eq(leftCol, rightCol));
								break;
							case 'right':
								query = query.rightJoin(joinTable, this.db.eq(leftCol, rightCol));
								break;
						}
					}
				}

				// Apply where conditions per model
				if (where) {
					for (const [model, conditions] of Object.entries(where)) {
						const table = this.schema[model];
						if (table) {
							for (const condition of conditions) {
								const column = table[condition.field];
								if (column) {
									query = this.applyWhereCondition(query, column, condition);
								}
							}
						}
					}
				}

				return await query;
			},
		};
	}

	async executeCustomOperation(operationName: string, params: any, context?: any): Promise<any> {
		const operation = this.customOperations[operationName];
		if (!operation) {
			throw new Error(`Custom operation '${operationName}' not found in DrizzleCrudAdapter`);
		}
		return await operation(params, context);
	}

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