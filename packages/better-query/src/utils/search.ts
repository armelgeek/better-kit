import { IncludeOptions, QueryParams } from "../types";

/**
 * Search and filtering utilities
 */
export class SearchBuilder {
	/**
	 * Build search conditions from query parameters
	 */
	static buildSearchConditions(
		query: QueryParams,
		searchConfig?: {
			fields: string[];
			strategy: "contains" | "startsWith" | "exact" | "fuzzy";
			caseSensitive?: boolean;
		},
	): Array<{ field: string; value: any; operator?: string }> {
		const conditions: Array<{ field: string; value: any; operator?: string }> =
			[];

		// Handle basic search
		if (query.search || query.q) {
			const searchTerm = query.search || query.q || "";
			const searchFields = query.searchFields ||
				searchConfig?.fields || ["name"];
			const strategy = searchConfig?.strategy || "contains";
			const caseSensitive = searchConfig?.caseSensitive || false;

			// Prepare search value based on strategy
			let searchValue = searchTerm;
			let operator = "like";

			if (!caseSensitive) {
				searchValue = searchValue.toLowerCase();
				operator = "ilike";
			}

			switch (strategy) {
				case "contains":
					searchValue = `%${searchValue}%`;
					break;
				case "startsWith":
					searchValue = `${searchValue}%`;
					break;
				case "exact":
					operator = "eq";
					break;
				case "fuzzy":
					// For fuzzy search, we'll use similarity operator if supported
					operator = "like";
					searchValue = `%${searchValue.split("").join("%")}%`;
					break;
			}

			// Add search conditions for each field
			searchFields.forEach((field) => {
				conditions.push({
					field,
					value: searchValue,
					operator,
				});
			});
		}

		// Handle advanced filters
		if (query.filters) {
			for (const [field, filter] of Object.entries(query.filters)) {
				conditions.push({
					field,
					value: filter.value,
					operator: filter.operator,
				});
			}
		}

		// Handle date range filters
		if (query.dateRange) {
			const { field, start, end } = query.dateRange;

			if (start) {
				conditions.push({
					field,
					value: new Date(start),
					operator: "gte",
				});
			}

			if (end) {
				conditions.push({
					field,
					value: new Date(end),
					operator: "lte",
				});
			}
		}

		// Handle basic where conditions
		if (query.where) {
			for (const [field, value] of Object.entries(query.where)) {
				conditions.push({
					field,
					value,
					operator: "eq",
				});
			}
		}

		return conditions;
	}

	/**
	 * Build order by conditions
	 */
	static buildOrderBy(
		query: QueryParams,
	): Array<{ field: string; direction: "asc" | "desc" }> {
		const orderBy: Array<{ field: string; direction: "asc" | "desc" }> = [];

		// Handle explicit orderBy from query
		if (query.orderBy) {
			orderBy.push(
				...query.orderBy.map((order) => ({
					field: order.field,
					direction: order.direction,
				})),
			);
		}

		// Handle simple sortBy and sortOrder
		if (query.sortBy) {
			orderBy.push({
				field: query.sortBy,
				direction: query.sortOrder || "asc",
			});
		}

		// Default sorting if none specified
		if (orderBy.length === 0) {
			orderBy.push({
				field: "createdAt",
				direction: "desc",
			});
		}

		return orderBy;
	}

	/**
	 * Build pagination parameters
	 */
	static buildPagination(query: QueryParams): {
		limit: number;
		offset: number;
		page: number;
	} {
		const page = Math.max(1, query.page || 1);
		const limit = Math.min(100, Math.max(1, query.limit || 10));
		const offset = (page - 1) * limit;

		return { limit, offset, page };
	}

	/**
	 * Build include/select options for relationships
	 */
	static buildIncludeOptions(query: QueryParams): IncludeOptions | undefined {
		const options: IncludeOptions = {};

		if (query.include) {
			// Handle both string and string array
			if (typeof query.include === "string") {
				options.include = query.include
					.split(",")
					.map((s) => s.trim())
					.filter(Boolean);
			} else {
				options.include = query.include;
			}
		}

		if (query.select) {
			options.select = query.select;
		}

		return Object.keys(options).length > 0 ? options : undefined;
	}

	/**
	 * Parse string array from query parameter
	 */
	static parseStringArray(value: string | string[] | undefined): string[] {
		if (!value) return [];
		if (Array.isArray(value)) return value;
		return value
			.split(",")
			.map((s) => s.trim())
			.filter(Boolean);
	}

	/**
	 * Parse JSON from query parameter safely
	 */
	static parseJSON(value: string | undefined, defaultValue: any = {}): any {
		if (!value) return defaultValue;

		try {
			return JSON.parse(value);
		} catch {
			return defaultValue;
		}
	}
}

/**
 * Filter builder for complex queries
 */
export class FilterBuilder {
	private conditions: Array<{ field: string; value: any; operator: string }> =
		[];
	private logicalOperator: "AND" | "OR" = "AND";

	/**
	 * Add a condition
	 */
	where(field: string, operator: string, value: any): this {
		this.conditions.push({ field, value, operator });
		return this;
	}

	/**
	 * Add equals condition
	 */
	equals(field: string, value: any): this {
		return this.where(field, "eq", value);
	}

	/**
	 * Add not equals condition
	 */
	notEquals(field: string, value: any): this {
		return this.where(field, "ne", value);
	}

	/**
	 * Add greater than condition
	 */
	greaterThan(field: string, value: any): this {
		return this.where(field, "gt", value);
	}

	/**
	 * Add greater than or equal condition
	 */
	greaterThanOrEqual(field: string, value: any): this {
		return this.where(field, "gte", value);
	}

	/**
	 * Add less than condition
	 */
	lessThan(field: string, value: any): this {
		return this.where(field, "lt", value);
	}

	/**
	 * Add less than or equal condition
	 */
	lessThanOrEqual(field: string, value: any): this {
		return this.where(field, "lte", value);
	}

	/**
	 * Add like condition
	 */
	like(field: string, value: string): this {
		return this.where(field, "like", `%${value}%`);
	}

	/**
	 * Add in condition
	 */
	in(field: string, values: any[]): this {
		return this.where(field, "in", values);
	}

	/**
	 * Add not in condition
	 */
	notIn(field: string, values: any[]): this {
		return this.where(field, "notin", values);
	}

	/**
	 * Add between condition
	 */
	between(field: string, start: any, end: any): this {
		return this.where(field, "between", [start, end]);
	}

	/**
	 * Set logical operator for conditions
	 */
	setLogicalOperator(operator: "AND" | "OR"): this {
		this.logicalOperator = operator;
		return this;
	}

	/**
	 * Build the final conditions
	 */
	build(): Array<{ field: string; value: any; operator: string }> {
		return this.conditions;
	}

	/**
	 * Reset the builder
	 */
	reset(): this {
		this.conditions = [];
		this.logicalOperator = "AND";
		return this;
	}
}

/**
 * Search utilities for text search
 */
export const SearchUtils = {
	/**
	 * Escape special characters for SQL LIKE
	 */
	escapeLike(value: string): string {
		return value.replace(/[%_]/g, "\\$&");
	},

	/**
	 * Normalize search term
	 */
	normalizeSearchTerm(term: string): string {
		return term.trim().toLowerCase();
	},

	/**
	 * Split search term into tokens
	 */
	tokenize(term: string): string[] {
		return term.split(/\s+/).filter(Boolean);
	},

	/**
	 * Build full-text search query
	 */
	buildFullTextQuery(
		terms: string[],
		fields: string[],
		operator: "AND" | "OR" = "OR",
	): Array<{ field: string; value: any; operator: string }> {
		const conditions: Array<{ field: string; value: any; operator: string }> =
			[];

		for (const term of terms) {
			for (const field of fields) {
				conditions.push({
					field,
					value: `%${this.escapeLike(term)}%`,
					operator: "ilike",
				});
			}
		}

		return conditions;
	},
};
