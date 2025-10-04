/**
 * Component template generator
 * Helps create new components for the registry
 */

import type {
	ComponentMetadata,
	ComponentCategory,
	BetterQueryIntegration,
} from "../types.js";

export interface ComponentTemplate {
	name: string;
	category: string;
	description: string;
	dependencies?: {
		shadcn?: string[];
		npm?: string[];
	};
	betterQuery?: BetterQueryIntegration;
	componentCode: string;
}

/**
 * Generate component metadata from template
 */
export function generateComponentMetadata(
	template: ComponentTemplate,
): ComponentMetadata {
	return {
		name: template.name,
		type: "components:ui",
		category: template.category,
		description: template.description,
		dependencies: template.dependencies || {},
		registryDependencies: [],
		files: [
			{
				path: `components/ui/${template.name}.tsx`,
				content: template.componentCode,
				type: "components:ui",
			},
		],
		tailwind: {
			config: {},
		},
		betterQuery: template.betterQuery,
	};
}

/**
 * Validate template structure
 */
export function validateTemplate(template: unknown): template is ComponentTemplate {
	if (!template || typeof template !== "object") return false;

	const t = template as Partial<ComponentTemplate>;

	return !!(
		t.name &&
		t.category &&
		t.description &&
		t.componentCode
	);
}

/**
 * Common component templates
 */
export const COMPONENT_TEMPLATES = {
	"data-display": {
		description: "Template for data display components",
		requiredProps: ["data", "columns", "renderItem"],
		betterQueryOps: ["list"],
		example: `
interface DataDisplayProps<T> {
  data: T[];
  isLoading?: boolean;
  error?: Error;
}

export function ComponentName<T>({ data, isLoading, error }: DataDisplayProps<T>) {
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data || data.length === 0) return <div>No data</div>;
  
  return (
    <div>
      {/* Your component implementation */}
    </div>
  );
}
`,
	},
	"form": {
		description: "Template for form components",
		requiredProps: ["fields", "onSubmit", "defaultValues"],
		betterQueryOps: ["create", "update"],
		example: `
interface FormProps {
  fields: Field[];
  onSubmit: (data: any) => void | Promise<void>;
  defaultValues?: Record<string, any>;
  isLoading?: boolean;
}

export function ComponentName({ fields, onSubmit, defaultValues, isLoading }: FormProps) {
  // Form implementation with validation
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Your form fields */}
    </form>
  );
}
`,
	},
	"action": {
		description: "Template for action components",
		requiredProps: ["onClick", "label"],
		betterQueryOps: ["delete", "update"],
		example: `
interface ActionProps {
  onClick: () => void | Promise<void>;
  label: string;
  variant?: "default" | "destructive";
  isLoading?: boolean;
}

export function ComponentName({ onClick, label, variant, isLoading }: ActionProps) {
  return (
    <button onClick={onClick} disabled={isLoading}>
      {isLoading ? "Loading..." : label}
    </button>
  );
}
`,
	},
};

/**
 * Generate component skeleton
 */
export function generateComponentSkeleton(
	name: string,
	category: string,
	templateType: keyof typeof COMPONENT_TEMPLATES,
): string {
	const template = COMPONENT_TEMPLATES[templateType];

	return `"use client";

/**
 * ${name}
 * Category: ${category}
 * 
 * ${template.description}
 * Required props: ${template.requiredProps.join(", ")}
 * Better Query operations: ${template.betterQueryOps.join(", ")}
 */

import * as React from "react";

${template.example}
`;
}
