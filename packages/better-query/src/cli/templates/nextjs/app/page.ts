export function pageTemplate(withAuth: boolean): string {
	const authImports = withAuth
		? `
import { auth } from "@/lib/query";`
		: "";

	const authSection = withAuth
		? `
  const session = await auth.api.getSession();
  
  if (!session) {
    return (
      <main className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8">Welcome to Better Query</h1>
        <p className="mb-4">Please sign in to continue.</p>
        <a 
          href="/api/auth/signin"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Sign In
        </a>
      </main>
    );
  }`
		: "";

	// Build the template as separate strings to avoid React imports being processed
	const clientDirective = '"use client";';
	const reactImports = 'import { useState, useEffect } from "react";';
	const clientImport = 'import { queryClient } from "@/lib/client";';
	const typeImports = 'import type { Product, Category } from "@/lib/schemas";';

	const functionBody = `export default function HomePage() {${authSection}
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [productsData, categoriesData] = await Promise.all([
        queryClient.product.list(),
        queryClient.category.list(),
      ]);
      
      setProducts(productsData.data);
      setCategories(categoriesData.data);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function createSampleProduct() {
    try {
      await queryClient.product.create({
        name: "Sample Product",
        description: "This is a sample product",
        price: 29.99,
        category: "electronics",
        inStock: true,
      });
      
      // Reload data
      loadData();
    } catch (error) {
      console.error("Error creating product:", error);
    }
  }

  if (loading) {
    return (
      <main className="container mx-auto p-8">
        <div className="text-center">Loading...</div>
      </main>
    );
  }

  return (
    <main className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Better Query Demo</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Products ({products.length})</h2>
          <button 
            onClick={createSampleProduct}
            className="mb-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Add Sample Product
          </button>
          
          <div className="space-y-2">
            {products.map((product, index) => (
              <div key={index} className="p-4 border rounded">
                <h3 className="font-medium">{product.name}</h3>
                <p className="text-gray-600">{product.description}</p>
                <p className="font-semibold">$\\{product.price}</p>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">Categories ({categories.length})</h2>
          
          <div className="space-y-2">
            {categories.map((category, index) => (
              <div key={index} className="p-4 border rounded">
                <h3 className="font-medium">{category.name}</h3>
                <p className="text-gray-600">{category.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}`;

	return [
		clientDirective,
		"",
		reactImports,
		clientImport,
		typeImports + authImports,
		"",
		functionBody,
	].join("\n");
}
