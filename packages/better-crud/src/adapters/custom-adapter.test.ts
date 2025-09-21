import { describe, it, expect } from "vitest";
import { betterCrud } from "../crud";
import { CrudAdapter } from "../types/adapter";
import { z } from "zod";

describe("Custom Adapter Integration", () => {
	it("should work with a custom adapter implementation", async () => {
		// Create a simple in-memory adapter for testing
		const mockData = new Map<string, any>();
		
		const customAdapter: CrudAdapter = {
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
						const matches = where.every(w => value[w.field] === w.value);
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
						const matches = where.every(w => value[w.field] === w.value);
						if (matches) count++;
					}
				}
				return count;
			},
		};

		// Create CRUD instance with custom adapter
		const crud = betterCrud({
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
});