"use client";
import { authClient } from "@/lib/client";
import { Button } from "./ui/button";

export function AddCount() {
	const session = authClient.useSession();
	return (
		<div className="flex flex-col items-center justify-center w-full gap-4">
			<div className="p-2 border rounded bg-gray-50 text-sm w-full max-w-md">
				<strong>Session better-auth :</strong>
				<pre>{JSON.stringify(session, null, 2)}</pre>
			</div>
			<Button
				onClick={async () => {
					// Test sign-in OAuth (exemple GitHub)
					await authClient.signInOAuth({
						provider: "github",
						callbackURL: window.location.href,
					});
				}}
			>
				Se connecter avec GitHub
			</Button>
		</div>
	);
}
