import { auditPlugin, validationPlugin, cachePlugin, createPlugin } from "../src/index";

console.log("🚀 Better-CRUD Plugin System Demo\n");

// Example 1: Audit Plugin
console.log("1️⃣ Audit Plugin");
const audit = auditPlugin({
	enabled: true,
	operations: ["create", "update", "delete"],
	includeRequestData: true,
	logger: (event) => {
		console.log(`   📋 [AUDIT] ${event.operation.toUpperCase()} on ${event.resource}`);
	},
});
console.log(`   ✅ Created with id: ${audit.id}`);
console.log(`   📊 Endpoints: ${Object.keys(audit.endpoints || {}).join(", ")}`);
console.log(`   🗃️ Schema tables: ${Object.keys(audit.schema || {}).join(", ")}\n`);

// Example 2: Validation Plugin  
console.log("2️⃣ Validation Plugin");
const validation = validationPlugin({
	strict: true,
	globalRules: {
		trimStrings: true,
		validateEmails: true,
		sanitizeHtml: true,
	},
});
console.log(`   ✅ Created with id: ${validation.id}`);
console.log(`   🔒 Strict mode: enabled`);
console.log(`   🧹 Global rules: trim, email validation, HTML sanitization\n`);

// Example 3: Cache Plugin
console.log("3️⃣ Cache Plugin");
const cache = cachePlugin({
	enabled: true,
	defaultTTL: 300,
	resources: {
		user: { readTTL: 600, listTTL: 300 },
		product: { readTTL: 1200, listTTL: 600 },
	},
});
console.log(`   ✅ Created with id: ${cache.id}`);
console.log(`   📊 Endpoints: ${Object.keys(cache.endpoints || {}).join(", ")}`);
console.log(`   ⏰ Default TTL: 300s\n`);

// Example 4: Custom Plugin
console.log("4️⃣ Custom Plugin Example");
const timestampPlugin = createPlugin({
	id: "timestamp",
	hooks: {
		beforeCreate: async (context) => {
			console.log(`   ⏰ Adding timestamp to ${context.resource} creation`);
			if (context.data) {
				context.data.createdAt = new Date();
			}
		},
		beforeUpdate: async (context) => {
			console.log(`   ⏰ Adding timestamp to ${context.resource} update`);
			if (context.data) {
				context.data.updatedAt = new Date();
			}
		},
	},
});
console.log(`   ✅ Created with id: ${timestampPlugin.id}`);
console.log(`   🎣 Hooks: ${Object.keys(timestampPlugin.hooks || {}).join(", ")}\n`);

// Example 5: Advanced Custom Plugin with Endpoints and Schema
console.log("5️⃣ Advanced Custom Plugin");
const loggingPlugin = createPlugin({
	id: "logging",
	endpoints: {
		getLogs: {
			path: "/logs",
			method: "GET",
			handler: async (ctx: any) => ctx.json({ logs: [] }),
			options: { method: "GET" },
		},
		clearLogs: {
			path: "/logs/clear",
			method: "DELETE", 
			handler: async (ctx: any) => ctx.json({ success: true }),
			options: { method: "DELETE" },
		},
	},
	schema: {
		logs: {
			fields: {
				id: { type: "string", required: true },
				level: { type: "string", required: true },
				message: { type: "string", required: true },
				timestamp: { type: "date", required: true },
				metadata: { type: "json", required: false },
			},
		},
	},
	hooks: {
		afterCreate: async (context) => {
			console.log(`   📝 Logged ${context.resource} creation`);
		},
	},
});
console.log(`   ✅ Created with id: ${loggingPlugin.id}`);
console.log(`   📊 Endpoints: ${Object.keys(loggingPlugin.endpoints || {}).join(", ")}`);
console.log(`   🗃️ Schema tables: ${Object.keys(loggingPlugin.schema || {}).join(", ")}`);
console.log(`   🎣 Hooks: ${Object.keys(loggingPlugin.hooks || {}).join(", ")}\n`);

console.log("✨ All plugins created successfully!");
console.log("🔌 These plugins can be used with betterCrud() like this:");
console.log(`
const crud = betterCrud({
  database: { provider: "sqlite", url: ":memory:" },
  resources: [/* your resources */],
  plugins: [audit, validation, cache, timestampPlugin, loggingPlugin],
});
`);