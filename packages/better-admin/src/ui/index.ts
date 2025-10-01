/**
 * Headless UI components for Better Admin
 * These are framework-agnostic, unstyled components that provide
 * functionality without imposing design choices
 */

/**
 * Generic component type
 */
type ComponentType<P = any> = any;

/**
 * Generic React node type
 */
type ReactNode = any;

export interface AdminLayoutProps {
	/** Navigation component */
	navigation?: ReactNode;
	/** Header component */
	header?: ReactNode;
	/** Main content */
	children: ReactNode;
	/** Footer component */
	footer?: ReactNode;
}

/**
 * Basic admin layout structure
 * Users should wrap this with their own styled components
 */
export function AdminLayout({
	navigation,
	header,
	children,
	footer,
}: AdminLayoutProps) {
	return {
		navigation,
		header,
		content: children,
		footer,
	};
}

export interface AdminListProps<T = any> {
	/** Data to display */
	data: T[];
	/** Column definitions */
	columns: Array<{
		key: string;
		label: string;
		render?: (item: T) => ReactNode;
	}>;
	/** Loading state */
	loading?: boolean;
	/** Error */
	error?: Error | null;
	/** Selection */
	selectable?: boolean;
	selectedIds?: string[];
	onSelect?: (ids: string[]) => void;
	/** Actions */
	onView?: (item: T) => void;
	onEdit?: (item: T) => void;
	onDelete?: (item: T) => void;
	/** Pagination */
	pagination?: {
		page: number;
		perPage: number;
		total: number;
		onPageChange: (page: number) => void;
		onPerPageChange: (perPage: number) => void;
	};
	/** Sorting */
	sorting?: {
		sortBy?: string;
		sortOrder?: "asc" | "desc";
		onSort: (field: string, order: "asc" | "desc") => void;
	};
	/** Search */
	searchable?: boolean;
	onSearch?: (query: string) => void;
}

/**
 * Data structure for list view
 * Returns a data structure that can be rendered by any UI framework
 */
export function createAdminListData<T = any>(props: AdminListProps<T>) {
	return {
		...props,
		type: "admin-list" as const,
	};
}

export interface AdminShowProps<T = any> {
	/** Data to display */
	data: T | null;
	/** Field definitions */
	fields: Array<{
		key: string;
		label: string;
		render?: (value: any, data: T) => ReactNode;
	}>;
	/** Loading state */
	loading?: boolean;
	/** Error */
	error?: Error | null;
	/** Actions */
	onEdit?: () => void;
	onDelete?: () => void;
	onBack?: () => void;
}

/**
 * Data structure for show/detail view
 */
export function createAdminShowData<T = any>(props: AdminShowProps<T>) {
	return {
		...props,
		type: "admin-show" as const,
	};
}

export interface AdminFormField {
	name: string;
	label: string;
	/** Input type - supports built-in types and custom types */
	type:
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
		| (string & {});
	required?: boolean;
	placeholder?: string;
	defaultValue?: any;
	options?: Array<{ label: string; value: string | number }>;
	validation?: any; // Zod schema
	/** Custom render function for the input (useful for custom input types) */
	renderInput?: (props: {
		value: any;
		onChange: (value: any) => void;
		error?: string;
		disabled?: boolean;
	}) => any;
}

export interface AdminFormProps {
	/** Form fields */
	fields: AdminFormField[];
	/** Initial values */
	initialValues?: Record<string, any>;
	/** Submit handler */
	onSubmit: (data: Record<string, any>) => Promise<void> | void;
	/** Cancel handler */
	onCancel?: () => void;
	/** Loading state */
	loading?: boolean;
	/** Error */
	error?: Error | null;
	/** Submit button text */
	submitText?: string;
	/** Cancel button text */
	cancelText?: string;
}

/**
 * Data structure for form
 */
export function createAdminFormData(props: AdminFormProps) {
	return {
		...props,
		type: "admin-form" as const,
	};
}

export interface AdminNavigationItem {
	label: string;
	path: string;
	icon?: string | ComponentType;
	active?: boolean;
	children?: AdminNavigationItem[];
}

export interface AdminNavigationProps {
	items: AdminNavigationItem[];
	onNavigate?: (path: string) => void;
	collapsible?: boolean;
	collapsed?: boolean;
	onToggleCollapse?: () => void;
}

/**
 * Data structure for navigation
 */
export function createAdminNavigationData(props: AdminNavigationProps) {
	return {
		...props,
		type: "admin-navigation" as const,
	};
}

export interface AdminPaginationProps {
	page: number;
	perPage: number;
	total: number;
	totalPages: number;
	onPageChange: (page: number) => void;
	onPerPageChange?: (perPage: number) => void;
}

/**
 * Data structure for pagination
 */
export function createAdminPaginationData(props: AdminPaginationProps) {
	return {
		...props,
		type: "admin-pagination" as const,
	};
}

export interface AdminSearchProps {
	value?: string;
	onChange: (value: string) => void;
	onSubmit?: () => void;
	placeholder?: string;
}

/**
 * Data structure for search
 */
export function createAdminSearchData(props: AdminSearchProps) {
	return {
		...props,
		type: "admin-search" as const,
	};
}

export interface AdminFilterProps {
	filters: Array<{
		name: string;
		label: string;
		type: "select" | "text" | "date" | "number";
		options?: Array<{ label: string; value: string | number }>;
		value?: any;
	}>;
	values: Record<string, any>;
	onChange: (name: string, value: any) => void;
	onApply?: () => void;
	onReset?: () => void;
}

/**
 * Data structure for filters
 */
export function createAdminFilterData(props: AdminFilterProps) {
	return {
		...props,
		type: "admin-filter" as const,
	};
}
