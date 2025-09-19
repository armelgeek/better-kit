import { CrudDemo } from "@/components/CrudDemo";
import { Client } from "@/components/client";
import { SignOut } from "@/components/signout";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { authMinimal as auth } from "@/lib/auth-minimal";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";

export default async function Home() {
	const session = await auth.api.getSession({
		headers: headers(),
	});
	return (
		<main className="flex min-h-screen flex-col items-center justify-between p-24">
			{session ? (
				<Card>
					<CardHeader>
						<CardTitle>{session.user.name}</CardTitle>
						<CardFooter>
							<SignOut />
						</CardFooter>
					</CardHeader>
				</Card>
			) : (
				<Link href="/sign-in">
					<Button>signin</Button>
				</Link>
			)}
			<Client />
			<hr className="my-8 w-full" />
			<CrudDemo />
		</main>
	);
}
