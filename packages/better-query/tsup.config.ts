import { defineConfig } from "tsup";

export default defineConfig([
	// Core & server-side entries – keep splitting enabled so shared code
	// remains deduplicated across bundles, but exclude React files from splitting
	{
		entry: {
			index: "./src/index.ts",
			client: "./src/client/index.ts",
			adapters: "./src/adapters/index.ts",
			plugins: "./src/plugins/index.ts",
			cli: "./src/cli/index.ts",
		},
		// Allow code-splitting for shared server/core code but exclude React files
		format: ["esm", "cjs"],
		dts: true,
		target: "es2022",
		sourcemap: true,
		external: ["pg", "mysql2", "better-sqlite3", "react", "@types/react"],
		// Prevent React hooks from being bundled in shared chunks
		noExternal: [],
	},

	// Dedicated React client entry – disable splitting so the 'use client'
	// directive stays at the top of the emitted bundle and React hooks are
	// not accidentally merged into a server chunk.
	{
		entry: {
			react: "./src/client/react/index.ts",
		},
		splitting: false,
		format: ["esm", "cjs"],
		dts: true,
		target: "es2022",
		sourcemap: true,
		external: ["pg", "mysql2", "better-sqlite3", "react", "@types/react"],
		// Ensure all React code is bundled together
		bundle: true,
		// Preserve 'use client' directives
		banner: {
			js: '"use client";',
		},
	},
]);
