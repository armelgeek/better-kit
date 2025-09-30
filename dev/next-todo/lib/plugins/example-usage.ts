/**
 * Standalone Plugin Example
 *
 * This file demonstrates how to use plugins with Better Query.
 * Run this example with: npx tsx lib/plugins/example-usage.ts
 */

import { betterQuery, createResource, withId } from "better-query";
import {
	auditPlugin,
	cachePlugin,
	createPlugin,
	validationPlugin,
} from "better-query/plugins";
import { z } from "zod";

console.log("🚀 Better Query Plugin System Demo\n");

// Example 1: Create a simple custom plugin
console.log("1️⃣ Creating Custom Timestamp Plugin");
const timestampPlugin = createPlugin({
	id: "timestamp",
	hooks: {
		beforeCreate: async (context) => {
			console.log(`   ⏰ Adding timestamp to ${context.resource}`);
			if (context.data) {
				context.data.createdAt = new Date();
				context.data.updatedAt = new Date();
			}
		},
		afterCreate: async (context) => {
			console.log(`   ✅ Created ${context.resource}:`, context.result.id);
		},
	},
});
console.log("   ✓ Custom plugin created\n");

// Example 2: Configure built-in plugins
console.log("2️⃣ Configuring Built-in Plugins");

const audit = auditPlugin({
	enabled: true,
	operations: ["create", "update", "delete"],
	logger: (event) => {
		console.log(
			`   📋 [AUDIT] ${event.operation.toUpperCase()} on ${event.resource}`,
		);
	},
});
console.log("   ✓ Audit plugin configured");

const cache = cachePlugin({
	enabled: true,
	defaultTTL: 300,
	resources: {
		todo: { readTTL: 600, listTTL: 300 },
	},
});
console.log("   ✓ Cache plugin configured");

const validation = validationPlugin({
	strict: true,
	globalRules: {
		trimStrings: true,
		validateEmails: true,
	},
});
console.log("   ✓ Validation plugin configured\n");

// Example 3: Create a Better Query instance with plugins
console.log("3️⃣ Creating Better Query Instance with Plugins");

const todoSchema = withId({
	title: z.string().min(1, "Title is required"),
	description: z.string().optional(),
	completed: z.boolean().default(false),
	priority: z.enum(["low", "medium", "high"]).default("medium"),
});

const todoResource = createResource({
	name: "todo",
	schema: todoSchema,
	permissions: {
		create: () => true,
		read: () => true,
		update: () => true,
		delete: () => true,
		list: () => true,
	},
});

const query = betterQuery({
	basePath: "/api/query",
	database: {
		provider: "sqlite",
		url: ":memory:", // In-memory database for this demo
		autoMigrate: true,
	},
	plugins: [
		audit, // Audit plugin logs all operations
		cache, // Cache plugin caches read operations
		validation, // Validation plugin validates and sanitizes data
		timestampPlugin, // Custom plugin adds timestamps
	],
	resources: [todoResource],
});

console.log("   ✓ Better Query instance created with 4 plugins\n");

// Example 4: Show available endpoints
console.log("4️⃣ Available API Endpoints");
console.log("   Standard CRUD endpoints:");
console.log("   - POST   /api/query/todo/create");
console.log("   - GET    /api/query/todo/read/:id");
console.log("   - POST   /api/query/todo/update/:id");
console.log("   - DELETE /api/query/todo/delete/:id");
console.log("   - GET    /api/query/todo/list");
console.log("\n   Plugin-provided endpoints:");
console.log("   - GET    /api/query/cache/stats (Cache plugin)");
console.log("   - DELETE /api/query/cache/clear (Cache plugin)");

console.log("\n✨ Plugin System Demo Complete!");
console.log("\n📚 To learn more about plugins:");
console.log("   - Read PLUGINS.md for detailed documentation");
console.log("   - Check lib/query.ts for implementation example");
console.log(
	"   - Explore lib/plugins/timestamp-plugin.ts for custom plugin example",
);
