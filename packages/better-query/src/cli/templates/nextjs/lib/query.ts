export function queryConfigTemplate(
	withAuth: boolean,
	database: string,
): string {
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

	const authImports = withAuth
		? `
import { betterAuth } from "better-auth";`
		: "";

	const authSetup = withAuth
		? `
// Better Auth configuration
export const auth = betterAuth({
  database: {
    ${dbConfig}
  },
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
  },
});`
		: "";

	const authPlugin = withAuth
		? `
  // Note: Better Auth integration is done through resource permissions
  // See the permissions configuration in resources below`
		: "";

	return `import { betterQuery, createResource } from "better-query";${authImports}
import type { QueryMiddlewareContext } from "better-query";
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
      middlewares: [
        {
          handler: async (context: QueryMiddlewareContext) => {
            console.log('Product middleware triggered', context);
            // Add any middleware logic here
          }
        }
      ],
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
