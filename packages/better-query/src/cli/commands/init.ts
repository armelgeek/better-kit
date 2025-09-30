import path from "path";
import { Command } from "commander";
import fs from "fs/promises";
import prompts from "prompts";
import { templateManager } from "../templates/index.js";
import { fileExists } from "../utils/fs.js";

export const initCommand = new Command("init")
	.description("Initialize a new Better Query project")
	.option("--with-auth", "Include Better Auth integration")
	.option(
		"--framework <framework>",
		"Framework to use (nextjs, express, hono)",
		"nextjs",
	)
	.option(
		"--database <database>",
		"Database to use (sqlite, postgres, mysql)",
		"sqlite",
	)
	.option("--dir <directory>", "Target directory", ".")
	.option("--typescript", "Use TypeScript (default: true)", true)
	.action(async (options) => {
		console.log("🚀 Initializing Better Query project...");

		try {
			const targetDir = path.resolve(process.cwd(), options.dir);

			// Check if directory exists
			const dirExists = await fileExists(targetDir);
			if (!dirExists) {
				await fs.mkdir(targetDir, { recursive: true });
			}

			// Ask for additional configuration if not provided
			const questions = [];

			if (!options.framework) {
				questions.push({
					type: "select",
					name: "framework",
					message: "Which framework do you want to use?",
					choices: [
						{ title: "Next.js", value: "nextjs" },
						{ title: "Express", value: "express" },
						{ title: "Hono", value: "hono" },
					],
					initial: 0,
				});
			}

			if (!options.database) {
				questions.push({
					type: "select",
					name: "database",
					message: "Which database do you want to use?",
					choices: [
						{ title: "SQLite", value: "sqlite" },
						{ title: "PostgreSQL", value: "postgres" },
						{ title: "MySQL", value: "mysql" },
					],
					initial: 0,
				});
			}

			const answers = await prompts(questions);

			const config = {
				framework: options.framework || answers.framework,
				database: options.database || answers.database,
				withAuth: options.withAuth,
				typescript: options.typescript,
				targetDir,
			};

			console.log("📁 Generating project files...");

			// Generate project based on template
			await templateManager.generateProject(config);

			console.log("✅ Better Query project initialized successfully!\n");

			// Show next steps
			console.log("🚀 Next steps:");
			console.log(`  1. cd ${path.relative(process.cwd(), targetDir)}`);
			console.log("  2. npm install");

			if (config.framework === "nextjs") {
				console.log("  3. npm run dev");
				console.log("\n  Open http://localhost:3000 to see your app!");
			} else {
				console.log("  3. npm start");
			}

			if (config.withAuth) {
				console.log("\n🔐 Authentication setup:");
				console.log("  - Set BETTER_AUTH_SECRET in your environment");
				console.log("  - Configure your authentication providers");
			}
		} catch (error) {
			console.error("❌ Failed to initialize project");
			console.error(error);
			process.exit(1);
		}
	});
