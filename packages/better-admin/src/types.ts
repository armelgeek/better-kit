export interface ComponentMetadata {
	name: string;
	type: "components:ui";
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
}

export interface ComponentFile {
	path: string;
	content: string;
	type: "components:ui";
}

export interface BetterAdminConfig {
	$schema?: string;
	style?: string;
	rsc?: boolean;
	tsx?: boolean;
	tailwind?: {
		config?: string;
		css?: string;
		baseColor?: string;
		cssVariables?: boolean;
	};
	aliases?: {
		components?: string;
		utils?: string;
		ui?: string;
	};
	registry?: string;
}

export interface Registry {
	components: ComponentMetadata[];
}
