import { describe, expect, it, vi, beforeEach } from "vitest";
import { createCrudClient } from "../index";

// Mock better-call/client to capture what requests would be made
const mockClientCalls: Array<{ path: string; options: any }> = [];
const mockClient = vi.fn((path: string, options: any) => {
	mockClientCalls.push({ path, options });
	return Promise.resolve({
		data: { id: "test-id", name: "test-product" },
		error: null,
		status: 200,
	});
});

vi.mock("better-call/client", () => ({
	createClient: vi.fn(() => mockClient),
}));

describe("CRUD Client Path Handling", () => {
	beforeEach(() => {
		mockClientCalls.length = 0; // Clear previous calls
		mockClient.mockClear();
	});

	it("should make requests to correct resource paths", async () => {
		const client = createCrudClient({
			baseURL: "http://localhost:3000/api/crud",
		});

		// Test create
		await client.product.create({
			name: "Tee shirt",
			price: 29.99,
		});

		expect(mockClientCalls[0]).toEqual({
			path: "/product",
			options: {
				method: "POST",
				body: {
					name: "Tee shirt",
					price: 29.99,
				},
			},
		});

		// Test read
		await client.product.read("test-id");

		expect(mockClientCalls[1]).toEqual({
			path: "/product/test-id",
			options: {
				method: "GET",
			},
		});

		// Test update
		await client.product.update("test-id", {
			name: "Updated shirt",
		});

		expect(mockClientCalls[2]).toEqual({
			path: "/product/test-id",
			options: {
				method: "PATCH",
				body: {
					name: "Updated shirt",
				},
			},
		});

		// Test delete
		await client.product.delete("test-id");

		expect(mockClientCalls[3]).toEqual({
			path: "/product/test-id",
			options: {
				method: "DELETE",
			},
		});

		// Test list
		await client.product.list({ page: 1, limit: 10 });

		expect(mockClientCalls[4]).toEqual({
			path: "/products",
			options: {
				method: "GET",
				query: { page: 1, limit: 10 },
			},
		});
	});

	it("should preserve additional options passed to methods", async () => {
		const client = createCrudClient({
			baseURL: "http://localhost:3000/api/crud",
		});

		await client.product.create(
			{
				name: "Tee shirt",
			},
			{
				headers: {
					Authorization: "Bearer token",
				},
			}
		);

		expect(mockClientCalls[0]).toEqual({
			path: "/product",
			options: {
				method: "POST",
				body: {
					name: "Tee shirt",
				},
				headers: {
					Authorization: "Bearer token",
				},
			},
		});
	});
});