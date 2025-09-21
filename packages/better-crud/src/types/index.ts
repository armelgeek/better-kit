import { Endpoint } from "better-call";
import { ZodSchema, z } from "zod";
import { CrudAdapter } from "./adapter";
import { Plugin } from "./plugins";

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
	/** Scoped permissions for advanced access control */
	scopes?: {
		create?: string[];
		read?: string[];
		update?: string[];
		delete?: string[];
		list?: string[];
	};
	/** Ownership fields for row-level security */
	ownership?: {
		field: string; // e.g., "userId", "createdBy"
		strategy: "strict" | "flexible"; // strict: exact match, flexible: allow admins
	};
	/** Lifecycle hooks */
	hooks?: {
		onCreate?: (context: CrudHookContext) => Promise<void> | void;
		onUpdate?: (context: CrudHookContext) => Promise<void> | void;
		onDelete?: (context: CrudHookContext) => Promise<void> | void;
		afterCreate?: (context: CrudHookContext) => Promise<void> | void;
		afterUpdate?: (context: CrudHookContext) => Promise<void> | void;
		afterDelete?: (context: CrudHookContext) => Promise<void> | void;
	};
	/** Input sanitization rules */
	sanitization?: {
		fields?: Record<string, SanitizationRule[]>;
		global?: SanitizationRule[];
	};
	/** Search configuration */
	search?: {
		fields: string[]; // Fields to search in
		strategy: "contains" | "startsWith" | "exact" | "fuzzy";
		caseSensitive?: boolean;
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
	/** User scopes/roles */
	scopes?: string[];
	/** Existing data (for update/delete operations) */
	existingData?: any;
}

export interface CrudHookContext {
	/** User performing the operation */
	user?: any;
	/** Resource being accessed */
	resource: string;
	/** Operation being performed */
	operation: CrudOperation;
	/** Data being created/updated */
	data?: any;
	/** ID being accessed (for read/update/delete operations) */
	id?: string;
	/** Existing data before operation (for update/delete) */
	existingData?: any;
	/** Result after operation (for after hooks) */
	result?: any;
	/** Request context */
	request?: any;
	/** Adapter instance for custom queries - can be extended with context */
	adapter: CrudAdapter & { context?: any };
}

export interface SanitizationRule {
	type: "trim" | "escape" | "lowercase" | "uppercase" | "strip" | "custom";
	options?: any;
	customFn?: (value: any) => any;
}

export interface UserScope {
	name: string;
	permissions: string[];
}

export interface CrudOptions {
	/** Array of resources to generate CRUD for */
	resources: CrudResourceConfig[];
	/** Database adapter configuration */
	database: CrudDatabaseOptions;
	/** Base path for all endpoints (optional) */
	basePath?: string;
	/** Global auth requirement (default: false) */
	requireAuth?: boolean;
	/** Custom middleware */
	middleware?: CrudMiddleware[];
	/** Plugins to enable */
	plugins?: Plugin[];
	/** Global security settings */
	security?: {
		/** Rate limiting configuration */
		rateLimit?: {
			windowMs: number; // time window in milliseconds
			max: number; // max requests per window
		};
		/** CORS settings */
		cors?: {
			origin: string | string[];
			credentials?: boolean;
		};
		/** Global input sanitization */
		sanitization?: {
			enabled: boolean;
			rules: SanitizationRule[];
		};
		/** Global permission checks */
		globalPermissions?: (context: CrudPermissionContext) => Promise<boolean> | boolean;
	};
	/** Audit logging configuration */
	audit?: {
		enabled: boolean;
		logOperations?: CrudOperation[];
		auditLogger?: (event: AuditEvent) => Promise<void> | void;
	};
}

export interface CrudDatabaseConfig {
	/** Database provider */
	provider: "sqlite" | "postgres" | "mysql";
	/** Database connection URL */
	url: string;
	/** Enable auto-migration */
	autoMigrate?: boolean;
}

/**
 * Database configuration can be either a provider config or a direct adapter
 */
export type CrudDatabaseOptions = CrudDatabaseConfig | { adapter: CrudAdapter };

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
	/** Plugin manager instance */
	pluginManager?: any;
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
	/** Filter by related data and advanced conditions */
	where?: Record<string, any>;
	/** Order by fields in current or related models */
	orderBy?: Array<{ field: string; direction: "asc" | "desc"; relation?: string }>;
	/** Advanced search query */
	q?: string;
	/** Search in specific fields */
	searchFields?: string[];
	/** Filter operators for advanced filtering */
	filters?: Record<string, {
		operator: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in" | "notin" | "like" | "ilike" | "between";
		value: any;
	}>;
	/** Date range filters */
	dateRange?: {
		field: string;
		start?: string;
		end?: string;
	};
}

export interface AuditEvent {
	/** Timestamp of the event */
	timestamp: Date;
	/** User who performed the action */
	user?: any;
	/** Resource affected */
	resource: string;
	/** Operation performed */
	operation: CrudOperation;
	/** ID of the affected record */
	recordId?: string;
	/** Data before the operation (for updates/deletes) */
	dataBefore?: any;
	/** Data after the operation (for creates/updates) */
	dataAfter?: any;
	/** IP address of the request */
	ipAddress?: string;
	/** User agent of the request */
	userAgent?: string;
	/** Additional metadata */
	metadata?: Record<string, any>;
}

export interface SecurityContext {
	/** Current user */
	user?: any;
	/** User scopes/roles */
	scopes?: string[];
	/** Request IP address */
	ipAddress?: string;
	/** Request user agent */
	userAgent?: string;
	/** Session information */
	session?: any;
	/** Rate limiting configuration */
	rateLimit?: {
		windowMs: number;
		max: number;
	};
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
