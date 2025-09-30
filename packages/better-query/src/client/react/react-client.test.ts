import { beforeEach, describe, expect, it, vi } from "vitest";
import { createReactQueryClient } from "./index";

// Mock @better-fetch/fetch
const mockFetch = vi.fn();
vi.mock("@better-fetch/fetch", () => ({
	createFetch: vi.fn((options) => {
		// Store the default options for later use in test assertions
		mockFetch.defaultOptions = options;
		return mockFetch;
	}),
}));

describe("React Query Client", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockFetch.defaultOptions = {};
	});

	it("should create a React Query client", () => {
		const client = createReactQueryClient({
			baseURL: "http://localhost:3000/api/query",
		});

		expect(client).toBeDefined();
		expect(typeof client).toBe("object");
	});

	it("should provide resource-specific methods", () => {
		const client = createReactQueryClient({
			baseURL: "http://localhost:3000/api/query",
		});

		// Test product methods (dynamic proxy creates them on access)
		expect(typeof client.product.create).toBe("function");
		expect(typeof client.product.read).toBe("function");
		expect(typeof client.product.update).toBe("function");
		expect(typeof client.product.delete).toBe("function");
		expect(typeof client.product.list).toBe("function");
	});

	it("should provide special properties", () => {
		const client = createReactQueryClient({
			baseURL: "http://localhost:3000/api/query",
		});

		expect(client.$fetch).toBeDefined();
		expect(client.$ERROR_CODES).toBeDefined();
		expect(client.$ERROR_CODES.VALIDATION_FAILED).toBe("VALIDATION_FAILED");
	});

	it("should call create method with correct parameters", async () => {
		mockFetch.mockResolvedValueOnce({
			data: { id: "test-id", name: "test-product", price: 29.99 },
			error: null,
		});

		const client = createReactQueryClient({
			baseURL: "http://localhost:3000/api/query",
		});

		const result = await client.product.create({
			name: "test-product",
			price: 29.99,
		});

		expect(mockFetch).toHaveBeenCalledWith("/product", {
			method: "POST",
			body: {
				name: "test-product",
				price: 29.99,
			},
		});

		expect(result.data).toEqual({
			id: "test-id",
			name: "test-product",
			price: 29.99,
		});
	});

	it("should call read method with correct parameters", async () => {
		mockFetch.mockResolvedValueOnce({
			data: { id: "test-id", name: "test-product", price: 29.99 },
			error: null,
		});

		const client = createReactQueryClient({
			baseURL: "http://localhost:3000/api/query",
		});

		const result = await client.product.read("test-id");

		expect(mockFetch).toHaveBeenCalledWith("/product/test-id", {
			method: "GET",
		});

		expect(result.data).toEqual({
			id: "test-id",
			name: "test-product",
			price: 29.99,
		});
	});

	it("should call list method with query parameters", async () => {
		mockFetch.mockResolvedValueOnce({
			data: {
				items: [{ id: "test-id", name: "test-product", price: 29.99 }],
				pagination: {
					page: 1,
					limit: 10,
					total: 1,
					totalPages: 1,
					hasNext: false,
					hasPrev: false,
				},
			},
			error: null,
		});

		const client = createReactQueryClient({
			baseURL: "http://localhost:3000/api/query",
		});

		const result = await client.product.list({
			page: 1,
			limit: 10,
			search: "test",
		});

		expect(mockFetch).toHaveBeenCalledWith("/products", {
			method: "GET",
			query: {
				page: 1,
				limit: 10,
				search: "test",
			},
		});

		expect(result.data?.items).toHaveLength(1);
	});

	it("should handle errors correctly", async () => {
		mockFetch.mockRejectedValueOnce(new Error("Network error"));

		const client = createReactQueryClient({
			baseURL: "http://localhost:3000/api/query",
		});

		const result = await client.product.create({
			name: "test-product",
		});

		expect(result.error).toBeDefined();
		expect(result.error.message).toBe("Network error");
		expect(result.data).toBeNull();
	});

	it("should pass custom headers correctly", async () => {
		mockFetch.mockResolvedValueOnce({
			data: { id: "test-id" },
			error: null,
		});

		const client = createReactQueryClient({
			baseURL: "http://localhost:3000/api/query",
		});

		await client.product.create(
			{ name: "test" },
			{ headers: { Authorization: "Bearer token" } },
		);

		expect(mockFetch).toHaveBeenCalledWith("/product", {
			method: "POST",
			body: { name: "test" },
			headers: { Authorization: "Bearer token" },
		});
	});

	it("should set default headers in createFetch call", () => {
		createReactQueryClient({
			baseURL: "http://localhost:3000/api/query",
			headers: {
				"Content-Type": "application/json",
				"X-Custom": "custom-value",
			},
		});

		// Check that createFetch was called with correct default headers
		expect(mockFetch.defaultOptions).toMatchObject({
			baseURL: "http://localhost:3000/api/query",
			headers: {
				"Content-Type": "application/json",
				"X-Custom": "custom-value",
			},
			credentials: "include",
			method: "GET",
		});
	});
});
