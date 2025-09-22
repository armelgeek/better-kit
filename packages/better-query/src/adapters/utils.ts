import { QueryOptions } from "../types";
import { QueryAdapter, QueryWhere } from "../types/adapter";
import { createKyselyAdapter, kyselyQueryAdapter } from "./kysely";

/**
 * Convert old where clause format to new QueryWhere format
 */
export function convertToQueryWhere(where: Array<{ field: string; value: any; operator?: string }>): QueryWhere[] {
	return where.map(w => ({
		field: w.field,
		value: w.value,
		operator: w.operator as any || "eq",
	}));
}

// Legacy alias
export const convertToCrudWhere = convertToQueryWhere;

/**
 * Convert old orderBy format to new QueryOrderBy format
 */
export function convertToQueryOrderBy(orderBy: Array<{ field: string; direction: "asc" | "desc" }>): import("../types/adapter").QueryOrderBy[] {
	return orderBy.map(o => ({
		field: o.field,
		direction: o.direction,
	}));
}

// Legacy alias
export const convertToCrudOrderBy = convertToQueryOrderBy;

/**
 * Get the appropriate adapter based on the database configuration
 * Similar to better-auth's getAdapter function
 */
export function getQueryAdapter(options: QueryOptions): QueryAdapter {
	// If user provides a direct adapter, use it
	if ("adapter" in options.database) {
		return options.database.adapter;
	}

	// If user provides provider config, create the appropriate adapter
	if ("provider" in options.database) {
		const db = createKyselyAdapter({ database: options.database });
		if (!db) {
			throw new Error("Failed to initialize database adapter");
		}

		// For now, we only support Kysely adapters
		// In the future, we can add support for other ORMs here
		return kyselyQueryAdapter(db, {
			provider: options.database.provider,
			autoMigrate: options.database.autoMigrate,
		});
	}

	throw new Error("Invalid database configuration. Provide either 'adapter' or 'provider' configuration.");
}

// Legacy alias
export const getCrudAdapter = getQueryAdapter;

/**
 * Get database type from configuration
 */
export function getDatabaseType(options: QueryOptions): string {
	if ("provider" in options.database) {
		return options.database.provider;
	}
	if ("adapter" in options.database) {
		// Try to infer from adapter if possible
		return "unknown";
	}
	return "sqlite"; // default
}