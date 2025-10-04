import { execa } from "execa";
import fs from "fs-extra";
import path from "path";

export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

export async function detectPackageManager(cwd: string = process.cwd()): Promise<PackageManager> {
	// Check for lock files
	if (await fs.pathExists(path.join(cwd, "pnpm-lock.yaml"))) {
		return "pnpm";
	}
	if (await fs.pathExists(path.join(cwd, "yarn.lock"))) {
		return "yarn";
	}
	if (await fs.pathExists(path.join(cwd, "bun.lockb"))) {
		return "bun";
	}
	if (await fs.pathExists(path.join(cwd, "package-lock.json"))) {
		return "npm";
	}

	// Default to npm
	return "npm";
}

export async function installDependencies(
	dependencies: string[],
	packageManager: PackageManager,
	cwd: string = process.cwd(),
): Promise<void> {
	if (dependencies.length === 0) return;

	const commands: Record<PackageManager, string[]> = {
		npm: ["install", ...dependencies],
		pnpm: ["add", ...dependencies],
		yarn: ["add", ...dependencies],
		bun: ["add", ...dependencies],
	};

	const args = commands[packageManager];
	await execa(packageManager, args, { cwd, stdio: "inherit" });
}

export async function isShadcnInstalled(cwd: string = process.cwd()): Promise<boolean> {
	// Check if shadcn components directory exists
	const componentsPaths = [
		path.join(cwd, "components/ui"),
		path.join(cwd, "src/components/ui"),
	];

	for (const componentsPath of componentsPaths) {
		if (await fs.pathExists(componentsPath)) {
			return true;
		}
	}

	return false;
}

export async function installShadcnComponents(
	components: string[],
	cwd: string = process.cwd(),
): Promise<void> {
	if (components.length === 0) return;

	try {
		// Install shadcn components using npx
		await execa("npx", ["shadcn@latest", "add", ...components, "--yes", "--overwrite"], {
			cwd,
			stdio: "inherit",
		});
	} catch (error) {
		throw new Error(`Failed to install shadcn components: ${error}`);
	}
}
