import { defineConfig } from "tsup";

export default defineConfig({
	entry: {
		index: "./simple-index.ts",
		components: "./components/simple/index.ts",
		ui: "./components/ui/index.ts",
	},
	format: ["esm"],
	dts: true,
	external: ["react", "react-dom"],
	clean: true,
	minify: false,
	sourcemap: true,
});