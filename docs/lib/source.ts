import { changelogCollection, docs } from "@/.source";
import { getPageTree } from "@/components/sidebar-content";
import { loader } from "fumadocs-core/source";
import { createMDXSource } from "fumadocs-mdx";

export let source = loader({
	baseUrl: "/docs",
	source: docs.toFumadocsSource(),
});

source = { ...source, pageTree: getPageTree() };
