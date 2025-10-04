// Re-export registry types
export type {
	ComponentMetadata,
	ComponentFile,
	Registry,
	ComponentCategory,
	BetterQueryIntegration,
} from "./registry/index.js";

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
