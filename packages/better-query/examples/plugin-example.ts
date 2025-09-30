import { z } from "zod";
import {
	adiemus,
	auditPlugin,
	cachePlugin,
	createPlugin,
	validationPlugin,
} from "../src/index";

// Create a CRUD instance with plugins
const crud = adiemus({
	database: {
		provider: "sqlite",
		url: ":memory:",
	},
	resources: [
		{
			name: "user",
			schema: z.object({
				id: z.string(),
				name: z.string(),
				email: z.string().email(),
				createdAt: z.date().optional(),
			}),
		},
	],
	plugins: [
		// Audit plugin - logs all operations
		auditPlugin({
			enabled: true,
			operations: ["create", "update", "delete"],
			includeRequestData: true,
		}),

		// Validation plugin - adds extra validation
		validationPlugin({
			strict: true,
			globalRules: {
				trimStrings: true,
				validateEmails: true,
			},
		}),

		// Cache plugin - caches read operations
		cachePlugin({
			enabled: true,
			defaultTTL: 300,
			resources: {
				user: {
					enabled: true,
					readTTL: 600,
					listTTL: 300,
				},
			},
		}),

		// Custom plugin example
		createPlugin({
			id: "timestamp",
			hooks: {
				beforeCreate: async (context) => {
					if (context.data) {
						context.data.createdAt = new Date();
					}
				},
			},
		}),
	],
});

console.log("✅ CRUD instance created with plugins:");
console.log("- Audit plugin:", !!crud.api.getAuditLogs);
console.log("- Cache plugin:", !!crud.api.getCacheStats);
console.log(
	"- Validation plugin:",
	!!crud.context.pluginManager?.getPlugin("validation"),
);
console.log(
	"- Custom timestamp plugin:",
	!!crud.context.pluginManager?.getPlugin("timestamp"),
);

// Available endpoints include:
// - All standard CRUD endpoints: createUser, getUser, updateUser, deleteUser, listUsers
// - Plugin endpoints: getAuditLogs, getCacheStats, clearCache

console.log("\n📝 Available API endpoints:");
Object.keys(crud.api).forEach((endpoint) => {
	console.log(`- ${endpoint}`);
});

export { crud };
