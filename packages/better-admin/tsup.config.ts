import { defineConfig } from "tsup";

export default defineConfig({
	entry: {
		index: "./simple-index.ts",
		components: "./components/simple/index.tsx",
		ui: "./components/ui/index.ts",
	},
	format: ["esm"],
	dts: false,
	external: ["react", "react-dom"],
	clean: true,
	minify: false,
	sourcemap: true,
});