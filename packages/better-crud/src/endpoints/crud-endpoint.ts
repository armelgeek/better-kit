import { Endpoint, EndpointOptions } from "better-call";

/**
 * Simple wrapper around better-call endpoint creation for CRUD plugins
 * This follows the same pattern as better-auth's createAuthEndpoint
 */
export function createCrudEndpoint<T extends EndpointOptions>(
	path: string,
	options: T,
	handler: (ctx: any) => Promise<Response> | Response,
): Endpoint<T> {
	return {
		path,
		options,
		handler,
		method: options.method || "POST",
		headers: options.headers,
	} as any; // Use any to avoid complex type issues with better-call
}