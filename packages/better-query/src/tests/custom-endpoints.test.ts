import { describe, expect, it } from "vitest";
import { z } from "zod";
import { adiemus, createCrudEndpoint, createResource } from "../index";

const testSchema = z.object({
	id: z.string().optional(),
	name: z.string(),
	email: z.string().email(),
	createdAt: z.date().optional(),
	updatedAt: z.date().optional(),
});

describe("Custom Endpoints", () => {
	it("should allow adding custom endpoints to a resource", () => {
		const customEndpoints = {
			getHelloWorld: createCrudEndpoint(
				"/test/hello-world",
				{
					method: "GET",
				},
				async (ctx) => {
					return ctx.json({
						message: "Hello World from custom endpoint",
					});
				},
			),

			customCreate: createCrudEndpoint(
				"/test/custom-create",
				{
					method: "POST",
					body: z.object({
						name: z.string(),
						customField: z.string(),
					}),
				},
				async (ctx) => {
					return ctx.json({
						message: "Custom create endpoint",
						data: ctx.body,
					});
				},
			),
		};

		const resource = createResource({
			name: "test",
			schema: testSchema,
			customEndpoints,
		});

		expect(resource.customEndpoints).toBeDefined();
		expect(resource.customEndpoints?.getHelloWorld).toBeDefined();
		expect(resource.customEndpoints?.customCreate).toBeDefined();
	});

	it("should merge custom endpoints with CRUD endpoints", () => {
		const customEndpoints = {
			getStats: createCrudEndpoint(
				"/test/stats",
				{
					method: "GET",
				},
				async (ctx) => {
					return ctx.json({
						total: 100,
						active: 85,
					});
				},
			),
		};

		const crud = adiemus({
			resources: [
				createResource({
					name: "test",
					schema: testSchema,
					customEndpoints,
				}),
			],
			database: {
				provider: "sqlite",
				url: ":memory:",
			},
		});

		// Check that both CRUD and custom endpoints exist
		expect(crud.api.createTest).toBeDefined(); // Standard CRUD endpoint
		expect(crud.api.getTest).toBeDefined(); // Standard CRUD endpoint
		expect(crud.api.listTests).toBeDefined(); // Standard CRUD endpoint
		expect(crud.api.getStats).toBeDefined(); // Custom endpoint
	});

	it("should support multiple custom endpoints", () => {
		const customEndpoints = {
			endpoint1: createCrudEndpoint(
				"/test/endpoint1",
				{
					method: "GET",
				},
				async (ctx) => {
					return ctx.json({ message: "Endpoint 1" });
				},
			),

			endpoint2: createCrudEndpoint(
				"/test/endpoint2",
				{
					method: "POST",
					body: z.object({ data: z.string() }),
				},
				async (ctx) => {
					return ctx.json({ message: "Endpoint 2", received: ctx.body });
				},
			),

			endpoint3: createCrudEndpoint(
				"/test/endpoint3/:id",
				{
					method: "PUT",
					params: z.object({ id: z.string() }),
					body: z.object({ update: z.string() }),
				},
				async (ctx) => {
					return ctx.json({
						message: "Endpoint 3",
						id: ctx.params.id,
						update: ctx.body.update,
					});
				},
			),
		};

		const crud = adiemus({
			resources: [
				createResource({
					name: "test",
					schema: testSchema,
					customEndpoints,
				}),
			],
			database: {
				provider: "sqlite",
				url: ":memory:",
			},
		});

		expect(crud.api.endpoint1).toBeDefined();
		expect(crud.api.endpoint2).toBeDefined();
		expect(crud.api.endpoint3).toBeDefined();
	});

	it("should work with disabled standard endpoints", () => {
		const customEndpoints = {
			customOnly: createCrudEndpoint(
				"/test/custom-only",
				{
					method: "GET",
				},
				async (ctx) => {
					return ctx.json({ message: "Custom only endpoint" });
				},
			),
		};

		const crud = adiemus({
			resources: [
				createResource({
					name: "test",
					schema: testSchema,
					endpoints: {
						create: false,
						read: false,
						update: false,
						delete: false,
						list: true, // Keep only list enabled
					},
					customEndpoints,
				}),
			],
			database: {
				provider: "sqlite",
				url: ":memory:",
			},
		});

		// Standard endpoints should respect the enabled/disabled settings
		expect(crud.api.createTest).toBeUndefined(); // Disabled
		expect(crud.api.getTest).toBeUndefined(); // Disabled
		expect(crud.api.updateTest).toBeUndefined(); // Disabled
		expect(crud.api.deleteTest).toBeUndefined(); // Disabled
		expect(crud.api.listTests).toBeDefined(); // Enabled

		// Custom endpoint should always be available
		expect(crud.api.customOnly).toBeDefined();
	});
});
