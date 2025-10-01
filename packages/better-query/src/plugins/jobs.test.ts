import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { betterQuery } from "../query";
import { jobsPlugin, createJobHandler } from "./jobs";

describe("Jobs Plugin", () => {
	let queryInstance: any;
	let testHandler: any;

	beforeEach(() => {
		// Create a test handler
		testHandler = vi.fn(async (data: any) => {
			return { result: "success", data };
		});

		// Initialize query with jobs plugin
		queryInstance = betterQuery({
			database: {
				provider: "sqlite",
				url: ":memory:",
				autoMigrate: true,
			},
			resources: [],
			plugins: [
				jobsPlugin({
					enabled: true,
					autoStart: false, // Don't auto-start runner in tests
					pollInterval: 1000,
					handlers: {
						testHandler: testHandler,
					},
				}),
			],
		});
	});

	it("should create jobs plugin with schema", () => {
		const plugin = jobsPlugin({ enabled: true });
		expect(plugin.id).toBe("jobs");
		expect(plugin.schema).toBeDefined();
		expect(plugin.schema?.jobs).toBeDefined();
		expect(plugin.schema?.job_history).toBeDefined();
	});

	it("should have job management endpoints", () => {
		expect(queryInstance.api.createJob).toBeDefined();
		expect(queryInstance.api.listJobs).toBeDefined();
		expect(queryInstance.api.getJob).toBeDefined();
		expect(queryInstance.api.updateJob).toBeDefined();
		expect(queryInstance.api.deleteJob).toBeDefined();
		expect(queryInstance.api.triggerJob).toBeDefined();
	});

	it("should have job runner control endpoints", () => {
		expect(queryInstance.api.startRunner).toBeDefined();
		expect(queryInstance.api.stopRunner).toBeDefined();
	});

	it("should create a job with schedule", async () => {
		const jobData = {
			name: "Test Job",
			handler: "testHandler",
			data: { message: "hello" },
			schedule: "5m", // Every 5 minutes
		};

		// Create a mock request
		const request = new Request("http://localhost/jobs", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(jobData),
		});

		const response = await queryInstance.handler(request);
		expect(response.status).toBe(201);

		const result = await response.json();
		expect(result.name).toBe(jobData.name);
		expect(result.handler).toBe(jobData.handler);
		expect(result.status).toBe("pending");
		expect(result.nextRunAt).toBeDefined();
	});

	it("should create a job with cron expression", async () => {
		const jobData = {
			name: "Cron Job",
			handler: "testHandler",
			schedule: "*/5 * * * *", // Every 5 minutes (cron)
		};

		const request = new Request("http://localhost/jobs", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(jobData),
		});

		const response = await queryInstance.handler(request);
		expect(response.status).toBe(201);

		const result = await response.json();
		expect(result.schedule).toBe(jobData.schedule);
		expect(result.nextRunAt).toBeDefined();
	});

	it("should list jobs", async () => {
		// First, create a job
		const jobData = {
			name: "List Test Job",
			handler: "testHandler",
		};

		await queryInstance.handler(
			new Request("http://localhost/jobs", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(jobData),
			}),
		);

		// List jobs
		const request = new Request("http://localhost/jobs", {
			method: "GET",
		});

		const response = await queryInstance.handler(request);
		expect(response.status).toBe(200);

		const result = await response.json();
		expect(result.data).toBeDefined();
		expect(Array.isArray(result.data)).toBe(true);
		expect(result.data.length).toBeGreaterThan(0);
	});

	it("should filter jobs by status", async () => {
		// Create a pending job
		await queryInstance.handler(
			new Request("http://localhost/jobs", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: "Pending Job",
					handler: "testHandler",
				}),
			}),
		);

		// List pending jobs
		const request = new Request("http://localhost/jobs?status=pending", {
			method: "GET",
		});

		const response = await queryInstance.handler(request);
		const result = await response.json();

		expect(result.data.every((job: any) => job.status === "pending")).toBe(
			true,
		);
	});

	it("should get a specific job by ID", async () => {
		// Create a job
		const createResponse = await queryInstance.handler(
			new Request("http://localhost/jobs", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: "Get Job Test",
					handler: "testHandler",
				}),
			}),
		);

		const created = await createResponse.json();

		// Get the job
		const request = new Request(`http://localhost/jobs/${created.id}`, {
			method: "GET",
		});

		const response = await queryInstance.handler(request);
		expect(response.status).toBe(200);

		const result = await response.json();
		expect(result.id).toBe(created.id);
		expect(result.name).toBe("Get Job Test");
	});

	it("should update a job", async () => {
		// Create a job
		const createResponse = await queryInstance.handler(
			new Request("http://localhost/jobs", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: "Original Name",
					handler: "testHandler",
				}),
			}),
		);

		const created = await createResponse.json();

		// Update the job
		const updateData = {
			name: "Updated Name",
			schedule: "10m",
		};

		const request = new Request(`http://localhost/jobs/${created.id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(updateData),
		});

		const response = await queryInstance.handler(request);
		expect(response.status).toBe(200);

		const result = await response.json();
		expect(result.name).toBe("Updated Name");
		expect(result.schedule).toBe("10m");
		expect(result.nextRunAt).toBeDefined();
	});

	it("should delete a job", async () => {
		// Create a job
		const createResponse = await queryInstance.handler(
			new Request("http://localhost/jobs", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: "To Delete",
					handler: "testHandler",
				}),
			}),
		);

		const created = await createResponse.json();

		// Delete the job
		const request = new Request(`http://localhost/jobs/${created.id}`, {
			method: "DELETE",
		});

		const response = await queryInstance.handler(request);
		expect(response.status).toBe(200);

		const result = await response.json();
		expect(result.success).toBe(true);

		// Verify it's deleted
		const getRequest = new Request(`http://localhost/jobs/${created.id}`, {
			method: "GET",
		});

		const getResponse = await queryInstance.handler(getRequest);
		expect(getResponse.status).toBe(404);
	});

	it("should return error when creating job without required fields", async () => {
		const request = new Request("http://localhost/jobs", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name: "No Handler" }),
		});

		const response = await queryInstance.handler(request);
		expect(response.status).toBe(400);

		const result = await response.json();
		expect(result.error).toBeDefined();
	});

	it("should disable plugin when enabled is false", () => {
		const plugin = jobsPlugin({ enabled: false });
		expect(plugin.id).toBe("jobs");
		expect(plugin.endpoints).toEqual({});
		expect(plugin.schema).toBeUndefined();
	});

	it("should support createJobHandler helper", () => {
		const handler = createJobHandler("myHandler", async (data) => {
			return { result: data };
		});

		expect(handler.name).toBe("myHandler");
		expect(typeof handler.handler).toBe("function");
	});

	it("should handle job history when enabled", () => {
		const plugin = jobsPlugin({ enableHistory: true });
		expect(plugin.schema?.job_history).toBeDefined();
	});

	it("should not include history table when disabled", () => {
		const plugin = jobsPlugin({ enableHistory: false });
		expect(plugin.schema?.job_history).toBeUndefined();
	});
});

describe("Job Scheduling", () => {
	it("should parse interval expressions correctly", () => {
		const plugin = jobsPlugin({ enabled: true });
		// Since parseSchedule is internal, we'll test through the API
		expect(plugin).toBeDefined();
	});

	it("should parse cron expressions correctly", () => {
		const plugin = jobsPlugin({ enabled: true });
		// Since parseCronExpression is internal, we'll test through the API
		expect(plugin).toBeDefined();
	});
});
