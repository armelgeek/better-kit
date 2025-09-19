import { ZodArray, ZodLiteral, ZodObject, ZodOptional, z } from "zod";
import { User } from "../../adapters/schema";
import { createAuthEndpoint } from "../../api/call";
import { Plugin } from "../../types/plugins";
import { shimContext } from "../../utils/shim";
import {
	AccessControl,
	Role,
	createAccessControl,
	defaultRoles,
	defaultStatements,
} from "./access";
import { createOrganization } from "./routes/create-organization";

export interface OrganizationOptions {
	/**
	 * Configure whether new users are able to create new organizations.
	 * You can also pass a function that returns a boolean.
	 *
	 * 	@example
	 * ```ts
	 * allowUserToCreateOrganization: async (user) => {
	 * 		const plan = await getUserPlan(user);
	 *      return plan.name === "pro";
	 * }
	 * ```
	 * @default true
	 */
	allowUserToCreateOrganization?:
		| boolean
		| ((user: User) => Promise<boolean> | boolean);
	/**
	 *
	 */
	organizationLimit?: number;
	/**
	 * The role that is assigned to the creator of the organization.
	 *
	 * @default "admin"
	 */
	creatorRole?: string;
	/**
	 * The number of memberships a user can have in an organization.
	 *
	 * @default "unlimited"
	 */
	membershipLimit?: number;
	/**
	 * Configure the roles and permissions for the organization plugin.
	 *
	 */
	ac?: AccessControl<any>;
	/**
	 *
	 */
	roles?: {
		[key: string]: Role<any>;
	};
}

export const organization = <O extends OrganizationOptions>(options?: O) => {
	const endpoints = {
		createOrganization,
	};
	const api = shimContext(endpoints, {
		orgOptions: options || {},
	});
	const roles = {
		...defaultRoles,
		...options?.roles,
	};
	type DefaultStatements = typeof defaultStatements;
	type Statements = O["ac"] extends AccessControl<infer S>
		? S extends Record<string, any>
			? S & DefaultStatements
			: DefaultStatements
		: DefaultStatements;

	return {
		id: "organization",
		endpoints: {
			...api,
			hasPermission: createAuthEndpoint(
				"/organization/has-permission",
				{
					method: "GET",
					query: z.object({
						permission: z.record(z.string(), z.array(z.string())),
					}) as unknown as ZodObject<{
						permission: ZodObject<{
							[key in keyof Statements]: ZodOptional<
								//@ts-expect-error TODO: fix this
								ZodArray<ZodLiteral<Statements[key][number]>>
							>;
						}>;
					}>,
				},
				async () => {},
			),
		},
		schema: {
			session: {
				fields: {
					activeOrganizationId: {
						type: "string",
						required: false,
					},
				},
			},
			organization: {
				fields: {
					name: {
						type: "string",
					},
					slug: {
						type: "string",
						unique: true,
					},
				},
			},
		},
	} satisfies Plugin;
};

const ac = createAccessControl({
	sales: ["delete"],
});

const res = organization({
	ac,
});
res.endpoints.hasPermission({
	query: {
		permission: {
			organization: ["delete"],
			member: ["create"],
			sales: ["delete"],
		},
	},
});
