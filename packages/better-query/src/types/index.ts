import { Endpoint } from "better-call";
import { ZodSchema, z } from "zod";
import { QueryAdapter } from "./adapter";
import { Plugin } from "./plugins";

export type QueryOperation = "create" | "read" | "update" | "delete" | "list";

// Legacy alias
export type CrudOperation = QueryOperation;

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

export interface QueryResourceConfig {
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
	/** Custom endpoints for the resource */
	customEndpoints?: Record<string, Endpoint>;
	/** Permission functions */
	permissions?: {
		create?: (context: QueryPermissionContext) => Promise<boolean> | boolean;
		read?: (context: QueryPermissionContext) => Promise<boolean> | boolean;
		update?: (context: QueryPermissionContext) => Promise<boolean> | boolean;
		delete?: (context: QueryPermissionContext) => Promise<boolean> | boolean;
		list?: (context: QueryPermissionContext) => Promise<boolean> | boolean;
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
		// Before hooks (support both naming conventions)
		onCreate?: (context: QueryHookContext) => Promise<void> | void;
		onUpdate?: (context: QueryHookContext) => Promise<void> | void;
		onDelete?: (context: QueryHookContext) => Promise<void> | void;
		beforeCreate?: (context: QueryHookContext) => Promise<void> | void;
		beforeUpdate?: (context: QueryHookContext) => Promise<void> | void;
		beforeDelete?: (context: QueryHookContext) => Promise<void> | void;
		beforeRead?: (context: QueryHookContext) => Promise<void> | void;
		beforeList?: (context: QueryHookContext) => Promise<void> | void;
		// After hooks
		afterCreate?: (context: QueryHookContext) => Promise<void> | void;
		afterUpdate?: (context: QueryHookContext) => Promise<void> | void;
		afterDelete?: (context: QueryHookContext) => Promise<void> | void;
		afterRead?: (context: QueryHookContext) => Promise<void> | void;
		afterList?: (context: QueryHookContext) => Promise<void> | void;
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

// Legacy alias
export type CrudResourceConfig = QueryResourceConfig;

export interface QueryPermissionContext {
	/** Any user data (can be null for anonymous) */
	user?: any;
	/** Resource being accessed */
	resource: string;
	/** Operation being performed */
	operation: QueryOperation;
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

// Legacy alias
export type CrudPermissionContext = QueryPermissionContext;

export interface QueryHookContext {
	/** User performing the operation */
	user?: any;
	/** Resource being accessed */
	resource: string;
	/** Operation being performed */
	operation: QueryOperation;
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
	adapter: QueryAdapter & { context?: any };
}

// Legacy alias
export type CrudHookContext = QueryHookContext;

export interface SanitizationRule {
	type: "trim" | "escape" | "lowercase" | "uppercase" | "strip" | "custom";
	options?: any;
	customFn?: (value: any) => any;
}

export interface UserScope {
	name: string;
	permissions: string[];
}

export interface QueryOptions {
	/** Array of resources to generate operations for */
	resources: QueryResourceConfig[];
	/** Database adapter configuration */
	database: QueryDatabaseOptions;
	/** Base path for all endpoints (optional) */
	basePath?: string;
	/** Global auth requirement (default: false) */
	requireAuth?: boolean;
	/** Custom middleware */
	middleware?: QueryMiddleware[];
	/** Plugins to enable */
	plugins?: Plugin[];
	/** Global lifecycle hooks that apply to all resources */
	hooks?: {
		// Before hooks (support both naming conventions)
		onCreate?: (context: QueryHookContext) => Promise<void> | void;
		onUpdate?: (context: QueryHookContext) => Promise<void> | void;
		onDelete?: (context: QueryHookContext) => Promise<void> | void;
		beforeCreate?: (context: QueryHookContext) => Promise<void> | void;
		beforeUpdate?: (context: QueryHookContext) => Promise<void> | void;
		beforeDelete?: (context: QueryHookContext) => Promise<void> | void;
		beforeRead?: (context: QueryHookContext) => Promise<void> | void;
		beforeList?: (context: QueryHookContext) => Promise<void> | void;
		// After hooks
		afterCreate?: (context: QueryHookContext) => Promise<void> | void;
		afterUpdate?: (context: QueryHookContext) => Promise<void> | void;
		afterDelete?: (context: QueryHookContext) => Promise<void> | void;
		afterRead?: (context: QueryHookContext) => Promise<void> | void;
		afterList?: (context: QueryHookContext) => Promise<void> | void;
	};
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
		globalPermissions?: (context: QueryPermissionContext) => Promise<boolean> | boolean;
	};
	/** Audit logging configuration */
	audit?: {
		enabled: boolean;
		logOperations?: QueryOperation[];
		auditLogger?: (event: AuditEvent) => Promise<void> | void;
	};
}

// Legacy alias
export type CrudOptions = QueryOptions;

export interface QueryDatabaseConfig {
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
export type QueryDatabaseOptions = QueryDatabaseConfig | { adapter: QueryAdapter };

// Legacy aliases
export type CrudDatabaseConfig = QueryDatabaseConfig;
export type CrudDatabaseOptions = QueryDatabaseOptions;

export interface QueryMiddleware {
	/** Path pattern to match */
	path: string;
	/** Middleware function */
	handler: (context: any) => Promise<void> | void;
}

// Legacy alias
export type CrudMiddleware = QueryMiddleware;

export interface QueryContext {
	/** Database instance */
	db: any;
	/** Database adapter */
	adapter: QueryAdapter;
	/** Query options */
	options: QueryOptions;
	/** Relationship registry for resolving relations */
	relationships: Map<string, Record<string, RelationshipConfig>>;
	/** Schema registry for field information */
	schemas: Map<string, { fields: Record<string, FieldAttribute> }>;
	/** Plugin manager instance */
	pluginManager?: any;
}

// Legacy alias
export type CrudContext = QueryContext;

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
export interface QueryParams extends PaginationParams {
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

// Legacy alias
export type CrudQueryParams = QueryParams;

export interface AuditEvent {
	/** Timestamp of the event */
	timestamp: Date;
	/** User who performed the action */
	user?: any;
	/** Resource affected */
	resource: string;
	/** Operation performed */
	operation: QueryOperation;
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

export type QueryEndpoint = Endpoint<any>;

// Legacy alias
export type CrudEndpoint = QueryEndpoint;
