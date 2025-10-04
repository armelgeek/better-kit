import { Command } from "commander";
import prompts from "prompts";
import chalk from "chalk";
import ora from "ora";
import { configExists, getDefaultConfig, writeConfig } from "../utils/config.js";
import { isShadcnInstalled } from "../utils/installer.js";

export const initCommand = new Command("init")
	.description("Initialize Better Admin in your project")
	.option("--yes", "Skip prompts and use default configuration")
	.action(async (options) => {
		console.log(chalk.bold("\n🚀 Initializing Better Admin...\n"));

		try {
			const cwd = process.cwd();

			// Check if config already exists
			if (await configExists(cwd)) {
				const { overwrite } = await prompts({
					type: "confirm",
					name: "overwrite",
					message: "Configuration already exists. Overwrite?",
					initial: false,
				});

				if (!overwrite) {
					console.log(chalk.yellow("\n✋ Initialization cancelled."));
					return;
				}
			}

			let config = getDefaultConfig();

			if (!options.yes) {
				// Ask for configuration
				const answers = await prompts([
					{
						type: "select",
						name: "style",
						message: "Which style would you like to use?",
						choices: [
							{ title: "Default", value: "default" },
							{ title: "New York", value: "new-york" },
						],
						initial: 0,
					},
					{
						type: "confirm",
						name: "tsx",
						message: "Would you like to use TypeScript?",
						initial: true,
					},
					{
						type: "confirm",
						name: "rsc",
						message: "Are you using React Server Components?",
						initial: false,
					},
					{
						type: "text",
						name: "componentsAlias",
						message: "Configure the import alias for components:",
						initial: "@/components",
					},
					{
						type: "text",
						name: "utilsAlias",
						message: "Configure the import alias for utils:",
						initial: "@/lib/utils",
					},
				]);

				// Update config with user choices
				config.style = answers.style;
				config.tsx = answers.tsx;
				config.rsc = answers.rsc;
				if (config.aliases) {
					config.aliases.components = answers.componentsAlias;
					config.aliases.utils = answers.utilsAlias;
				}
			}

			// Write config
			const spinner = ora("Writing configuration...").start();
			await writeConfig(config, cwd);
			spinner.succeed(chalk.green("Configuration written to better-admin.json"));

			// Check if shadcn is installed
			const shadcnInstalled = await isShadcnInstalled(cwd);
			
			console.log("\n" + chalk.bold("✅ Better Admin initialized successfully!\n"));
			
			if (!shadcnInstalled) {
				console.log(chalk.yellow("⚠️  shadcn/ui doesn't seem to be installed."));
				console.log(chalk.dim("   When you add components, shadcn/ui components will be installed automatically.\n"));
			}

			console.log(chalk.bold("📦 Next steps:\n"));
			console.log("  1. Add your first component:");
			console.log(chalk.cyan("     npx better-admin add data-table\n"));
			console.log("  2. List available components:");
			console.log(chalk.cyan("     npx better-admin list\n"));

		} catch (error) {
			console.error(chalk.red("\n❌ Failed to initialize Better Admin"));
			console.error(error);
			process.exit(1);
		}
	});
