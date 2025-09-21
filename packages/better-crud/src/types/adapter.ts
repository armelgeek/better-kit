import { FieldAttribute, IncludeOptions } from ".";

/**
 * Where clause for database queries
 */
export interface CrudWhere {
	field: string;
	value: any;
	operator?: "eq" | "ne" | "lt" | "lte" | "gt" | "gte" | "in" | "notIn" | "like" | "notLike";
}

/**
 * Order by clause for database queries
 */
export interface CrudOrderBy {
	field: string;
	direction: "asc" | "desc";
}

/**
 * Generic CRUD Adapter Interface
 * Similar to better-auth's Adapter interface but specialized for CRUD operations
 */
export interface CrudAdapter {
	/** Create a new record */
	create(params: {
		model: string;
		data: Record<string, any>;
		include?: IncludeOptions;
	}): Promise<any>;

	/** Find a single record */
	findFirst(params: {
		model: string;
		where?: CrudWhere[];
		include?: IncludeOptions;
		select?: string[];
	}): Promise<any | null>;

	/** Find multiple records */
	findMany(params: {
		model: string;
		where?: CrudWhere[];
		limit?: number;
		offset?: number;
		orderBy?: CrudOrderBy[];
		include?: IncludeOptions;
		select?: string[];
	}): Promise<any[]>;

	/** Update a record */
	update(params: {
		model: string;
		where: CrudWhere[];
		data: Record<string, any>;
		include?: IncludeOptions;
	}): Promise<any>;

	/** Delete a record */
	delete(params: {
		model: string;
		where: CrudWhere[];
		cascade?: boolean;
	}): Promise<void>;

	/** Count records */
	count(params: {
		model: string;
		where?: CrudWhere[];
	}): Promise<number>;

	/** Create records with related data atomically */
	createWithRelations?(params: {
		model: string;
		data: Record<string, any>;
		relations?: Record<string, any>;
		include?: IncludeOptions;
	}): Promise<any>;

	/** Update records with related data atomically */
	updateWithRelations?(params: {
		model: string;
		where: CrudWhere[];
		data: Record<string, any>;
		relations?: Record<string, any>;
		include?: IncludeOptions;
	}): Promise<any>;

	/** Validate referential integrity */
	validateReferences?(params: {
		model: string;
		data: Record<string, any>;
		operation: "create" | "update" | "delete";
	}): Promise<{ valid: boolean; errors: string[] }>;

	/** Create database schema (for auto-migration) */
	createSchema?(data: {
		model: string;
		fields: Record<string, FieldAttribute>;
	}[]): Promise<void>;

	/** Configuration specific to the adapter */
	config?: {
		/** Database provider type */
		provider: "sqlite" | "postgres" | "mysql" | "custom";
		/** Data transformation settings */
		transform?: {
			/** Transform date fields */
			date?: boolean;
			/** Transform boolean fields for SQLite */
			boolean?: boolean;
		};
	};
}

/**
 * Adapter configuration interface
 */
export interface CrudAdapterConfig {
	/** Database provider */
	provider: "sqlite" | "postgres" | "mysql";
	/** Enable auto-migration */
	autoMigrate?: boolean;
	/** Data transformation settings */
	transform?: {
		date?: boolean;
		boolean?: boolean;
	};
}