import { betterCrud, createPrismaAdapter, createDrizzleAdapter } from "better-crud";
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

// Example 3: Using built-in Prisma adapter
// import { PrismaClient } from '@prisma/client';
// const prisma = new PrismaClient();

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
		adapter: createPrismaAdapter({} as any), // Pass your PrismaClient instance here
	},
});

// Example 4: Using built-in Drizzle adapter
// import { drizzle } from 'drizzle-orm/better-sqlite3';
// import Database from 'better-sqlite3';
// import * as schema from './schema';
// 
// const sqlite = new Database('sqlite.db');
// const db = drizzle(sqlite);

const crudWithDrizzle = betterCrud({
	resources: [
		{
			name: "category",
			schema: z.object({
				id: z.string(),
				name: z.string(),
				description: z.string().optional(),
			}),
		},
	],
	database: {
		adapter: createDrizzleAdapter({} as any, {} as any), // Pass your Drizzle db and schema here
	},
});

// Example 5: Using a simple in-memory adapter for testing
import { CrudAdapter } from "better-crud";

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
	crudWithDrizzle,
	crudWithInMemory,
};