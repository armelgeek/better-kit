import { CrudAdapter, CrudWhere, CrudOrderBy } from "../types/adapter";
import { IncludeOptions, FieldAttribute } from "../types";

/**
 * Prisma ORM adapter for better-crud
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
	constructor(private prisma: any) {} // PrismaClient type

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