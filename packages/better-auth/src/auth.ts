import type { UnionToIntersection } from "type-fest";
import { router } from "./api";
import { init } from "./init";
import type { CustomProvider } from "./providers";
import type { BetterAuthOptions } from "./types/options";
import type { Plugin } from "./types/plugins";

export const betterAuth = <O extends BetterAuthOptions>(options: O) => {
	const authContext = init(options);
	type PluginEndpoint = UnionToIntersection<
		O["plugins"] extends Array<infer T>
			? T extends Plugin
				? T["endpoints"]
				: Record<string, never>
			: Record<string, never>
	>;

	type ProviderEndpoint = UnionToIntersection<
		O["providers"] extends Array<infer T>
			? T extends CustomProvider
				? T["endpoints"]
				: Record<string, never>
			: Record<string, never>
	>;
	const { handler, endpoints } = router(authContext);
	type Endpoint = typeof endpoints;
	return {
		handler,
		api: endpoints as Endpoint & PluginEndpoint & ProviderEndpoint,
		options,
	};
};

export type BetterAuth<
	Endpoints extends Record<string, any> = ReturnType<
		typeof router
	>["endpoints"],
> = {
	handler: (request: Request) => Promise<Response>;
	api: Endpoints;
	options: BetterAuthOptions;
};
