import { defineConfig } from "tsup";

export default defineConfig([
	// Core & server-side entries
	{
		entry: {
			index: "./src/index.ts",
			core: "./src/core/index.ts",
			client: "./src/client/index.ts",
			ui: "./src/ui/index.ts",
			types: "./src/types/index.ts",
		},
		format: ["esm", "cjs"],
		dts: true,
		target: "es2022",
		sourcemap: true,
		external: ["react", "@types/react", "better-query"],
	},

	// Dedicated React client entry
	{
		entry: {
			react: "./src/client/react/index.ts",
		},
		splitting: false,
		format: ["esm", "cjs"],
		dts: true,
		target: "es2022",
		sourcemap: true,
		external: ["react", "@types/react", "better-query"],
		bundle: true,
		banner: {
			js: '"use client";',
		},
	},
]);
