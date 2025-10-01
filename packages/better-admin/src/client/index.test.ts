import { describe, expect, it } from "vitest";
import { createAdminClient } from "./index";

describe("Admin Client", () => {
	describe("list operation", () => {
		it("should transform Better Query PaginationResult to AdminListResponse", async () => {
			// Mock query client that returns Better Query format
			const mockQueryClient = {
				product: {
					list: async (params: any) => {
						// Simulate Better Query response format
						return {
							data: {
								items: [
									{ id: "1", name: "Product 1", price: 10 },
									{ id: "2", name: "Product 2", price: 20 },
								],
								pagination: {
									page: 1,
									limit: 10,
									total: 2,
									totalPages: 1,
									hasNext: false,
									hasPrev: false,
								},
							},
							error: null,
						};
					},
				},
			};

			const adminClient = createAdminClient(mockQueryClient as any);

			const result = await adminClient.list("product", {
				page: 1,
				perPage: 10,
			});

			// Should transform to admin format
			expect(result).toEqual({
				data: [
					{ id: "1", name: "Product 1", price: 10 },
					{ id: "2", name: "Product 2", price: 20 },
				],
				page: 1,
				perPage: 10,
				total: 2,
				totalPages: 1,
			});
		});

		it("should handle legacy format with direct data array", async () => {
			// Mock query client that returns legacy format
			const mockQueryClient = {
				product: {
					list: async (params: any) => {
						// Legacy format: data is directly an array
						return {
							data: [
								{ id: "1", name: "Product 1", price: 10 },
								{ id: "2", name: "Product 2", price: 20 },
							],
							error: null,
						};
					},
				},
			};

			const adminClient = createAdminClient(mockQueryClient as any);

			const result = await adminClient.list("product", {
				page: 1,
				perPage: 10,
			});

			// Should handle legacy format gracefully
			expect(result).toEqual({
				data: [
					{ id: "1", name: "Product 1", price: 10 },
					{ id: "2", name: "Product 2", price: 20 },
				],
				page: 1,
				perPage: 10,
				total: 2,
				totalPages: 1,
			});
		});

		it("should pass correct query params to better-query", async () => {
			let capturedParams: any;

			const mockQueryClient = {
				product: {
					list: async (params: any) => {
						capturedParams = params;
						return {
							data: {
								items: [],
								pagination: {
									page: 2,
									limit: 25,
									total: 0,
									totalPages: 0,
									hasNext: false,
									hasPrev: true,
								},
							},
							error: null,
						};
					},
				},
			};

			const adminClient = createAdminClient(mockQueryClient as any);

			await adminClient.list("product", {
				page: 2,
				perPage: 25,
				sortBy: "name",
				sortOrder: "desc",
				search: "test",
				filters: { category: "electronics" },
			});

			// Should transform admin params to query params
			expect(capturedParams).toEqual({
				page: 2,
				limit: 25,
				sortBy: "name",
				sortOrder: "desc",
				search: "test",
				category: "electronics",
			});
		});

		it("should throw error when query client returns error", async () => {
			const mockQueryClient = {
				product: {
					list: async (params: any) => {
						return {
							data: null,
							error: {
								message: "Database connection failed",
							},
						};
					},
				},
			};

			const adminClient = createAdminClient(mockQueryClient as any);

			await expect(
				adminClient.list("product", { page: 1, perPage: 10 }),
			).rejects.toThrow("Database connection failed");
		});
	});
});
