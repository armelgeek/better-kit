import path from "path";
import fs from "fs/promises";
import { ensureDir, writeFile } from "../../utils/fs.js";
import { ProjectConfig } from "../index.js";
import { readmeTemplate } from "./README.js";
import { apiRouteTemplate } from "./api/route.js";
import { layoutTemplate } from "./app/layout.js";
import { pageTemplate } from "./app/page.js";
import { envTemplate } from "./env.js";
import { clientConfigTemplate } from "./lib/client.js";
import { queryConfigTemplate } from "./lib/query.js";
import { schemasTemplate } from "./lib/schemas.js";
import { nextConfigTemplate } from "./next.config.js";
import { packageJsonTemplate } from "./package.json.js";

class NextJSTemplate {
	async generate(config: ProjectConfig): Promise<void> {
		const { targetDir, withAuth, database, typescript } = config;

		// Create directory structure
		await this.createDirectoryStructure(targetDir);

		// Generate configuration files
		await this.generatePackageJson(targetDir, withAuth);
		await this.generateNextConfig(targetDir);
		await this.generateEnvFile(targetDir, withAuth, database);
		await this.generateTailwindConfig(targetDir);
		await this.generateTsConfig(targetDir);

		// Generate library files
		await this.generateQueryConfig(targetDir, withAuth, database);
		await this.generateClientConfig(targetDir);
		await this.generateSchemas(targetDir);

		// Generate app files
		await this.generateLayout(targetDir, withAuth);
		await this.generatePage(targetDir, withAuth);
		await this.generateApiRoutes(targetDir);

		// Generate documentation
		await this.generateReadme(targetDir, withAuth);

		// Generate auth-specific files if needed
		if (withAuth) {
			await this.generateAuthFiles(targetDir);
		}

		// Create globals.css file
		await this.generateGlobalsCss(targetDir);

		// Create gitignore
		await this.generateGitignore(targetDir);
	}

	private async createDirectoryStructure(targetDir: string): Promise<void> {
		const dirs = [
			"src/app",
			"src/app/api/query/[...any]",
			"src/lib",
			"src/components",
			"public",
		];

		for (const dir of dirs) {
			await ensureDir(path.join(targetDir, dir));
		}
	}

	private async generatePackageJson(
		targetDir: string,
		withAuth: boolean,
	): Promise<void> {
		const content = packageJsonTemplate(withAuth);
		await writeFile(path.join(targetDir, "package.json"), content);
	}

	private async generateNextConfig(targetDir: string): Promise<void> {
		const content = nextConfigTemplate();
		await writeFile(path.join(targetDir, "next.config.mjs"), content);
	}

	private async generateEnvFile(
		targetDir: string,
		withAuth: boolean,
		database: string,
	): Promise<void> {
		const content = envTemplate(withAuth, database);
		await writeFile(path.join(targetDir, ".env.local"), content);
	}

	private async generateTailwindConfig(targetDir: string): Promise<void> {
		const content = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
      },
    },
  },
  plugins: [],
}`;
		await writeFile(path.join(targetDir, "tailwind.config.js"), content);
	}

	private async generateTsConfig(targetDir: string): Promise<void> {
		const content = `{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}`;
		await writeFile(path.join(targetDir, "tsconfig.json"), content);
	}

	private async generateQueryConfig(
		targetDir: string,
		withAuth: boolean,
		database: string,
	): Promise<void> {
		const content = queryConfigTemplate(withAuth, database);
		await writeFile(path.join(targetDir, "src/lib/query.ts"), content);
	}

	private async generateClientConfig(targetDir: string): Promise<void> {
		const content = clientConfigTemplate();
		await writeFile(path.join(targetDir, "src/lib/client.ts"), content);
	}

	private async generateSchemas(targetDir: string): Promise<void> {
		const content = schemasTemplate();
		await writeFile(path.join(targetDir, "src/lib/schemas.ts"), content);
	}

	private async generateLayout(
		targetDir: string,
		withAuth: boolean,
	): Promise<void> {
		const content = layoutTemplate(withAuth);
		await writeFile(path.join(targetDir, "src/app/layout.tsx"), content);
	}

	private async generatePage(
		targetDir: string,
		withAuth: boolean,
	): Promise<void> {
		const content = pageTemplate(withAuth);
		await writeFile(path.join(targetDir, "src/app/page.tsx"), content);
	}

	private async generateApiRoutes(targetDir: string): Promise<void> {
		const content = apiRouteTemplate();

		// Ensure the directory exists first
		await ensureDir(path.join(targetDir, "src/app/api/query/[...any]"));
		await writeFile(
			path.join(targetDir, "src/app/api/query/[...any]/route.ts"),
			content,
		);
	}

	private async generateReadme(
		targetDir: string,
		withAuth: boolean,
	): Promise<void> {
		const content = readmeTemplate(withAuth);
		await writeFile(path.join(targetDir, "README.md"), content);
	}

	private async generateAuthFiles(targetDir: string): Promise<void> {
		// Generate auth-specific API route
		const authRouteContent = `import { auth } from "@/lib/query";

export { auth as GET, auth as POST };`;

		await ensureDir(path.join(targetDir, "src/app/api/auth/[...all]"));
		await writeFile(
			path.join(targetDir, "src/app/api/auth/[...all]/route.ts"),
			authRouteContent,
		);
	}

	private async generateGlobalsCss(targetDir: string): Promise<void> {
		const content = `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 214, 219, 220;
  --background-end-rgb: 255, 255, 255;
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-start-rgb: 0, 0, 0;
    --background-end-rgb: 0, 0, 0;
  }
}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(
      to bottom,
      transparent,
      rgb(var(--background-end-rgb))
    )
    rgb(var(--background-start-rgb));
}`;
		await writeFile(path.join(targetDir, "src/app/globals.css"), content);
	}

	private async generateGitignore(targetDir: string): Promise<void> {
		const content = `# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.js
.yarn/install-state.gz

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

# database
*.db
*.sqlite
data.db`;
		await writeFile(path.join(targetDir, ".gitignore"), content);
	}
}

export const nextjsTemplate = new NextJSTemplate();
