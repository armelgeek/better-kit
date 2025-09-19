import { toNodeHandler } from "better-call";
import fs from "fs/promises";
import { type Listener, listen } from "listhen";
import { afterAll, beforeAll } from "vitest";
import { betterAuth } from "../auth";
import { github, google } from "../providers";

export async function getTestInstance() {
	const auth = betterAuth({
		providers: [
			github({
				clientId: "test",
				clientSecret: "test",
			}),
			google({
				clientId: "test",
				clientSecret: "test",
			}),
		],
		secret: "better-auth.secret",
		database: {
			provider: "sqlite",
			url: "./test.db",
			autoMigrate: true,
		},
		emailAndPassword: {
			enabled: true,
		},
	});

	let server: Listener;

	beforeAll(async () => {
		server = await listen(toNodeHandler(auth.handler));
	});
	afterAll(async () => {
		server.close();
		await fs.unlink("./test.db");
	});
	return auth;
}
