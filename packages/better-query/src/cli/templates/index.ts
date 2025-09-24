import fs from "fs/promises";
import path from "path";
import { ensureDir, writeFile } from "../utils/fs.js";
import { nextjsTemplate } from "./nextjs/index.js";

export interface ProjectConfig {
	framework: string;
	database: string;
	withAuth: boolean;
	typescript: boolean;
	targetDir: string;
}

class TemplateManager {
	async generateProject(config: ProjectConfig): Promise<void> {
		switch (config.framework) {
			case "nextjs":
				await nextjsTemplate.generate(config);
				break;
			case "express":
				await this.generateExpress(config);
				break;
			case "hono":
				await this.generateHono(config);
				break;
			default:
				throw new Error(`Unknown framework: ${config.framework}`);
		}
	}
	
	private async generateExpress(config: ProjectConfig): Promise<void> {
		// TODO: Implement Express template
		console.log("Express template not yet implemented");
	}
	
	private async generateHono(config: ProjectConfig): Promise<void> {
		// TODO: Implement Hono template
		console.log("Hono template not yet implemented");
	}
}

export const templateManager = new TemplateManager();