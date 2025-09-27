import { FieldAttribute, IncludeOptions } from ".";

/**
 * Where clause for database queries
 */
export interface QueryWhere {
	field: string;
	value: any;
	operator?: "eq" | "ne" | "lt" | "lte" | "gt" | "gte" | "in" | "notIn" | "like" | "notLike";
}

// Legacy alias
export type CrudWhere = QueryWhere;

/**
 * Order by clause for database queries
 */
export interface QueryOrderBy {
	field: string;
	direction: "asc" | "desc";
}

// Legacy alias
export type CrudOrderBy = QueryOrderBy;

/**
 * Custom operation function signature
 */
export type CustomOperation = (params: any, context?: any) => Promise<any>;

/**
 * Registry for custom operations specific to an adapter
 */
export interface CustomOperations {
	[operationName: string]: CustomOperation;
}

/**
 * Generic Query Adapter Interface
 * Similar to better-auth's Adapter interface but specialized for database operations
 */
export interface QueryAdapter {
	/** Create a new record */
	create(params: {
		model: string;
		data: Record<string, any>;
		include?: IncludeOptions;
	}): Promise<any>;

	/** Find a single record */
	findFirst(params: {
		model: string;
		where?: QueryWhere[];
		include?: IncludeOptions;
		select?: string[];
	}): Promise<any | null>;

	/** Find multiple records */
	findMany(params: {
		model: string;
		where?: QueryWhere[];
		limit?: number;
		offset?: number;
		orderBy?: QueryOrderBy[];
		include?: IncludeOptions;
		select?: string[];
	}): Promise<any[]>;

	/** Update a record */
	update(params: {
		model: string;
		where: QueryWhere[];
		data: Record<string, any>;
		include?: IncludeOptions;
	}): Promise<any>;

	/** Delete a record */
	delete(params: {
		model: string;
		where: QueryWhere[];
		cascade?: boolean;
	}): Promise<void>;

	/** Count records */
	count(params: {
		model: string;
		where?: QueryWhere[];
	}): Promise<number>;

	/** Custom operations specific to the ORM/adapter */
	customOperations?: CustomOperations;

	/** Execute a custom operation */
	executeCustomOperation?(operationName: string, params: any, context?: any): Promise<any>;

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
		where: QueryWhere[];
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

	/** Manage many-to-many relationships through junction tables */
	manageManyToMany?(params: {
		sourceModel: string;
		sourceId: string;
		relationName: string;
		targetIds: string[];
		operation: "set" | "add" | "remove";
	}): Promise<void>;

	/** Create junction table for many-to-many relationships */
	createJunctionTable?(params: {
		tableName: string;
		sourceKey: string;
		targetKey: string;
		sourceTable: string;
		targetTable: string;
	}): Promise<void>;

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

// Legacy alias
export type CrudAdapter = QueryAdapter;

/**
 * Adapter configuration interface
 */
export interface QueryAdapterConfig {
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

// Legacy alias
export type CrudAdapterConfig = QueryAdapterConfig;