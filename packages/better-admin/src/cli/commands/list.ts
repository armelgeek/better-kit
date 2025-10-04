import chalk from "chalk";
import { Command } from "commander";
import ora from "ora";
import { configExists, readConfig } from "../utils/config.js";
import { fetchRegistry, getComponentsList } from "../utils/registry.js";
import type { Registry } from "../../types.js";

export const listCommand = new Command("list")
	.description("List all available components")
	.option("--category <category>", "Filter by category")
	.option("--with-query", "Show only components with better-query integration")
	.action(async (options) => {
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
				const registry: Registry = await fetchRegistry(registryUrl);
				spinner.succeed(chalk.green("Registry fetched"));

				if (registry.components.length === 0) {
					console.log(chalk.yellow("\nNo components available yet.\n"));
					return;
				}

				// Group components by category if categories exist
				if (registry.categories && registry.categories.length > 0) {
					const categoriesToShow = options.category
						? registry.categories.filter((c) => c.id === options.category)
						: registry.categories;

					for (const category of categoriesToShow) {
						const categoryComponents = registry.components.filter(
							(c) => c.category === category.id,
						);

						// Filter by better-query if requested
						const componentsToShow = options.withQuery
							? categoryComponents.filter((c) => c.betterQuery)
							: categoryComponents;

						if (componentsToShow.length === 0) continue;

						console.log(chalk.bold.cyan(`\n${category.name}`));
						console.log(chalk.dim(`  ${category.description}\n`));

						for (const component of componentsToShow) {
							console.log(chalk.cyan(`  • ${component.name}`));
							if (component.description) {
								console.log(chalk.dim(`    ${component.description}`));
							}
							if (component.betterQuery) {
								console.log(
									chalk.green(
										`    ✓ Better Query: ${component.betterQuery.operations?.join(", ") || "integrated"}`,
									),
								);
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
					}
				} else {
					// Fallback to simple list if no categories
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
				}

				console.log(chalk.bold("💡 Usage:\n"));
				console.log(chalk.dim("   npx better-admin add <component-name>"));
				console.log(
					chalk.dim("   npx better-admin list --category data-display"),
				);
				console.log(
					chalk.dim("   npx better-admin list --with-query\n"),
				);
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
