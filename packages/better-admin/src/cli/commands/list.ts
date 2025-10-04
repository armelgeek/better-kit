import chalk from "chalk";
import { Command } from "commander";
import ora from "ora";
import { configExists, readConfig } from "../utils/config.js";
import { fetchRegistry, getComponentsList } from "../utils/registry.js";

export const listCommand = new Command("list")
	.description("List all available components")
	.action(async () => {
		console.log(chalk.bold("\n📋 Available Better Admin components:\n"));

		try {
			const cwd = process.cwd();

			// Read config if exists
			let registryUrl =
				"https://raw.githubusercontent.com/armelgeek/better-kit/master/packages/better-admin/registry";

			if (await configExists(cwd)) {
				const config = await readConfig(cwd);
				if (config?.registry) {
					registryUrl = config.registry;
				}
			}

			// Fetch registry
			const spinner = ora("Fetching component registry...").start();

			try {
				const registry = await fetchRegistry(registryUrl);
				spinner.succeed(chalk.green("Registry fetched"));

				if (registry.components.length === 0) {
					console.log(chalk.yellow("\nNo components available yet.\n"));
					return;
				}

				console.log();
				for (const component of registry.components) {
					console.log(chalk.cyan(`  • ${component.name}`));
					if (component.description) {
						console.log(chalk.dim(`    ${component.description}`));
					}
					if (
						component.dependencies?.shadcn &&
						component.dependencies.shadcn.length > 0
					) {
						console.log(
							chalk.dim(
								`    Dependencies: ${component.dependencies.shadcn.join(", ")}`,
							),
						);
					}
					console.log();
				}

				console.log(chalk.bold("💡 Usage:\n"));
				console.log(chalk.dim("   npx better-admin add <component-name>\n"));
			} catch (error) {
				spinner.fail(chalk.red("Failed to fetch registry"));
				throw error;
			}
		} catch (error) {
			console.error(chalk.red("\n❌ Failed to list components"));
			console.error(error);
			process.exit(1);
		}
	});
