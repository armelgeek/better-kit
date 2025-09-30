import { betterQuery, createResource, withId } from "better-query";
import { z } from "zod";

// Todo Schema - Simple but elegant
const todoSchema = withId({
	title: z.string().min(1, "Title is required"),
	description: z.string().optional(),
	completed: z.boolean().default(false),
	priority: z.enum(["low", "medium", "high"]).default("medium"),
	category: z.string().optional(),
	dueDate: z.date().optional(),
});

// Create todo resource with full CRUD operations
const todoResource = createResource({
	name: "todo",
	schema: todoSchema,
	permissions: {
		create: () => true, // Anyone can create todos
		read: () => true, // Anyone can read todos
		update: () => true, // Anyone can update todos
		delete: () => true, // Anyone can delete todos
		list: () => true, // Anyone can list todos
	},
	hooks: {
		beforeCreate: async (context) => {
			console.log("Creating todo:", context);
			// Convert date string to Date object if present
			if (context.data.dueDate && typeof context.data.dueDate === "string") {
				context.data.dueDate = new Date(context.data.dueDate);
			}
			// Auto-generate timestamps
			context.data.createdAt = new Date();
			context.data.updatedAt = new Date();
		},
		beforeUpdate: async (context) => {
			console.log("Updating todo:", context);
			// Convert date string to Date object if present
			if (context.data.dueDate && typeof context.data.dueDate === "string") {
				context.data.dueDate = new Date(context.data.dueDate);
			}
			context.data.updatedAt = new Date();
		},
		afterCreate: async (context) => {
			console.log(`✅ Todo created: "${context.result.title}"`);
		},
		afterDelete: async (context) => {
			console.log(`🗑️ Todo deleted: ID ${context.id}`);
		},
	},
});

// Export a factory that lazily initializes Better Query so we can provide
// a clearer error message when native bindings like better-sqlite3 are missing.
export function createQuery() {
	try {
		return betterQuery({
			basePath: "/api/query",
			database: {
				provider: "sqlite",
				url: "todos.db",
				autoMigrate: true,
			},
			resources: [todoResource],
		});
	} catch (err) {
		// Detect common missing-binary/native-install error and rethrow with guidance
		/** @type {any} */
		const _err = err;
		const msg = _err && _err.message ? String(_err.message) : String(_err);
		if (msg.includes("better-sqlite3") || msg.includes("SQLite")) {
			throw new Error(
				`better-sqlite3 is required for SQLite support.\n` +
					`Install system build tools and the package (from repo root):\n` +
					`  pnpm install\n` +
					`Or install only this example's deps: cd dev/express-todo && pnpm add better-sqlite3\n` +
					`On Debian/Ubuntu: sudo apt-get install -y build-essential python3 libsqlite3-dev pkg-config\n` +
					`If using npm instead of pnpm: npm install better-sqlite3\n` +
					`If you still have issues, try using Node LTS (18 or 20) via nvm so prebuilt binaries are available.`,
			);
		}
		throw err;
	}
}
