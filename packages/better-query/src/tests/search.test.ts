import { describe, expect, it } from "vitest";
import { CrudQueryParams } from "../types";
import { FilterBuilder, SearchBuilder, SearchUtils } from "../utils/search";

describe("Search Utils", () => {
	describe("SearchBuilder", () => {
		describe("buildSearchConditions", () => {
			it("should build conditions for basic search", () => {
				const query: CrudQueryParams = {
					search: "test product",
				};

				const searchConfig = {
					fields: ["name", "description"],
					strategy: "contains" as const,
				};

				const conditions = SearchBuilder.buildSearchConditions(
					query,
					searchConfig,
				);

				expect(conditions).toHaveLength(2);
				expect(conditions[0]).toEqual({
					field: "name",
					value: "%test product%",
					operator: "ilike",
				});
				expect(conditions[1]).toEqual({
					field: "description",
					value: "%test product%",
					operator: "ilike",
				});
			});

			it("should build conditions for different search strategies", () => {
				const query: CrudQueryParams = {
					q: "test",
				};

				// Test startsWith strategy
				const startsWithConfig = {
					fields: ["name"],
					strategy: "startsWith" as const,
				};

				const startsWithConditions = SearchBuilder.buildSearchConditions(
					query,
					startsWithConfig,
				);
				expect(startsWithConditions[0].value).toBe("test%");

				// Test exact strategy
				const exactConfig = {
					fields: ["name"],
					strategy: "exact" as const,
				};

				const exactConditions = SearchBuilder.buildSearchConditions(
					query,
					exactConfig,
				);
				expect(exactConditions[0].value).toBe("test");
				expect(exactConditions[0].operator).toBe("eq");
			});

			it("should handle advanced filters", () => {
				const query: CrudQueryParams = {
					filters: {
						price: { operator: "gte", value: 100 },
						category: { operator: "eq", value: "electronics" },
					},
				};

				const conditions = SearchBuilder.buildSearchConditions(query);

				expect(conditions).toHaveLength(2);
				expect(conditions).toContainEqual({
					field: "price",
					value: 100,
					operator: "gte",
				});
				expect(conditions).toContainEqual({
					field: "category",
					value: "electronics",
					operator: "eq",
				});
			});

			it("should handle date range filters", () => {
				const query: CrudQueryParams = {
					dateRange: {
						field: "createdAt",
						start: "2023-01-01",
						end: "2023-12-31",
					},
				};

				const conditions = SearchBuilder.buildSearchConditions(query);

				expect(conditions).toHaveLength(2);
				expect(conditions[0]).toEqual({
					field: "createdAt",
					value: new Date("2023-01-01"),
					operator: "gte",
				});
				expect(conditions[1]).toEqual({
					field: "createdAt",
					value: new Date("2023-12-31"),
					operator: "lte",
				});
			});

			it("should handle where conditions", () => {
				const query: CrudQueryParams = {
					where: {
						status: "active",
						featured: true,
					},
				};

				const conditions = SearchBuilder.buildSearchConditions(query);

				expect(conditions).toHaveLength(2);
				expect(conditions).toContainEqual({
					field: "status",
					value: "active",
					operator: "eq",
				});
				expect(conditions).toContainEqual({
					field: "featured",
					value: true,
					operator: "eq",
				});
			});
		});

		describe("buildOrderBy", () => {
			it("should build order from explicit orderBy", () => {
				const query: CrudQueryParams = {
					orderBy: [
						{ field: "name", direction: "asc" },
						{ field: "createdAt", direction: "desc" },
					],
				};

				const orderBy = SearchBuilder.buildOrderBy(query);

				expect(orderBy).toEqual([
					{ field: "name", direction: "asc" },
					{ field: "createdAt", direction: "desc" },
				]);
			});

			it("should build order from sortBy and sortOrder", () => {
				const query: CrudQueryParams = {
					sortBy: "price",
					sortOrder: "desc",
				};

				const orderBy = SearchBuilder.buildOrderBy(query);

				expect(orderBy).toEqual([{ field: "price", direction: "desc" }]);
			});

			it("should provide default ordering when none specified", () => {
				const query: CrudQueryParams = {};

				const orderBy = SearchBuilder.buildOrderBy(query);

				expect(orderBy).toEqual([{ field: "createdAt", direction: "desc" }]);
			});
		});

		describe("buildPagination", () => {
			it("should build pagination with valid parameters", () => {
				const query: CrudQueryParams = {
					page: 3,
					limit: 20,
				};

				const pagination = SearchBuilder.buildPagination(query);

				expect(pagination).toEqual({
					page: 3,
					limit: 20,
					offset: 40,
				});
			});

			it("should handle default values", () => {
				const query: CrudQueryParams = {};

				const pagination = SearchBuilder.buildPagination(query);

				expect(pagination).toEqual({
					page: 1,
					limit: 10,
					offset: 0,
				});
			});

			it("should enforce limits", () => {
				const query: CrudQueryParams = {
					page: 0, // Should be at least 1
					limit: 200, // Should be at most 100
				};

				const pagination = SearchBuilder.buildPagination(query);

				expect(pagination.page).toBe(1);
				expect(pagination.limit).toBe(100);
			});
		});

		describe("parseStringArray", () => {
			it("should parse comma-separated string", () => {
				const result = SearchBuilder.parseStringArray("name,description,tags");
				expect(result).toEqual(["name", "description", "tags"]);
			});

			it("should handle array input", () => {
				const result = SearchBuilder.parseStringArray(["name", "description"]);
				expect(result).toEqual(["name", "description"]);
			});

			it("should handle undefined input", () => {
				const result = SearchBuilder.parseStringArray(undefined);
				expect(result).toEqual([]);
			});

			it("should trim whitespace and filter empty strings", () => {
				const result = SearchBuilder.parseStringArray("name, , description,  ");
				expect(result).toEqual(["name", "description"]);
			});
		});

		describe("parseJSON", () => {
			it("should parse valid JSON", () => {
				const result = SearchBuilder.parseJSON('{"key": "value"}');
				expect(result).toEqual({ key: "value" });
			});

			it("should return default value for invalid JSON", () => {
				const result = SearchBuilder.parseJSON("invalid json", {
					default: true,
				});
				expect(result).toEqual({ default: true });
			});

			it("should return empty object as default", () => {
				const result = SearchBuilder.parseJSON("invalid json");
				expect(result).toEqual({});
			});
		});
	});

	describe("FilterBuilder", () => {
		it("should build conditions using fluent interface", () => {
			const builder = new FilterBuilder();

			const conditions = builder
				.equals("status", "active")
				.greaterThan("price", 100)
				.like("name", "product")
				.in("category", ["electronics", "books"])
				.build();

			expect(conditions).toHaveLength(4);
			expect(conditions).toContainEqual({
				field: "status",
				value: "active",
				operator: "eq",
			});
			expect(conditions).toContainEqual({
				field: "price",
				value: 100,
				operator: "gt",
			});
			expect(conditions).toContainEqual({
				field: "name",
				value: "%product%",
				operator: "like",
			});
			expect(conditions).toContainEqual({
				field: "category",
				value: ["electronics", "books"],
				operator: "in",
			});
		});

		it("should handle between conditions", () => {
			const builder = new FilterBuilder();

			const conditions = builder.between("price", 100, 500).build();

			expect(conditions).toContainEqual({
				field: "price",
				value: [100, 500],
				operator: "between",
			});
		});

		it("should reset builder", () => {
			const builder = new FilterBuilder();

			builder.equals("status", "active");
			expect(builder.build()).toHaveLength(1);

			builder.reset();
			expect(builder.build()).toHaveLength(0);
		});
	});

	describe("SearchUtils", () => {
		describe("escapeLike", () => {
			it("should escape SQL LIKE special characters", () => {
				const result = SearchUtils.escapeLike("test%_value");
				expect(result).toBe("test\\%\\_value");
			});
		});

		describe("normalizeSearchTerm", () => {
			it("should trim and lowercase", () => {
				const result = SearchUtils.normalizeSearchTerm("  HELLO World  ");
				expect(result).toBe("hello world");
			});
		});

		describe("tokenize", () => {
			it("should split search term into tokens", () => {
				const result = SearchUtils.tokenize("hello world test");
				expect(result).toEqual(["hello", "world", "test"]);
			});

			it("should handle multiple spaces", () => {
				const result = SearchUtils.tokenize("hello    world  test");
				expect(result).toEqual(["hello", "world", "test"]);
			});

			it("should filter empty tokens", () => {
				const result = SearchUtils.tokenize("  hello    world  ");
				expect(result).toEqual(["hello", "world"]);
			});
		});

		describe("buildFullTextQuery", () => {
			it("should build conditions for multiple terms and fields", () => {
				const terms = ["hello", "world"];
				const fields = ["title", "description"];

				const conditions = SearchUtils.buildFullTextQuery(terms, fields);

				expect(conditions).toHaveLength(4);
				expect(conditions).toContainEqual({
					field: "title",
					value: "%hello%",
					operator: "ilike",
				});
				expect(conditions).toContainEqual({
					field: "description",
					value: "%hello%",
					operator: "ilike",
				});
				expect(conditions).toContainEqual({
					field: "title",
					value: "%world%",
					operator: "ilike",
				});
				expect(conditions).toContainEqual({
					field: "description",
					value: "%world%",
					operator: "ilike",
				});
			});

			it("should escape special characters in terms", () => {
				const terms = ["test%value"];
				const fields = ["title"];

				const conditions = SearchUtils.buildFullTextQuery(terms, fields);

				expect(conditions[0].value).toBe("%test\\%value%");
			});
		});
	});
});
