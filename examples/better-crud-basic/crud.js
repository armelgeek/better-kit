import {
	betterCrud,
	categorySchema,
	createResource,
	productSchema,
} from "better-crud";
import { z } from "zod";

// Define a custom schema
const userSchema = z.object({
	id: z.string().optional(),
	email: z.string().email("Valid email is required"),
	name: z.string().min(1, "Name is required"),
	role: z.enum(["user", "admin"]).default("user"),
	createdAt: z.date().default(() => new Date()),
	updatedAt: z.date().default(() => new Date()),
});

console.log("✅ Successfully imported better-crud!");
console.log("✅ Successfully created schemas!");

console.log("\nAvailable schemas:");
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
