import { betterCrud, CrudAdapter } from "better-crud";
import { z } from "zod";

// Example 1: Using built-in Kysely adapter with SQLite
const crudWithKysely = betterCrud({
	resources: [
		{
			name: "product",
			schema: z.object({
				id: z.string(),
				name: z.string(),
				price: z.number(),
				description: z.string().optional(),
			}),
		},
	],
	database: {
		provider: "sqlite",
		url: "sqlite:./database.db",
		autoMigrate: true,
	},
});

// Example 2: Using built-in Kysely adapter with PostgreSQL
const crudWithPostgres = betterCrud({
	resources: [
		{
			name: "user",
			schema: z.object({
				id: z.string(),
				email: z.string().email(),
				name: z.string(),
			}),
		},
	],
	database: {
		provider: "postgres",
		url: "postgresql://user:password@localhost:5432/mydb",
		autoMigrate: false,
	},
});

// Example 3: Using a custom adapter (e.g., for different ORM or database)
class CustomPrismaAdapter implements CrudAdapter {
	constructor(private prisma: any) {}

	async create(params) {
		const { model, data } = params;
		return await this.prisma[model].create({ data });
	}

	async findFirst(params) {
		const { model, where = [] } = params;
		const whereClause = this.convertWhere(where);
		return await this.prisma[model].findFirst({ where: whereClause });
	}

	async findMany(params) {
		const { model, where = [], limit, offset, orderBy = [] } = params;
		const whereClause = this.convertWhere(where);
		const orderByClause = this.convertOrderBy(orderBy);
		
		return await this.prisma[model].findMany({
			where: whereClause,
			take: limit,
			skip: offset,
			orderBy: orderByClause,
		});
	}

	async update(params) {
		const { model, where, data } = params;
		const whereClause = this.convertWhere(where);
		return await this.prisma[model].update({
			where: whereClause,
			data,
		});
	}

	async delete(params) {
		const { model, where } = params;
		const whereClause = this.convertWhere(where);
		await this.prisma[model].delete({ where: whereClause });
	}

	async count(params) {
		const { model, where = [] } = params;
		const whereClause = this.convertWhere(where);
		return await this.prisma[model].count({ where: whereClause });
	}

	private convertWhere(where: any[]) {
		const converted: any = {};
		for (const condition of where) {
			converted[condition.field] = condition.value;
		}
		return converted;
	}

	private convertOrderBy(orderBy: any[]) {
		return orderBy.map(order => ({
			[order.field]: order.direction,
		}));
	}
}

// Example usage with custom Prisma adapter
const crudWithPrisma = betterCrud({
	resources: [
		{
			name: "post",
			schema: z.object({
				id: z.string(),
				title: z.string(),
				content: z.string(),
				published: z.boolean().default(false),
			}),
		},
	],
	database: {
		adapter: new CustomPrismaAdapter({} as any), // Prisma client would go here
	},
});

// Example 4: Using a simple in-memory adapter for testing
class InMemoryAdapter implements CrudAdapter {
	private data = new Map<string, any>();

	async create(params) {
		const { model, data } = params;
		const id = `${model}_${Date.now()}_${Math.random()}`;
		const record = { id, ...data };
		this.data.set(id, record);
		return record;
	}

	async findFirst(params) {
		const { model, where = [] } = params;
		for (const [key, value] of this.data.entries()) {
			if (key.startsWith(model)) {
				const matches = where.every(w => value[w.field] === w.value);
				if (matches) return value;
			}
		}
		return null;
	}

	async findMany(params) {
		const { model, where = [], limit, offset = 0 } = params;
		const results = [];
		let count = 0;
		
		for (const [key, value] of this.data.entries()) {
			if (key.startsWith(model)) {
				const matches = where.every(w => value[w.field] === w.value);
				if (matches) {
					if (count >= offset) {
						results.push(value);
					}
					count++;
					if (limit && results.length >= limit) break;
				}
			}
		}
		return results;
	}

	async update(params) {
		const { model, where, data } = params;
		const existing = await this.findFirst({ model, where });
		if (existing) {
			const updated = { ...existing, ...data };
			this.data.set(existing.id, updated);
			return updated;
		}
		throw new Error("Record not found");
	}

	async delete(params) {
		const { model, where } = params;
		const existing = await this.findFirst({ model, where });
		if (existing) {
			this.data.delete(existing.id);
		}
	}

	async count(params) {
		const { model, where = [] } = params;
		let count = 0;
		for (const [key, value] of this.data.entries()) {
			if (key.startsWith(model)) {
				const matches = where.every(w => value[w.field] === w.value);
				if (matches) count++;
			}
		}
		return count;
	}
}

const crudWithInMemory = betterCrud({
	resources: [
		{
			name: "todo",
			schema: z.object({
				id: z.string(),
				title: z.string(),
				completed: z.boolean().default(false),
			}),
		},
	],
	database: {
		adapter: new InMemoryAdapter(),
	},
});

export {
	crudWithKysely,
	crudWithPostgres,
	crudWithPrisma,
	crudWithInMemory,
};