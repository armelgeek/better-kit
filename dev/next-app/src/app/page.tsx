import { authMinimal as auth } from "@/lib/auth-minimal";
import { crudClient } from "@/lib/crud-auth";
export default async function Home() {
	
	console.log("Testing CRUD client...");
	
	try {
		const result = await crudClient.product.create({
			name: "Tee shirt",
			price: 29.99,
			description: "A comfortable cotton tee shirt",
			status: "active",
		});
		console.log("Success!", result);
	} catch (error) {
		console.error("Error:", error);
	}

	return (
		<main className="flex min-h-screen flex-col items-center justify-between p-24">
			<h1>Testing CRUD client</h1>
		</main>
	);
}
