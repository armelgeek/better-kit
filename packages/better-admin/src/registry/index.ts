/**
 * Registry system for better-admin components
 * Provides a structured way to manage component metadata with categories
 */

export interface ComponentCategory {
	id: string;
	name: string;
	description: string;
}

export interface BetterQueryIntegration {
	/** Hook used from better-query */
	hook?: string;
	/** Example usage with better-query */
	example?: string;
	/** Required better-query operations */
	operations?: Array<"list" | "get" | "create" | "update" | "delete">;
}

export interface ComponentMetadata {
	name: string;
	type: "components:ui";
	category: string;
	description: string;
	dependencies: {
		shadcn?: string[];
		npm?: string[];
	};
	registryDependencies?: string[];
	files: ComponentFile[];
	tailwind?: {
		config?: Record<string, any>;
	};
	/** Better Query integration details */
	betterQuery?: BetterQueryIntegration;
}

export interface ComponentFile {
	path: string;
	content: string;
	type: "components:ui";
}

export interface Registry {
	version: string;
	categories: ComponentCategory[];
	components: ComponentMetadata[];
}

/**
 * Component categories for organization
 */
export const COMPONENT_CATEGORIES: ComponentCategory[] = [
	{
		id: "data-display",
		name: "Data Display",
		description: "Components for displaying data from better-query",
	},
	{
		id: "forms",
		name: "Forms",
		description: "Form components with validation and better-query mutations",
	},
	{
		id: "layout",
		name: "Layout",
		description: "Layout components for admin interfaces",
	},
	{
		id: "feedback",
		name: "Feedback",
		description: "Loading states, notifications, and error handling",
	},
	{
		id: "buttons",
		name: "Buttons",
		description: "Action buttons for common operations",
	},
	{
		id: "fields",
		name: "Fields",
		description: "Field components for displaying and editing data",
	},
	{
		id: "views",
		name: "Views",
		description: "Auto-generated view components",
	},
	{
		id: "auth",
		name: "Authentication",
		description: "Authentication and login components",
	},
	{
		id: "ui",
		name: "UI Components",
		description: "Common UI components and utilities",
	},
	{
		id: "toolbars",
		name: "Toolbars",
		description: "Toolbar and action bar components",
	},
];

/**
 * Validates component metadata structure
 */
export function validateComponentMetadata(
	metadata: unknown,
): metadata is ComponentMetadata {
	if (!metadata || typeof metadata !== "object") return false;

	const meta = metadata as Partial<ComponentMetadata>;

	return !!(
		meta.name &&
		meta.type === "components:ui" &&
		meta.category &&
		meta.description &&
		meta.files &&
		Array.isArray(meta.files) &&
		meta.files.length > 0
	);
}

/**
 * Gets components by category
 */
export function getComponentsByCategory(
	registry: Registry,
	categoryId: string,
): ComponentMetadata[] {
	return registry.components.filter((c) => c.category === categoryId);
}

/**
 * Gets components that integrate with better-query
 */
export function getBetterQueryComponents(
	registry: Registry,
): ComponentMetadata[] {
	return registry.components.filter((c) => c.betterQuery);
}
