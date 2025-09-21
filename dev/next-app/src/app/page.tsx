import { authMinimal as auth } from "@/lib/auth-minimal";
import { crudClient } from "@/lib/crud-auth";
export default async function Home() {
	
		const run = async () => {
			await crudClient.product.create(
				{
					name: "Tee shirt",
					price: 29.99,
					description: "A comfortable cotton tee shirt",
					status: "active",
				}
			);
		};
		run();
	return (
		<main className="flex min-h-screen flex-col items-center justify-between p-24">
			
		</main>
	);
}
