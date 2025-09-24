import { defineConfig } from "tsup";

export default defineConfig({
	entry: {
		index: "./index.ts",
		components: "./components/index.ts",
	},
	format: ["esm"],
	dts: true,
	external: ["react", "react-dom"],
	clean: true,
	minify: false,
	sourcemap: true,
});