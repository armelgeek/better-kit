import { Endpoint } from "better-call";
import { ZodSchema, z } from "zod";

export type CrudOperation = "create" | "read" | "update" | "delete" | "list";

/** Relationship types */
export type RelationType = "hasOne" | "hasMany" | "belongsTo" | "belongsToMany";

/** Relationship definition */
export interface RelationshipConfig {
	/** Type of relationship */
	type: RelationType;
	/** The target model/resource name */
	target: string;
	/** Foreign key field in the current model (for belongsTo) */
	foreignKey?: string;
	/** Foreign key field in the target model (for hasOne/hasMany) */
	targetKey?: string;
	/** Junction table for many-to-many relationships */
	through?: string;
	/** Our key in the junction table */
	sourceKey?: string;
	/** Target key in the junction table */
	targetForeignKey?: string;
	/** Whether this relationship should be included by default */
	includeByDefault?: boolean;
	/** Maximum depth for nested inclusions */
	maxDepth?: number;
}

export interface CrudResourceConfig {
	/** Resource name (e.g., "product") */
	name: string;
	/** Zod validation schema */
	schema: ZodSchema;
	/** Custom table name (defaults to name) */
	tableName?: string;
	/** Relationship definitions */
	relationships?: Record<string, RelationshipConfig>;
	/** Enable/disable specific endpoints */
	endpoints?: {
		create?: boolean;
		read?: boolean;
		update?: boolean;
		delete?: boolean;
		list?: boolean;
	};
	/** Permission functions */
	permissions?: {
		create?: (context: CrudPermissionContext) => Promise<boolean> | boolean;
		read?: (context: CrudPermissionContext) => Promise<boolean> | boolean;
		update?: (context: CrudPermissionContext) => Promise<boolean> | boolean;
		delete?: (context: CrudPermissionContext) => Promise<boolean> | boolean;
		list?: (context: CrudPermissionContext) => Promise<boolean> | boolean;
	};
}

export interface CrudPermissionContext {
	/** Any user data (can be null for anonymous) */
	user?: any;
	/** Resource being accessed */
	resource: string;
	/** Operation being performed */
	operation: CrudOperation;
	/** Data being created/updated (for create/update operations) */
	data?: any;
	/** ID being accessed (for read/update/delete operations) */
	id?: string;
	/** Full request context */
	request?: any;
}

export interface CrudOptions {
	/** Array of resources to generate CRUD for */
	resources: CrudResourceConfig[];
	/** Database adapter configuration */
	database: CrudDatabaseConfig;
	/** Base path for all endpoints (optional) */
	basePath?: string;
	/** Global auth requirement (default: false) */
	requireAuth?: boolean;
	/** Custom middleware */
	middleware?: CrudMiddleware[];
}

export interface CrudDatabaseConfig {
	/** Database provider */
	provider: "sqlite" | "postgres" | "mysql";
	/** Database connection URL */
	url: string;
	/** Enable auto-migration */
	autoMigrate?: boolean;
}

export interface CrudMiddleware {
	/** Path pattern to match */
	path: string;
	/** Middleware function */
	handler: (context: any) => Promise<void> | void;
}

export interface CrudContext {
	/** Database instance */
	db: any;
	/** Database adapter */
	adapter: CrudAdapter;
	/** CRUD options */
	options: CrudOptions;
	/** Relationship registry for resolving relations */
	relationships: Map<string, Record<string, RelationshipConfig>>;
	/** Schema registry for field information */
	schemas: Map<string, { fields: Record<string, FieldAttribute> }>;
}

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
		where?: Array<{ field: string; value: any; operator?: string }>;
		include?: IncludeOptions;
	}): Promise<any | null>;

	/** Find multiple records */
	findMany(params: {
		model: string;
		where?: Array<{ field: string; value: any; operator?: string }>;
		limit?: number;
		offset?: number;
		orderBy?: Array<{ field: string; direction: "asc" | "desc" }>;
		include?: IncludeOptions;
	}): Promise<any[]>;

	/** Update a record */
	update(params: {
		model: string;
		where: Array<{ field: string; value: any; operator?: string }>;
		data: Record<string, any>;
		include?: IncludeOptions;
	}): Promise<any>;

	/** Delete a record */
	delete(params: {
		model: string;
		where: Array<{ field: string; value: any; operator?: string }>;
		cascade?: boolean;
	}): Promise<void>;

	/** Count records */
	count(params: {
		model: string;
		where?: Array<{ field: string; value: any; operator?: string }>;
	}): Promise<number>;

	/** Create records with related data atomically */
	createWithRelations(params: {
		model: string;
		data: Record<string, any>;
		relations?: Record<string, any>;
		include?: IncludeOptions;
	}): Promise<any>;

	/** Update records with related data atomically */
	updateWithRelations(params: {
		model: string;
		where: Array<{ field: string; value: any; operator?: string }>;
		data: Record<string, any>;
		relations?: Record<string, any>;
		include?: IncludeOptions;
	}): Promise<any>;

	/** Validate referential integrity */
	validateReferences(params: {
		model: string;
		data: Record<string, any>;
		operation: "create" | "update" | "delete";
	}): Promise<{ valid: boolean; errors: string[] }>;
}

export interface FieldAttribute {
	type: "string" | "number" | "boolean" | "date" | "json";
	required?: boolean;
	unique?: boolean;
	default?: any;
	length?: number;
	/** Reference to another model for foreign key relationships */
	references?: {
		/** The model to reference */
		model: string;
		/** The field on the referenced model */
		field: string;
		/** Action to perform when the reference is deleted */
		onDelete?: "cascade" | "restrict" | "set null" | "set default" | "no action";
		/** Action to perform when the reference is updated */
		onUpdate?: "cascade" | "restrict" | "set null" | "set default" | "no action";
	};
}

/** Options for including related data */
export interface IncludeOptions {
	/** Simple includes as array of relationship names */
	include?: string[];
	/** Advanced includes with nested options */
	select?: Record<string, IncludeOptions | boolean>;
	/** Maximum depth for nested includes (overrides resource config) */
	maxDepth?: number;
}

/** Basic pagination parameters */
export interface PaginationParams {
	page?: number;
	limit?: number;
	search?: string;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
}

/** Query parameters for list operations with relationships */
export interface CrudQueryParams extends PaginationParams {
	/** Include related data */
	include?: string[];
	/** Advanced select with nested includes */
	select?: Record<string, any>;
	/** Filter by related data */
	where?: Record<string, any>;
	/** Order by fields in current or related models */
	orderBy?: Array<{ field: string; direction: "asc" | "desc"; relation?: string }>;
}

export interface PaginationResult<T> {
	items: T[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
		hasNext: boolean;
		hasPrev: boolean;
	};
}

export type CrudEndpoint = Endpoint<any>;
