import { CrudOptions } from "../types";
import { CrudAdapter, CrudWhere } from "../types/adapter";
import { createKyselyAdapter, kyselyCrudAdapter } from "./kysely";

/**
 * Convert old where clause format to new CrudWhere format
 */
export function convertToCrudWhere(where: Array<{ field: string; value: any; operator?: string }>): CrudWhere[] {
	return where.map(w => ({
		field: w.field,
		value: w.value,
		operator: w.operator as any || "eq",
	}));
}

/**
 * Convert old orderBy format to new CrudOrderBy format
 */
export function convertToCrudOrderBy(orderBy: Array<{ field: string; direction: "asc" | "desc" }>): import("../types/adapter").CrudOrderBy[] {
	return orderBy.map(o => ({
		field: o.field,
		direction: o.direction,
	}));
}

/**
 * Get the appropriate adapter based on the database configuration
 * Similar to better-auth's getAdapter function
 */
export function getCrudAdapter(options: CrudOptions): CrudAdapter {
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
		return kyselyCrudAdapter(db, {
			provider: options.database.provider,
			autoMigrate: options.database.autoMigrate,
		});
	}

	throw new Error("Invalid database configuration. Provide either 'adapter' or 'provider' configuration.");
}

/**
 * Get database type from configuration
 */
export function getDatabaseType(options: CrudOptions): string {
	if ("provider" in options.database) {
		return options.database.provider;
	}
	if ("adapter" in options.database) {
		// Try to infer from adapter if possible
		return "unknown";
	}
	return "sqlite"; // default
}