import { CrudAdapter, CrudWhere, CrudOrderBy, CustomOperations } from "../types/adapter";
import { IncludeOptions, FieldAttribute } from "../types";

/**
 * Prisma ORM adapter for adiemus
 * 
 * Usage:
 * ```typescript
 * import { PrismaClient } from '@prisma/client';
 * 
 * const prisma = new PrismaClient();
 * 
 * const crud = betterCrud({
 *   resources: [...],
 *   database: {
 *     adapter: new PrismaCrudAdapter(prisma),
 *   },
 * });
 * ```
 */
export class PrismaCrudAdapter implements CrudAdapter {
	public customOperations: CustomOperations = {};

	constructor(private prisma: any) { // PrismaClient type
		this.initializeCustomOperations();
	}

	private initializeCustomOperations() {
		// Prisma-specific custom operations
		this.customOperations = {
			// Raw SQL queries
			rawQuery: async (params: { sql: string; values?: any[] }) => {
				const { sql, values = [] } = params;
				return await this.prisma.$queryRaw`${sql}`;
			},

			// Raw query with interpolated values
			rawQueryUnsafe: async (params: { sql: string; values?: any[] }) => {
				const { sql, values = [] } = params;
				return await this.prisma.$queryRawUnsafe(sql, ...values);
			},

			// Execute raw SQL commands (non-query operations)
			executeRaw: async (params: { sql: string; values?: any[] }) => {
				const { sql, values = [] } = params;
				return await this.prisma.$executeRawUnsafe(sql, ...values);
			},

			// Transaction with custom logic
			transaction: async (params: { operations: Array<{ model: string; operation: string; data: any }> }) => {
				const { operations } = params;
				
				return await this.prisma.$transaction(async (tx: any) => {
					const results = [];
					
					for (const op of operations) {
						const { model, operation, data } = op;
						
						switch (operation) {
							case 'create':
								results.push(await tx[model].create({ data }));
								break;
							case 'update':
								results.push(await tx[model].update(data));
								break;
							case 'delete':
								results.push(await tx[model].delete(data));
								break;
							case 'upsert':
								results.push(await tx[model].upsert(data));
								break;
							default:
								throw new Error(`Unsupported operation: ${operation}`);
						}
					}
					
					return results;
				});
			},

			// Batch operations
			createMany: async (params: { model: string; data: Record<string, any>[]; skipDuplicates?: boolean }) => {
				const { model, data, skipDuplicates = false } = params;
				
				// Add timestamps to all records
				const now = new Date();
				const dataWithTimestamps = data.map(item => ({
					...item,
					createdAt: item.createdAt || now,
					updatedAt: item.updatedAt || now,
				}));
				
				return await this.prisma[model].createMany({
					data: dataWithTimestamps,
					skipDuplicates,
				});
			},

			// Update many with conditions
			updateMany: async (params: { 
				model: string; 
				where: Record<string, any>; 
				data: Record<string, any> 
			}) => {
				const { model, where, data } = params;
				data.updatedAt = new Date();
				
				return await this.prisma[model].updateMany({
					where,
					data,
				});
			},

			// Delete many with conditions
			deleteMany: async (params: { model: string; where: Record<string, any> }) => {
				const { model, where } = params;
				return await this.prisma[model].deleteMany({ where });
			},

			// Upsert operation
			upsert: async (params: {
				model: string;
				where: Record<string, any>;
				update: Record<string, any>;
				create: Record<string, any>;
				include?: Record<string, any>;
			}) => {
				const { model, where, update, create, include } = params;
				
				// Add timestamps
				const now = new Date();
				update.updatedAt = now;
				if (!create.createdAt) create.createdAt = now;
				if (!create.updatedAt) create.updatedAt = now;
				
				return await this.prisma[model].upsert({
					where,
					update,
					create,
					include: include || undefined,
				});
			},

			// Advanced aggregations
			aggregate: async (params: {
				model: string;
				where?: Record<string, any>;
				_count?: boolean | Record<string, boolean>;
				_sum?: Record<string, boolean>;
				_avg?: Record<string, boolean>;
				_min?: Record<string, boolean>;
				_max?: Record<string, boolean>;
				orderBy?: Record<string, 'asc' | 'desc'>[];
				take?: number;
				skip?: number;
			}) => {
				const { model, ...aggregationParams } = params;
				return await this.prisma[model].aggregate(aggregationParams);
			},

			// Group by operations
			groupBy: async (params: {
				model: string;
				by: string[];
				where?: Record<string, any>;
				having?: Record<string, any>;
				_count?: boolean | Record<string, boolean>;
				_sum?: Record<string, boolean>;
				_avg?: Record<string, boolean>;
				_min?: Record<string, boolean>;
				_max?: Record<string, boolean>;
				orderBy?: Record<string, 'asc' | 'desc'>[];
				take?: number;
				skip?: number;
			}) => {
				const { model, ...groupByParams } = params;
				return await this.prisma[model].groupBy(groupByParams);
			},

			// Find with cursor-based pagination
			findManyWithCursor: async (params: {
				model: string;
				cursor?: Record<string, any>;
				take?: number;
				skip?: number;
				where?: Record<string, any>;
				orderBy?: Record<string, 'asc' | 'desc'>;
				include?: Record<string, any>;
				select?: Record<string, boolean>;
			}) => {
				const { model, ...findParams } = params;
				return await this.prisma[model].findMany(findParams);
			},

			// Connect or create relations
			connectOrCreate: async (params: {
				model: string;
				data: Record<string, any>;
				relationField: string;
				relationData: {
					where: Record<string, any>;
					create: Record<string, any>;
				};
			}) => {
				const { model, data, relationField, relationData } = params;
				
				const now = new Date();
				data.updatedAt = now;
				if (!data.createdAt) data.createdAt = now;
				
				// Add timestamps to relation create data
				if (!relationData.create.createdAt) relationData.create.createdAt = now;
				if (!relationData.create.updatedAt) relationData.create.updatedAt = now;
				
				const createData = {
					...data,
					[relationField]: {
						connectOrCreate: relationData,
					},
				};
				
				return await this.prisma[model].create({ data: createData });
			},
		};
	}

	async executeCustomOperation(operationName: string, params: any, context?: any): Promise<any> {
		const operation = this.customOperations[operationName];
		if (!operation) {
			throw new Error(`Custom operation '${operationName}' not found in PrismaCrudAdapter`);
		}
		return await operation(params, context);
	}

	async create(params: {
		model: string;
		data: Record<string, any>;
		include?: IncludeOptions;
	}): Promise<any> {
		const { model, data, include } = params;
		
		// Add timestamps
		const now = new Date();
		if (!data.createdAt) data.createdAt = now;
		if (!data.updatedAt) data.updatedAt = now;

		const prismaInclude = this.convertIncludeOptions(include);

		return await this.prisma[model].create({
			data,
			include: prismaInclude,
		});
	}

	async findFirst(params: {
		model: string;
		where?: CrudWhere[];
		include?: IncludeOptions;
		select?: string[];
	}): Promise<any | null> {
		const { model, where = [], include, select } = params;
		
		const whereClause = this.convertWhere(where);
		const prismaInclude = this.convertIncludeOptions(include);
		const selectClause = this.convertSelect(select);

		return await this.prisma[model].findFirst({
			where: whereClause,
			include: prismaInclude,
			select: selectClause,
		});
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
		const { model, where = [], limit, offset, orderBy = [], include, select } = params;
		
		const whereClause = this.convertWhere(where);
		const orderByClause = this.convertOrderBy(orderBy);
		const prismaInclude = this.convertIncludeOptions(include);
		const selectClause = this.convertSelect(select);

		return await this.prisma[model].findMany({
			where: whereClause,
			orderBy: orderByClause,
			take: limit,
			skip: offset,
			include: prismaInclude,
			select: selectClause,
		});
	}

	async update(params: {
		model: string;
		where: CrudWhere[];
		data: Record<string, any>;
		include?: IncludeOptions;
	}): Promise<any> {
		const { model, where, data, include } = params;
		
		// Add updated timestamp
		data.updatedAt = new Date();

		const whereClause = this.convertWhere(where);
		const prismaInclude = this.convertIncludeOptions(include);

		// For single record update, use update
		if (where.length === 1 && where[0]?.field === "id") {
			return await this.prisma[model].update({
				where: { id: where[0]?.value },
				data,
				include: prismaInclude,
			});
		}

		// For complex where clauses, use updateMany then findFirst
		await this.prisma[model].updateMany({
			where: whereClause,
			data,
		});

		return await this.prisma[model].findFirst({
			where: whereClause,
			include: prismaInclude,
		});
	}

	async delete(params: {
		model: string;
		where: CrudWhere[];
		cascade?: boolean;
	}): Promise<void> {
		const { model, where } = params;
		
		const whereClause = this.convertWhere(where);

		// For single record delete by ID, use delete
		if (where.length === 1 && where[0]?.field === "id") {
			await this.prisma[model].delete({
				where: { id: where[0]?.value },
			});
		} else {
			// For complex where clauses, use deleteMany
			await this.prisma[model].deleteMany({
				where: whereClause,
			});
		}
	}

	async count(params: {
		model: string;
		where?: CrudWhere[];
	}): Promise<number> {
		const { model, where = [] } = params;
		
		const whereClause = this.convertWhere(where);

		return await this.prisma[model].count({
			where: whereClause,
		});
	}

	async createSchema(data: { model: string; fields: Record<string, FieldAttribute> }[]): Promise<void> {
		// Note: Prisma schema is typically defined in schema.prisma file
		// This method could be used for runtime schema validation
		console.warn("Prisma schema is typically defined in schema.prisma file. Auto-migration not supported through adapter.");
		console.warn("Use 'prisma db push' or 'prisma migrate' for schema changes.");
	}

	private convertWhere(where: CrudWhere[]): Record<string, any> {
		const converted: Record<string, any> = {};
		
		for (const condition of where) {
			const { field, operator = "eq", value } = condition;
			
			switch (operator) {
				case "eq":
					converted[field] = value;
					break;
				case "ne":
					converted[field] = { not: value };
					break;
				case "gt":
					converted[field] = { gt: value };
					break;
				case "gte":
					converted[field] = { gte: value };
					break;
				case "lt":
					converted[field] = { lt: value };
					break;
				case "lte":
					converted[field] = { lte: value };
					break;
				case "like":
					converted[field] = { contains: value.replace(/%/g, '') };
					break;
				case "notLike":
					converted[field] = { not: { contains: value.replace(/%/g, '') } };
					break;
				case "in":
					converted[field] = { in: value };
					break;
				case "notIn":
					converted[field] = { notIn: value };
					break;
				default:
					converted[field] = value;
			}
		}
		
		return converted;
	}

	private convertOrderBy(orderBy: CrudOrderBy[]): Record<string, "asc" | "desc">[] {
		return orderBy.map(order => ({
			[order.field]: order.direction,
		}));
	}

	private convertIncludeOptions(include?: IncludeOptions): Record<string, any> | undefined {
		if (!include) return undefined;

		const converted: Record<string, any> = {};

		// Handle simple includes array
		if (include.include) {
			for (const relationName of include.include) {
				converted[relationName] = true;
			}
		}

		// Handle advanced select with nested options
		if (include.select) {
			for (const [relationName, options] of Object.entries(include.select)) {
				if (options === true) {
					converted[relationName] = true;
				} else if (typeof options === "object") {
					converted[relationName] = this.convertIncludeOptions(options);
				}
			}
		}

		return Object.keys(converted).length > 0 ? converted : undefined;
	}

	private convertSelect(select?: string[]): Record<string, boolean> | undefined {
		if (!select || select.length === 0) return undefined;
		
		const converted: Record<string, boolean> = {};
		for (const field of select) {
			converted[field] = true;
		}
		
		return converted;
	}
}

/**
 * Helper function to create Prisma adapter
 */
export function createPrismaAdapter(prisma: any): PrismaCrudAdapter {
	return new PrismaCrudAdapter(prisma);
}