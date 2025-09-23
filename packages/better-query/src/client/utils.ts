/**
 * Infer base URL from environment variables (similar to better-auth pattern)
 * This version is client-safe and works in both server and client environments
 */
export function inferBaseURL(): string {
	// Check if we're in a browser environment
	if (typeof window !== "undefined") {
		// In browser, try to get URL from environment variables that are available client-side
		const url = 
			(window as any).__NEXT_DATA__?.env?.NEXT_PUBLIC_CRUD_URL ||
			(window as any).__NEXT_DATA__?.env?.NEXT_PUBLIC_API_URL ||
			process.env.NEXT_PUBLIC_CRUD_URL ||
			process.env.NEXT_PUBLIC_API_URL ||
			process.env.NEXT_PUBLIC_VERCEL_URL;

		if (url) {
			return url;
		}

		// In development, default to localhost
		if (process.env.NODE_ENV === "development") {
			return "http://localhost:3000/api/query";
		}

		// In production, use current origin
		return `${window.location.origin}/api/query`;
	}

	// Server-side inference (fallback)
	const url =
		process.env.CRUD_URL ||
		process.env.NEXT_PUBLIC_CRUD_URL ||
		process.env.API_URL ||
		process.env.NEXT_PUBLIC_API_URL ||
		process.env.VERCEL_URL ||
		process.env.NEXT_PUBLIC_VERCEL_URL;

	if (url) {
		return url;
	}

	if (
		!url &&
		(process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test")
	) {
		return "http://localhost:3000/api/query";
	}

	// Default fallback
	return "/api/query";
}