import { defineConfig } from "tsup";

export default defineConfig({
	entry: {
		index: "./src/index.ts",
		provider: "./src/providers/index.ts",
		client: "./src/client/index.ts",
		cli: "./src/cli/index.ts",
		react: "./src/client/react.ts",
		plugins: "./src/plugins/index.ts",
	},
	splitting: false,
	sourcemap: true,
	format: ["esm", "cjs"],
	dts: true,
	external: [
		"react",
		"svelte",
		"$app/environment",
		"next",
		"pg",
		"mysql",
		"better-sqlite3",
		"typescript",
	],
});
