import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import path from "path";
import fs from "fs-extra";
import { configExists, readConfig } from "../utils/config.js";
import { fetchComponent } from "../utils/registry.js";
import {
	detectPackageManager,
	installDependencies,
	installShadcnComponents,
} from "../utils/installer.js";
import type { ComponentMetadata } from "../../types.js";

export const addCommand = new Command("add")
	.description("Add a component to your project")
	.argument("<component>", "Name of the component to add")
	.option("--yes", "Skip confirmation prompts")
	.option("--overwrite", "Overwrite existing files")
	.option("--path <path>", "Custom path for the component")
	.action(async (componentName: string, options) => {
		console.log(chalk.bold(`\n📦 Adding ${componentName}...\n`));

		try {
			const cwd = process.cwd();

			// Check if config exists
			if (!(await configExists(cwd))) {
				console.log(chalk.yellow("⚠️  Better Admin is not initialized in this project."));
				console.log(chalk.dim("   Run: npx better-admin init\n"));
				process.exit(1);
			}

			// Read config
			const config = await readConfig(cwd);
			if (!config) {
				throw new Error("Failed to read configuration");
			}

			// Fetch component metadata
			const spinner = ora("Fetching component metadata...").start();
			let component: ComponentMetadata;
			
			try {
				const registryUrl = config.registry || "https://raw.githubusercontent.com/armelgeek/better-kit/master/packages/better-admin/registry";
				component = await fetchComponent(registryUrl, componentName);
				spinner.succeed(chalk.green("Component metadata fetched"));
			} catch (error) {
				spinner.fail(chalk.red("Failed to fetch component"));
				throw error;
			}

			// Install shadcn dependencies
			if (component.dependencies?.shadcn && component.dependencies.shadcn.length > 0) {
				console.log(chalk.bold("\n📥 Installing shadcn/ui dependencies...\n"));
				const shadcnSpinner = ora(`Installing: ${component.dependencies.shadcn.join(", ")}`).start();
				
				try {
					await installShadcnComponents(component.dependencies.shadcn, cwd);
					shadcnSpinner.succeed(chalk.green("shadcn/ui components installed"));
				} catch (error) {
					shadcnSpinner.fail(chalk.red("Failed to install shadcn/ui components"));
					throw error;
				}
			}

			// Install npm dependencies
			if (component.dependencies?.npm && component.dependencies.npm.length > 0) {
				console.log(chalk.bold("\n📥 Installing npm dependencies...\n"));
				const packageManager = await detectPackageManager(cwd);
				const npmSpinner = ora(`Installing: ${component.dependencies.npm.join(", ")}`).start();
				
				try {
					await installDependencies(component.dependencies.npm, packageManager, cwd);
					npmSpinner.succeed(chalk.green("npm dependencies installed"));
				} catch (error) {
					npmSpinner.fail(chalk.red("Failed to install npm dependencies"));
					throw error;
				}
			}

			// Copy component files
			console.log(chalk.bold("\n📝 Copying component files...\n"));
			
			for (const file of component.files) {
				const targetPath = options.path 
					? path.join(cwd, options.path, path.basename(file.path))
					: path.join(cwd, file.path);

				// Check if file exists
				if (await fs.pathExists(targetPath) && !options.overwrite) {
					console.log(chalk.yellow(`⚠️  ${file.path} already exists (use --overwrite to replace)`));
					continue;
				}

				// Ensure directory exists
				await fs.ensureDir(path.dirname(targetPath));

				// Write file
				await fs.writeFile(targetPath, file.content, "utf8");
				console.log(chalk.green(`✓ ${file.path}`));
			}

			console.log(chalk.bold(`\n✅ Successfully added ${componentName}!\n`));

		} catch (error) {
			console.error(chalk.red("\n❌ Failed to add component"));
			console.error(error);
			process.exit(1);
		}
	});
