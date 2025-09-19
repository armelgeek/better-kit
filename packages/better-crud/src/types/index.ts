import { Endpoint } from "better-call";
import { ZodSchema, z } from "zod";

export type CrudOperation = "create" | "read" | "update" | "delete" | "list";

export interface CrudResourceConfig {
	/** Resource name (e.g., "product") */
	name: string;
	/** Zod validation schema */
	schema: ZodSchema;
	/** Custom table name (defaults to name) */
	tableName?: string;
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
}

export interface CrudAdapter {
	/** Create a new record */
	create(params: {
		model: string;
		data: Record<string, any>;
	}): Promise<any>;

	/** Find a single record */
	findFirst(params: {
		model: string;
		where?: Array<{ field: string; value: any; operator?: string }>;
	}): Promise<any | null>;

	/** Find multiple records */
	findMany(params: {
		model: string;
		where?: Array<{ field: string; value: any; operator?: string }>;
		limit?: number;
		offset?: number;
		orderBy?: Array<{ field: string; direction: "asc" | "desc" }>;
	}): Promise<any[]>;

	/** Update a record */
	update(params: {
		model: string;
		where: Array<{ field: string; value: any; operator?: string }>;
		data: Record<string, any>;
	}): Promise<any>;

	/** Delete a record */
	delete(params: {
		model: string;
		where: Array<{ field: string; value: any; operator?: string }>;
	}): Promise<void>;

	/** Count records */
	count(params: {
		model: string;
		where?: Array<{ field: string; value: any; operator?: string }>;
	}): Promise<number>;
}

export interface FieldAttribute {
	type: "string" | "number" | "boolean" | "date" | "json";
	required?: boolean;
	unique?: boolean;
	default?: any;
	length?: number;
}

export interface PaginationParams {
	page?: number;
	limit?: number;
	search?: string;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
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
