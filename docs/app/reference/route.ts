import { ApiReference } from "@scalar/nextjs-api-reference";

export const dynamic = 'force-static';
export const revalidate = false;

export const GET = ApiReference({
	spec: {
		url: "/openapi.yml",
	},
});
