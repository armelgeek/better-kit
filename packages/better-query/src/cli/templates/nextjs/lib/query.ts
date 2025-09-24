export function queryConfigTemplate(withAuth: boolean, database: string): string {
	let dbConfig = "";
	switch (database) {
		case "sqlite":
			dbConfig = `provider: "sqlite",
    url: process.env.DATABASE_URL || "data.db",`;
			break;
		case "postgres":
			dbConfig = `provider: "postgres",
    url: process.env.DATABASE_URL,`;
			break;
		case "mysql":
			dbConfig = `provider: "mysql",
    url: process.env.DATABASE_URL,`;
			break;
	}
	
	const authImports = withAuth ? `
import { betterAuth } from "better-auth";
import { betterAuth as betterAuthPlugin } from "better-query";` : "";

	const authSetup = withAuth ? `
// Better Auth configuration
export const auth = betterAuth({
  database: {
    ${dbConfig}
  },
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
  },
});` : "";

	const authPlugin = withAuth ? `
  plugins: [
    betterAuthPlugin({
      auth,
      rolePermissions: {
        admin: {
          resources: ["*"],
          operations: ["create", "read", "update", "delete", "list"],
        },
        user: {
          operations: ["read", "create"],
        }
      }
    })
  ],` : "";

	return `import { betterQuery, createResource } from "better-query";${authImports}
import { productSchema, categorySchema } from "./schemas";
${authSetup}
// Better Query configuration
export const query = betterQuery({
  basePath: "/api/query",
  database: {
    ${dbConfig}
    autoMigrate: true,
  },${authPlugin}
  resources: [
    createResource({
      name: "product",
      schema: productSchema,
      permissions: {
        create: async (context) => !!context.user,
        update: async (context) => !!context.user,
        delete: async (context) => !!context.user,
        read: async () => true,
        list: async () => true,
      }
    }),
    createResource({
      name: "category",
      schema: categorySchema,
      permissions: {
        create: async (context) => !!context.user,
        update: async (context) => !!context.user,
        delete: async (context) => !!context.user,
        read: async () => true,
        list: async () => true,
      }
    })
  ]
});

export type QueryType = typeof query;`;
}