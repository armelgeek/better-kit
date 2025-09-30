import { createPlugin } from "better-query/plugins";

/**
 * Simple custom plugin that automatically adds timestamps to todos
 * This demonstrates how to create a custom plugin for Better Query
 */
export const timestampPlugin = createPlugin({
	id: "timestamp",
	hooks: {
		beforeCreate: async (context) => {
			// Add createdAt timestamp when creating a todo
			if (context.data) {
				context.data.createdAt = new Date();
				context.data.updatedAt = new Date();
			}
		},
		beforeUpdate: async (context) => {
			// Update the updatedAt timestamp when updating a todo
			if (context.data) {
				context.data.updatedAt = new Date();
			}
		},
		afterCreate: async (context) => {
			// Log when a todo is created (optional)
			console.log(
				`✅ Todo created: "${
					context.result.title
				}" at ${new Date().toISOString()}`,
			);
		},
	},
});
