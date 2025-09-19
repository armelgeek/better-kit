import { defineConfig } from "tsup";

export default defineConfig([
	{
		entry: {
			index: "./src/index.ts",
			client: "./src/client/index.ts",
			adapters: "./src/adapters/index.ts",
		},
		format: ["esm", "cjs"],
		dts: true,
		target: "es2022",
		sourcemap: true,
		external: ["pg", "mysql2", "better-sqlite3"],
	},
]);
