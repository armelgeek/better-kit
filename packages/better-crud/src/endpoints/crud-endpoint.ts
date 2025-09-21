import { Endpoint, EndpointOptions } from "better-call";

/**
 * Simple wrapper around better-call endpoint creation for CRUD plugins
 * This follows the same pattern as better-auth's createAuthEndpoint
 */
export function createCrudEndpoint(
	path: string,
	options: EndpointOptions,
	handler: (ctx: any) => Promise<Response> | Response,
): Endpoint {
	return {
		path,
		options,
		handler,
		method: options.method || "POST",
		headers: (options as any).headers || {},
	} as any; // Use any to avoid complex type issues with better-call
}