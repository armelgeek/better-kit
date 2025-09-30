import { describe, expect, it } from "vitest";
import { z } from "zod";
import { getCrudAdapter } from "../adapters/utils";
import { CrudOptions } from "../types";

describe("Adapter System", () => {
	const basicOptions: CrudOptions = {
		resources: [
			{
				name: "test",
				schema: z.object({
					id: z.string(),
					name: z.string(),
				}),
			},
		],
		database: {
			provider: "sqlite",
			url: ":memory:",
			autoMigrate: false,
		},
	};

	it("should create adapter from provider configuration", () => {
		const adapter = getCrudAdapter(basicOptions);
		expect(adapter).toBeDefined();
		expect(typeof adapter.create).toBe("function");
		expect(typeof adapter.findFirst).toBe("function");
		expect(typeof adapter.findMany).toBe("function");
		expect(typeof adapter.update).toBe("function");
		expect(typeof adapter.delete).toBe("function");
		expect(typeof adapter.count).toBe("function");
	});

	it("should accept direct adapter configuration", () => {
		const mockAdapter = {
			create: async () => ({}),
			findFirst: async () => null,
			findMany: async () => [],
			update: async () => ({}),
			delete: async () => {},
			count: async () => 0,
		};

		const optionsWithAdapter: CrudOptions = {
			resources: [],
			database: {
				adapter: mockAdapter,
			},
		};

		const adapter = getCrudAdapter(optionsWithAdapter);
		expect(adapter).toBe(mockAdapter);
	});

	it("should throw error for invalid configuration", () => {
		const invalidOptions = {
			resources: [],
			database: {},
		} as any;

		expect(() => getCrudAdapter(invalidOptions)).toThrow(
			"Invalid database configuration",
		);
	});
});
