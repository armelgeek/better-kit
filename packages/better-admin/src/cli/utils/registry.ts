import path from "path";
import { fileURLToPath } from "url";
import fs from "fs-extra";
import fetch from "node-fetch";
import type { ComponentMetadata, Registry } from "../../types.js";

async function readLocalOrRemote(url: string): Promise<any> {
	// Check if it's a file URL
	if (url.startsWith("file://")) {
		const filePath = fileURLToPath(url);
		const content = await fs.readFile(filePath, "utf8");
		return JSON.parse(content);
	}

	// Otherwise fetch from HTTP
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to fetch: ${response.statusText}`);
	}
	return await response.json();
}

export async function fetchRegistry(registryUrl: string): Promise<Registry> {
	try {
		return await readLocalOrRemote(`${registryUrl}/index.json`);
	} catch (error) {
		throw new Error(`Failed to fetch registry: ${error}`);
	}
}

export async function fetchComponent(
	registryUrl: string,
	componentName: string,
): Promise<ComponentMetadata> {
	try {
		return await readLocalOrRemote(
			`${registryUrl}/components/${componentName}.json`,
		);
	} catch (error) {
		throw new Error(`Failed to fetch component '${componentName}': ${error}`);
	}
}

export function getComponentsList(registry: Registry): string[] {
	return registry.components.map((c) => c.name);
}
