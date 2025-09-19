/**
 * Example Usage of the Corrected betterCrud Implementation
 *
 * This demonstrates how to properly use betterCrud as a standalone
 * factory function alongside betterAuth.
 */

// Example API route that demonstrates using both auth and crud
// This would typically be in a Next.js API route like /pages/api/products.ts

import { NextRequest } from "next/server";

// Import the corrected implementations
import { auth, crud } from "../lib/crud-auth";

export async function GET(request: NextRequest) {
	// Handle authentication with betterAuth
	const authResponse = await auth.handler(request);

	// Handle CRUD operations with betterCrud
	const crudResponse = await crud.handler(request);

	return crudResponse;
}

export async function POST(request: NextRequest) {
	// Example: Create a new product
	const crudResponse = await crud.handler(request);
	return crudResponse;
}

/**
 * Key Benefits of the Corrected Implementation:
 *
 * 1. Separation of Concerns:
 *    - betterAuth handles authentication, sessions, user management
 *    - betterCrud handles CRUD operations, database interactions
 *
 * 2. Independent Configuration:
 *    - Each can have its own database configuration
 *    - CRUD can enable auto-migration independently
 *    - Auth can have its own middleware and plugins
 *
 * 3. Type Safety:
 *    - Proper TypeScript inference for both Auth and Crud types
 *    - Permission context properly typed as CrudPermissionContext
 *
 * 4. Flexibility:
 *    - Can use different databases for auth and crud if needed
 *    - Can deploy auth and crud services separately if desired
 *    - Easier to test each component independently
 */

// Example of accessing the generated endpoints:
// GET  /product     - List all products
// GET  /product/:id - Get specific product
// POST /product     - Create new product
// PUT  /product/:id - Update product
// DELETE /product/:id - Delete product

// Similar endpoints are generated for categories:
// GET  /category
// GET  /category/:id
// POST /category
// PUT  /category/:id
// DELETE /category/:id
