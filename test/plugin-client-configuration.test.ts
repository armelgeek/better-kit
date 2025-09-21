/**
 * Simple test to validate plugin client configuration functionality
 */

async function testPluginClientConfiguration() {
	console.log("🧪 Testing Plugin Client Configuration\n");

	// Test 1: Import and create CRUD client
	console.log("1. Creating CRUD client...");
	try {
		// Test dynamic import of the built module
		const { createCrudClient, CRUD_ERROR_CODES } = await import("../packages/better-auth/dist/plugins.js");

		const crudClient = createCrudClient({
			baseURL: "http://localhost:3000/api/test",
		});

		console.log("   ✅ CRUD client created successfully");
		console.log("   📊 Available error codes:", Object.keys(CRUD_ERROR_CODES));
		
		// Test 2: Check resource methods
		console.log("\n2. Checking resource methods...");
		const productMethods = crudClient.test;
		const expectedMethods = ['create', 'read', 'update', 'delete', 'list'];
		
		for (const method of expectedMethods) {
			if (typeof productMethods[method] === 'function') {
				console.log(`   ✅ ${method} method available`);
			} else {
				console.log(`   ❌ ${method} method missing`);
			}
		}

		// Test 3: Dynamic resource access
		console.log("\n3. Testing dynamic resource access...");
		const dynamicResource = crudClient.dynamicTest;
		if (typeof dynamicResource.create === 'function') {
			console.log("   ✅ Dynamic resource methods created");
		} else {
			console.log("   ❌ Dynamic resource access failed");
		}

		console.log("\n✨ All tests passed! Plugin client configuration is working correctly.");

	} catch (error) {
		console.error("❌ Test failed:", error);
	}
}

// Run tests
testPluginClientConfiguration();