import { authMinimal as auth } from "@/lib/auth-minimal";
import { crudClient } from "@/lib/crud-auth";
export default async function Home() {
	console.log("Testing CRUD client...");

	try {
		const result = await crudClient.product.create({
			name: "Test Product from Next.js",
			price: 19.99,
			tags: ["test", "nextjs"],
			profile: { category: "testing", featured: false },
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
