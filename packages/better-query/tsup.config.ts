import { defineConfig } from "tsup";

export default defineConfig([
	{
		entry: {
			index: "./src/index.ts",
			client: "./src/client/index.ts",
			react: "./src/client/react/index.ts",
			adapters: "./src/adapters/index.ts",
			plugins: "./src/plugins/index.ts",
			cli: "./src/cli/index.ts",
		},
		format: ["esm", "cjs"],
		dts: true,
		target: "es2022",
		sourcemap: true,
		external: ["pg", "mysql2", "better-sqlite3", "react", "@types/react"],
	},
]);
