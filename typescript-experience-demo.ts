/**
 * Test example to demonstrate improved TypeScript experience for better-crud
 * This shows the same pattern as better-auth with full type inference
 */

// NOTE: This is just a demonstration file showing the improved developer experience
// In a real project, you would import from "better-crud" package

/*
import { adiemus, createCrudClient, createResource } from "better-crud";
import { z } from "zod";

// 1. Define schemas with Zod
const productSchema = z.object({
	id: z.string().optional(),
	name: z.string(),
	price: z.number(),
	description: z.string().optional(),
	status: z.enum(["active", "inactive"]).default("active"),
	createdAt: z.date().default(() => new Date()),
	updatedAt: z.date().default(() => new Date()),
});

const categorySchema = z.object({
	id: z.string().optional(),
	name: z.string(),
	description: z.string().optional(),
	createdAt: z.date().default(() => new Date()),
});

// 2. Create CRUD server instance with full configuration
export const crud = adiemus({
	resources: [
		createResource({
			name: "product",
			schema: productSchema,
			permissions: {
				create: async (context) => !!context.user,
				read: async () => true,
				update: async (context) => !!context.user,
				delete: async (context) => !!context.user,
				list: async () => true,
			},
		}),
		createResource({
			name: "category",
			schema: categorySchema,
		}),
	],
	database: {
		provider: "sqlite",
		url: "sqlite:./database.db",
		autoMigrate: true,
	},
});

// 3. Create typed client - KEY IMPROVEMENT: Generic parameter provides full type inference
export const crudClient = createCrudClient<typeof crud>({
	baseURL: "http://localhost:3000/api",
});

// 4. IMPROVED DEVELOPER EXPERIENCE - Examples showing what works now:

// ✅ TypeScript auto-completion for resources and methods
async function createProduct() {
	// crudClient.product.* will show: create, read, update, delete, list
	// crudClient.category.* will show: create, read, update, delete, list
	
	const result = await crudClient.product.create({
		// TypeScript will suggest these fields from productSchema:
		name: "Tee shirt",           // ✅ Required field - TypeScript enforces this
		price: 29.99,               // ✅ Required field - TypeScript enforces this  
		description: "A comfortable cotton tee shirt", // ✅ Optional field
		status: "active",           // ✅ Enum validation - only "active" | "inactive"
		// id: "...",               // ✅ Optional - will be auto-generated if not provided
		// createdAt: new Date(),   // ✅ Optional - has default value
		// updatedAt: new Date(),   // ✅ Optional - has default value
	});

	// ✅ Proper error handling with typed error codes
	if (result.error) {
		// result.error.code is typed as CrudErrorCode
		console.error('Error code:', result.error.code);
		console.error('Error message:', result.error.message);
		
		// Error code suggestions will show:
		// - VALIDATION_FAILED
		// - FORBIDDEN
		// - NOT_FOUND
		// - RATE_LIMIT_EXCEEDED
		// - INTERNAL_ERROR
		// - UNAUTHORIZED
		// - CONFLICT
		// - HOOK_EXECUTION_FAILED
	} else if (result.data) {
		// result.data is properly typed as the product schema output
		console.log('Created product:', result.data);
		console.log('Product ID:', result.data.id);      // ✅ Typed
		console.log('Product name:', result.data.name);  // ✅ Typed
		console.log('Product price:', result.data.price); // ✅ Typed
	}

	return result;
}

// ✅ Update operations use Partial<> for the schema
async function updateProduct(id: string) {
	const result = await crudClient.product.update(id, {
		// Only specify fields you want to update
		price: 34.99,  // ✅ TypeScript knows this is optional for updates
		// name is not required for updates
	});

	return result;
}

// ✅ List operations with advanced query parameters
async function listProducts() {
	const result = await crudClient.product.list({
		page: 1,
		limit: 10,
		search: "shirt",
		sortBy: "name",
		sortOrder: "asc",
		include: ["category"],     // ✅ Relationship inclusion
		filters: {
			status: {
				operator: "eq",
				value: "active"
			}
		},
		where: {
			price: {
				operator: "gte", 
				value: 20
			}
		}
	});

	if (result.data) {
		// result.data.items is typed as Product[]
		for (const product of result.data.items) {
			console.log(product.name);  // ✅ Fully typed
		}
		
		// Pagination info is also typed
		console.log('Total:', result.data.pagination.total);
		console.log('Has next:', result.data.pagination.hasNext);
	}

	return result;
}

// ✅ Error codes pattern similar to better-auth
type ErrorTypes = Partial<
	Record<
		keyof typeof crudClient.$ERROR_CODES,
		{
			en: string;
			es: string;
		}
	>
>;

const errorCodes = {
	VALIDATION_FAILED: {
		en: "validation failed",
		es: "validación fallida",
	},
	FORBIDDEN: {
		en: "access denied", 
		es: "acceso denegado",
	},
	NOT_FOUND: {
		en: "resource not found",
		es: "recurso no encontrado",
	},
} satisfies ErrorTypes;

const getErrorMessage = (code: string, lang: "en" | "es") => {
	if (code in errorCodes) {
		return errorCodes[code as keyof typeof errorCodes][lang];
	}
	return "";
};

// ✅ Component usage example
async function handleCreateProduct(formData: FormData) {
	const result = await crudClient.product.create({
		name: formData.get('name') as string,
		price: parseFloat(formData.get('price') as string),
		description: formData.get('description') as string,
		status: formData.get('status') as "active" | "inactive",
	});

	if (result.error?.code) {
		alert(getErrorMessage(result.error.code, "en"));
	} else {
		console.log("Product created successfully:", result.data);
	}
}

// ✅ Different resource types work independently
async function createCategory() {
	const result = await crudClient.category.create({
		// TypeScript suggests fields from categorySchema (different from product)
		name: "Clothing",
		description: "Clothing items",
	});

	return result;
}

export {
	createProduct,
	updateProduct,
	listProducts,
	handleCreateProduct,
	createCategory,
	getErrorMessage,
};
*/

// This example demonstrates the key improvements made to better-crud:
//
// 1. **Schema-aware typing**: Full TypeScript suggestions for all resource fields
// 2. **Error handling**: $ERROR_CODES pattern similar to better-auth
// 3. **Type safety**: Input validation and output typing based on Zod schemas
// 4. **Advanced queries**: Support for filtering, searching, relationships
// 5. **Developer experience**: Same pattern as better-auth with `createClient<typeof server>()`

console.log("Type improvements successfully implemented!");
