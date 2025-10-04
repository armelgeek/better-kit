import fetch from "node-fetch";
import type { ComponentMetadata, Registry } from "../types.js";

export async function fetchRegistry(registryUrl: string): Promise<Registry> {
	try {
		const response = await fetch(`${registryUrl}/index.json`);
		
		if (!response.ok) {
			throw new Error(`Failed to fetch registry: ${response.statusText}`);
		}

		return await response.json() as Registry;
	} catch (error) {
		throw new Error(`Failed to fetch registry: ${error}`);
	}
}

export async function fetchComponent(
	registryUrl: string,
	componentName: string,
): Promise<ComponentMetadata> {
	try {
		const response = await fetch(`${registryUrl}/components/${componentName}.json`);
		
		if (!response.ok) {
			throw new Error(`Component '${componentName}' not found`);
		}

		return await response.json() as ComponentMetadata;
	} catch (error) {
		throw new Error(`Failed to fetch component '${componentName}': ${error}`);
	}
}

export function getComponentsList(registry: Registry): string[] {
	return registry.components.map((c) => c.name);
}
