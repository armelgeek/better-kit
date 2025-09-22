import {
	adiemus,
	createResource,
	withId,
} from "better-crud";
import { z } from "zod";

// Define custom schemas - users now need to create their own schemas
const productSchema = withId({
	name: z.string().min(1, "Product name is required"),
	description: z.string().optional(),
	price: z.number().min(0, "Price must be positive"),
	categoryId: z.string().optional(),
	tags: z.array(z.string()).default([]),
	status: z.enum(["active", "inactive", "draft"]).default("draft"),
	sku: z.string().optional(),
	stock: z.number().int().min(0).default(0),
});

const categorySchema = withId({
	name: z.string().min(1, "Category name is required"),
	description: z.string().optional(),
	parentId: z.string().optional(),
	slug: z.string().min(1, "Slug is required"),
	status: z.enum(["active", "inactive"]).default("active"),
});

const userSchema = withId({
	email: z.string().email("Valid email is required"),
	name: z.string().min(1, "Name is required"),
	role: z.enum(["user", "admin"]).default("user"),
});

console.log("✅ Successfully imported better-crud!");
console.log("✅ Successfully created custom schemas!");

console.log("\nCustom schemas:");
console.log("- productSchema:", typeof productSchema);
console.log("- categorySchema:", typeof categorySchema);
console.log("- userSchema:", typeof userSchema);

console.log("\nCreating resource configs...");

const productResource = createResource({
	name: "product",
	schema: productSchema,
	permissions: {
		create: () => true,
		read: () => true,
		update: () => true,
		delete: () => false, // Disable product deletion
		list: () => true,
	},
});

const categoryResource = createResource({
	name: "category",
	schema: categorySchema,
});

const userResource = createResource({
	name: "user",
	schema: userSchema,
});

console.log("✅ Resource configs created successfully!");
console.log("- Product resource:", productResource.name);
console.log("- Category resource:", categoryResource.name);
console.log("- User resource:", userResource.name);

console.log("\n🎉 Better CRUD is working correctly!");
console.log(
	"To test with database, install better-sqlite3 and uncomment the database configuration.",
);
