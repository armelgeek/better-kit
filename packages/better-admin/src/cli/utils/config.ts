import fs from "fs-extra";
import path from "path";
import type { BetterAdminConfig } from "../types.js";

const CONFIG_FILE = "better-admin.json";

export async function configExists(cwd: string = process.cwd()): Promise<boolean> {
	const configPath = path.join(cwd, CONFIG_FILE);
	return fs.pathExists(configPath);
}

export async function readConfig(cwd: string = process.cwd()): Promise<BetterAdminConfig | null> {
	const configPath = path.join(cwd, CONFIG_FILE);
	
	if (!(await fs.pathExists(configPath))) {
		return null;
	}

	try {
		const content = await fs.readFile(configPath, "utf8");
		return JSON.parse(content);
	} catch (error) {
		console.error("Failed to read config file:", error);
		return null;
	}
}

export async function writeConfig(config: BetterAdminConfig, cwd: string = process.cwd()): Promise<void> {
	const configPath = path.join(cwd, CONFIG_FILE);
	await fs.writeJson(configPath, config, { spaces: 2 });
}

export function getDefaultConfig(): BetterAdminConfig {
	return {
		$schema: "https://better-admin.dev/schema.json",
		style: "default",
		rsc: false,
		tsx: true,
		tailwind: {
			config: "tailwind.config.js",
			css: "src/app/globals.css",
			baseColor: "slate",
			cssVariables: true,
		},
		aliases: {
			components: "@/components",
			utils: "@/lib/utils",
			ui: "@/components/ui",
		},
		registry: "https://raw.githubusercontent.com/armelgeek/better-kit/master/packages/better-admin/registry",
	};
}
