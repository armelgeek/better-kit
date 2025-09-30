import type { QueryResourceConfig } from "better-query";
import type { ZodSchema } from "zod";

/**
 * Generic component type that can be a React component or any other framework component
 */
export type ComponentType<P = any> = any;

/**
 * Generic React node type
 */
export type ReactNode = any;

/**
 * Admin-specific resource configuration extending Better Query's resource config
 */
export interface AdminResourceConfig extends QueryResourceConfig {
	/** Resource name for display (defaults to capitalized name) */
	label?: string;
	/** Plural form of the label */
	labelPlural?: string;
	/** Icon for the resource (can be a string identifier or component) */
	icon?: string | ComponentType;
	/** Description of the resource */
	description?: string;
	/** Whether to show this resource in the navigation menu */
	showInMenu?: boolean;
	/** Order in the navigation menu */
	menuOrder?: number;
	/** Custom route path (defaults to resource name) */
	routePath?: string;
	/** UI configuration for list view */
	list?: {
		/** Fields to display in the list */
		fields?: string[];
		/** Default sort field */
		defaultSort?: string;
		/** Default sort direction */
		defaultSortOrder?: "asc" | "desc";
		/** Number of items per page */
		perPage?: number;
		/** Fields to enable search on */
		searchFields?: string[];
		/** Enable bulk operations */
		bulkActions?: boolean;
		/** Custom list component */
		component?: ComponentType<any>;
	};
	/** UI configuration for show/detail view */
	show?: {
		/** Fields to display */
		fields?: string[];
		/** Custom show component */
		component?: ComponentType<any>;
	};
	/** UI configuration for create form */
	create?: {
		/** Fields to show in the form */
		fields?: string[];
		/** Custom create component */
		component?: ComponentType<any>;
		/** Initial values for the form */
		defaultValues?: Record<string, any>;
	};
	/** UI configuration for edit form */
	edit?: {
		/** Fields to show in the form */
		fields?: string[];
		/** Custom edit component */
		component?: ComponentType<any>;
	};
	/** Field metadata for UI generation */
	fieldMetadata?: Record<
		string,
		{
			/** Display label for the field */
			label?: string;
			/** Help text/description */
			description?: string;
			/** Input type for forms */
			inputType?:
				| "text"
				| "number"
				| "email"
				| "password"
				| "textarea"
				| "select"
				| "checkbox"
				| "date"
				| "datetime"
				| "file"
				| "richtext";
			/** Options for select inputs */
			options?: Array<{ label: string; value: string | number }>;
			/** Whether to show in list view */
			showInList?: boolean;
			/** Whether to show in detail view */
			showInShow?: boolean;
			/** Whether to include in forms */
			showInForm?: boolean;
			/** Custom formatter for display */
			formatter?: (value: any) => string;
		}
	>;
}

/**
 * Admin panel configuration
 */
export interface AdminConfig {
	/** Base path for admin routes (default: "/admin") */
	basePath?: string;
	/** Admin panel title */
	title?: string;
	/** Logo URL or component */
	logo?: string | ComponentType;
	/** Theme configuration */
	theme?: {
		/** Color scheme */
		colors?: {
			primary?: string;
			secondary?: string;
			background?: string;
			foreground?: string;
		};
		/** Default mode */
		defaultMode?: "light" | "dark" | "system";
		/** Enable mode toggle */
		enableModeToggle?: boolean;
	};
	/** Navigation configuration */
	navigation?: {
		/** Position of the navigation */
		position?: "left" | "top";
		/** Whether navigation is collapsible */
		collapsible?: boolean;
		/** Whether navigation is initially collapsed */
		defaultCollapsed?: boolean;
	};
	/** Authentication configuration */
	auth?: {
		/** Login route */
		loginRoute?: string;
		/** Logout route */
		logoutRoute?: string;
		/** Check if user is authenticated */
		checkAuth?: () => Promise<boolean>;
		/** Get current user info */
		getCurrentUser?: () => Promise<any>;
	};
	/** Dashboard configuration */
	dashboard?: {
		/** Enable dashboard */
		enabled?: boolean;
		/** Dashboard component */
		component?: ComponentType;
	};
	/** Custom pages */
	customPages?: Array<{
		/** Page title */
		title: string;
		/** Route path */
		path: string;
		/** Page component */
		component: ComponentType;
		/** Show in menu */
		showInMenu?: boolean;
		/** Menu icon */
		icon?: string | ComponentType;
	}>;
}

/**
 * Admin context type
 */
export interface AdminContext {
	/** Admin configuration */
	config: AdminConfig;
	/** Registered resources */
	resources: Map<string, AdminResourceConfig>;
	/** Better Query instance */
	query: any;
}

/**
 * Admin operation context for hooks and permissions
 */
export interface AdminOperationContext {
	/** Current user */
	user?: any;
	/** Resource being accessed */
	resource: string;
	/** Operation being performed */
	operation: "list" | "show" | "create" | "edit" | "delete";
	/** Data for the operation */
	data?: any;
	/** ID for show/edit/delete operations */
	id?: string;
}

/**
 * Admin list response
 */
export interface AdminListResponse<T = any> {
	/** List of items */
	data: T[];
	/** Total count */
	total: number;
	/** Current page */
	page: number;
	/** Items per page */
	perPage: number;
	/** Total pages */
	totalPages: number;
}

/**
 * Admin list params
 */
export interface AdminListParams {
	/** Current page */
	page?: number;
	/** Items per page */
	perPage?: number;
	/** Sort field */
	sortBy?: string;
	/** Sort order */
	sortOrder?: "asc" | "desc";
	/** Search query */
	search?: string;
	/** Filters */
	filters?: Record<string, any>;
}
