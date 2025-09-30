import { describe, expect, it } from "vitest";
import { z } from "zod";
import { betterQuery } from "../query";
import { CrudAdapter } from "../types/adapter";

describe("Custom Adapter Integration", () => {
	it("should work with a custom adapter implementation", async () => {
		// Create a simple in-memory adapter for testing
		const mockData = new Map<string, any>();

		const customAdapter: CrudAdapter = {
			customOperations: {
				// Custom in-memory operations for testing
				bulkCreate: async (params: {
					model: string;
					data: Record<string, any>[];
				}) => {
					const { model, data } = params;
					const results = [];
					for (const item of data) {
						const id = `${model}_${Date.now()}_${Math.random()}`;
						const record = { id, ...item };
						mockData.set(id, record);
						results.push(record);
					}
					return results;
				},
				clearAll: async (params: { model: string }) => {
					const { model } = params;
					const keysToDelete = [];
					for (const key of mockData.keys()) {
						if (key.startsWith(model)) {
							keysToDelete.push(key);
						}
					}
					for (const key of keysToDelete) {
						mockData.delete(key);
					}
					return { deleted: keysToDelete.length };
				},
				getStats: async (params: { model: string }) => {
					const { model } = params;
					let count = 0;
					for (const key of mockData.keys()) {
						if (key.startsWith(model)) {
							count++;
						}
					}
					return { totalRecords: count, model };
				},
			},

			async executeCustomOperation(
				operationName: string,
				params: any,
				context?: any,
			): Promise<any> {
				const operation = this.customOperations![operationName];
				if (!operation) {
					throw new Error(`Custom operation '${operationName}' not found`);
				}
				return await operation(params, context);
			},

			async create(params) {
				const { model, data } = params;
				const id = `${model}_${Date.now()}`;
				const record = { id, ...data };
				mockData.set(id, record);
				return record;
			},

			async findFirst(params) {
				const { model, where = [] } = params;
				for (const [key, value] of mockData.entries()) {
					if (key.startsWith(model)) {
						// Simple where matching
						const matches = where.every((w) => value[w.field] === w.value);
						if (matches) return value;
					}
				}
				return null;
			},

			async findMany(params) {
				const { model, where = [], limit, offset = 0 } = params;
				const results = [];
				let count = 0;

				for (const [key, value] of mockData.entries()) {
					if (key.startsWith(model)) {
						const matches = where.every((w) => value[w.field] === w.value);
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
			},

			async update(params) {
				const { model, where, data } = params;
				const existing = await this.findFirst({ model, where });
				if (existing) {
					const updated = { ...existing, ...data };
					mockData.set(existing.id, updated);
					return updated;
				}
				throw new Error("Record not found");
			},

			async delete(params) {
				const { model, where } = params;
				const existing = await this.findFirst({ model, where });
				if (existing) {
					mockData.delete(existing.id);
				}
			},

			async count(params) {
				const { model, where = [] } = params;
				let count = 0;
				for (const [key, value] of mockData.entries()) {
					if (key.startsWith(model)) {
						const matches = where.every((w) => value[w.field] === w.value);
						if (matches) count++;
					}
				}
				return count;
			},
		};

		// Create CRUD instance with custom adapter
		const crud = betterQuery({
			resources: [
				{
					name: "user",
					schema: z.object({
						id: z.string(),
						name: z.string(),
						email: z.string().email(),
					}),
				},
			],
			database: {
				adapter: customAdapter,
			},
		});

		expect(crud).toBeDefined();
		expect(crud.context.adapter).toBe(customAdapter);

		// Test that the adapter is working by using the create method directly
		const result = await customAdapter.create({
			model: "user",
			data: { name: "John Doe", email: "john@example.com" },
		});

		expect(result).toBeDefined();
		expect(result.name).toBe("John Doe");
		expect(result.email).toBe("john@example.com");
		expect(result.id).toBeDefined();
	});

	it("should support custom operations through the adapter", async () => {
		const mockData = new Map<string, any>();

		const customAdapter: CrudAdapter = {
			customOperations: {
				bulkCreate: async (params: {
					model: string;
					data: Record<string, any>[];
				}) => {
					const { model, data } = params;
					const results = [];
					for (const item of data) {
						const id = `${model}_${Date.now()}_${Math.random()}`;
						const record = { id, ...item };
						mockData.set(id, record);
						results.push(record);
					}
					return results;
				},
				clearAll: async (params: { model: string }) => {
					const { model } = params;
					const keysToDelete = [];
					for (const key of mockData.keys()) {
						if (key.startsWith(model)) {
							keysToDelete.push(key);
						}
					}
					for (const key of keysToDelete) {
						mockData.delete(key);
					}
					return { deleted: keysToDelete.length };
				},
			},

			async executeCustomOperation(
				operationName: string,
				params: any,
				context?: any,
			): Promise<any> {
				const operation = this.customOperations![operationName];
				if (!operation) {
					throw new Error(`Custom operation '${operationName}' not found`);
				}
				return await operation(params, context);
			},

			async create(params) {
				const { model, data } = params;
				const id = `${model}_${Date.now()}`;
				const record = { id, ...data };
				mockData.set(id, record);
				return record;
			},

			async findFirst(params) {
				const { model, where = [] } = params;
				for (const [key, value] of mockData.entries()) {
					if (key.startsWith(model)) {
						const matches = where.every((w) => value[w.field] === w.value);
						if (matches) return value;
					}
				}
				return null;
			},

			async findMany(params) {
				const { model, where = [], limit, offset = 0 } = params;
				const results = [];
				let count = 0;

				for (const [key, value] of mockData.entries()) {
					if (key.startsWith(model)) {
						const matches = where.every((w) => value[w.field] === w.value);
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
			},

			async update(params) {
				const { model, where, data } = params;
				const existing = await this.findFirst({ model, where });
				if (existing) {
					const updated = { ...existing, ...data };
					mockData.set(existing.id, updated);
					return updated;
				}
				throw new Error("Record not found");
			},

			async delete(params) {
				const { model, where } = params;
				const existing = await this.findFirst({ model, where });
				if (existing) {
					mockData.delete(existing.id);
				}
			},

			async count(params) {
				const { model, where = [] } = params;
				let count = 0;
				for (const [key, value] of mockData.entries()) {
					if (key.startsWith(model)) {
						const matches = where.every((w) => value[w.field] === w.value);
						if (matches) count++;
					}
				}
				return count;
			},
		};

		// Create CRUD instance with custom adapter
		const crud = betterQuery({
			resources: [
				{
					name: "user",
					schema: z.object({
						id: z.string(),
						name: z.string(),
						email: z.string().email(),
					}),
				},
			],
			database: {
				adapter: customAdapter,
			},
		});

		// Test custom operations
		expect(crud.hasCustomOperation("bulkCreate")).toBe(true);
		expect(crud.hasCustomOperation("clearAll")).toBe(true);
		expect(crud.hasCustomOperation("nonExistent")).toBe(false);

		// Test bulk create custom operation
		const users = [
			{ name: "Alice", email: "alice@example.com" },
			{ name: "Bob", email: "bob@example.com" },
		];

		const results = await crud.customOperation("bulkCreate", {
			model: "user",
			data: users,
		});

		expect(results).toHaveLength(2);
		expect(results[0].name).toBe("Alice");
		expect(results[1].name).toBe("Bob");

		// Test clear all custom operation
		const clearResult = await crud.customOperation("clearAll", {
			model: "user",
		});

		expect(clearResult.deleted).toBe(2);

		// Get custom operations list
		const operations = crud.getCustomOperations();
		expect(operations.bulkCreate).toBeDefined();
		expect(operations.clearAll).toBeDefined();
	});
});
