"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { authClient, useSession } from "../lib/auth-client";

export default function Navbar() {
	const router = useRouter();
	const { data, isPending, error } = useSession();
	const user = data?.user;
	const handleSignOut = async () => {
		await authClient.signOut({
			fetchOptions: {
				onSuccess: () => {
					router.push("/auth");
				},
			},
		});
	};
	return (
		<nav className="w-full px-52 flex items-center justify-between  py-3 bg-gray-100  border-b border-gray-200">
			<div className="font-bold text-lg">Next Todo</div>
			<div>
				{isPending ? (
					<span className="text-gray-500">Chargement...</span>
				) : user ? (
					<div className="flex items-center space-x-4">
						<span>{user.name ? `${user.name}` : ""}</span>
						<button onClick={handleSignOut} className="text-red-600">
							Se déconnecter
						</button>
					</div>
				) : (
					<Link href="/auth">Se connecter</Link>
				)}
			</div>
		</nav>
	);
}
