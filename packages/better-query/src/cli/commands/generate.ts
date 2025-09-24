import { Command } from "commander";
import fs from "fs/promises";
import path from "path";
import { generateTypes } from "../utils/type-generator.js";

export const generateCommand = new Command("generate")
	.alias("gen")
	.description("Generate TypeScript types from Better Query configuration")
	.option("--config <path>", "Path to Better Query config file", "./lib/query.ts")
	.option("--output <path>", "Output file for generated types", "./types/generated.ts")
	.option("--watch", "Watch for changes and regenerate types")
	.action(async (options) => {
		console.log("🔄 Generating TypeScript types...");
		
		try {
			const configPath = path.resolve(process.cwd(), options.config);
			const outputPath = path.resolve(process.cwd(), options.output);
			
			// Generate types
			const generatedTypes = await generateTypes(configPath);
			
			// Ensure output directory exists
			const outputDir = path.dirname(outputPath);
			await fs.mkdir(outputDir, { recursive: true });
			
			// Write generated types
			await fs.writeFile(outputPath, generatedTypes, "utf8");
			
			console.log(`✅ Types generated at ${outputPath}`);
			
			if (options.watch) {
				console.log("👀 Watching for changes...");
				// TODO: Implement file watching
			}
			
		} catch (error) {
			console.error("❌ Failed to generate types");
			console.error(error);
			process.exit(1);
		}
	});