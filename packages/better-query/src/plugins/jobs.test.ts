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

	it("should have job history endpoint when enabled", () => {
		const withHistory = betterQuery({
			database: {
				provider: "sqlite",
				url: ":memory:",
			},
			resources: [],
			plugins: [
				jobsPlugin({
					enabled: true,
					enableHistory: true,
				}),
			],
		});

		expect(withHistory.api.getJobHistory).toBeDefined();
	});

	it("should not have job history endpoint when disabled", () => {
		const withoutHistory = betterQuery({
			database: {
				provider: "sqlite",
				url: ":memory:",
			},
			resources: [],
			plugins: [
				jobsPlugin({
					enabled: true,
					enableHistory: false,
				}),
			],
		});

		expect(withoutHistory.api.getJobHistory).toBeUndefined();
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
		expect(plugin.schema?.job_history.fields).toBeDefined();
		expect(plugin.schema?.job_history.fields.jobId).toBeDefined();
	});

	it("should not include history table when disabled", () => {
		const plugin = jobsPlugin({ enableHistory: false });
		expect(plugin.schema?.job_history).toBeUndefined();
	});

	it("should have correct jobs table schema", () => {
		const plugin = jobsPlugin({ enabled: true });
		const jobsSchema = plugin.schema?.jobs;

		expect(jobsSchema).toBeDefined();
		expect(jobsSchema?.fields.id).toBeDefined();
		expect(jobsSchema?.fields.name).toBeDefined();
		expect(jobsSchema?.fields.handler).toBeDefined();
		expect(jobsSchema?.fields.data).toBeDefined();
		expect(jobsSchema?.fields.schedule).toBeDefined();
		expect(jobsSchema?.fields.status).toBeDefined();
		expect(jobsSchema?.fields.attempts).toBeDefined();
		expect(jobsSchema?.fields.maxAttempts).toBeDefined();
		expect(jobsSchema?.fields.lastRunAt).toBeDefined();
		expect(jobsSchema?.fields.nextRunAt).toBeDefined();
		expect(jobsSchema?.fields.lastError).toBeDefined();
		expect(jobsSchema?.fields.createdAt).toBeDefined();
		expect(jobsSchema?.fields.updatedAt).toBeDefined();
	});

	it("should have correct job_history table schema", () => {
		const plugin = jobsPlugin({ enableHistory: true });
		const historySchema = plugin.schema?.job_history;

		expect(historySchema).toBeDefined();
		expect(historySchema?.fields.id).toBeDefined();
		expect(historySchema?.fields.jobId).toBeDefined();
		expect(historySchema?.fields.status).toBeDefined();
		expect(historySchema?.fields.startedAt).toBeDefined();
		expect(historySchema?.fields.completedAt).toBeDefined();
		expect(historySchema?.fields.error).toBeDefined();
		expect(historySchema?.fields.result).toBeDefined();
		expect(historySchema?.fields.duration).toBeDefined();
	});

	it("should register plugin init function", () => {
		const plugin = jobsPlugin({ enabled: true });
		expect(plugin.init).toBeDefined();
		expect(typeof plugin.init).toBe("function");
	});

	it("should register plugin destroy function", () => {
		const plugin = jobsPlugin({ enabled: true });
		expect(plugin.destroy).toBeDefined();
		expect(typeof plugin.destroy).toBe("function");
	});

	it("should store options in plugin", () => {
		const options = {
			enabled: true,
			pollInterval: 5000,
			defaultMaxAttempts: 5,
			enableHistory: true,
			autoStart: false,
		};

		const plugin = jobsPlugin(options);
		expect(plugin.options).toEqual(options);
	});

	it("should register handler functions", () => {
		const customHandler = vi.fn(async () => ({ done: true }));
		const plugin = jobsPlugin({
			enabled: true,
			handlers: {
				custom: customHandler,
			},
		});

		expect(plugin.options?.handlers).toBeDefined();
		expect(plugin.options?.handlers?.custom).toBe(customHandler);
	});
});

describe("Job Scheduling", () => {
	it("should create plugin with scheduling options", () => {
		const plugin = jobsPlugin({
			enabled: true,
			pollInterval: 30000,
		});

		expect(plugin.options?.pollInterval).toBe(30000);
	});

	it("should support interval expressions in job definition", () => {
		// This tests that the schema allows schedule field
		const plugin = jobsPlugin({ enabled: true });
		expect(plugin.schema?.jobs.fields.schedule).toBeDefined();
		expect(plugin.schema?.jobs.fields.schedule.required).toBe(false);
	});

	it("should support cron expressions in job definition", () => {
		// This tests that the schema allows schedule field
		const plugin = jobsPlugin({ enabled: true });
		expect(plugin.schema?.jobs.fields.schedule).toBeDefined();
		expect(plugin.schema?.jobs.fields.schedule.type).toBe("string");
	});
});

describe("Job Plugin Integration", () => {
	it("should integrate with betterQuery", () => {
		const instance = betterQuery({
			database: {
				provider: "sqlite",
				url: ":memory:",
			},
			resources: [],
			plugins: [jobsPlugin({ enabled: true })],
		});

		expect(instance).toBeDefined();
		expect(instance.context).toBeDefined();
		expect(instance.context.pluginManager).toBeDefined();
		expect(instance.context.pluginManager.getPlugin("jobs")).toBeDefined();
	});

	it("should expose jobs endpoints in API", () => {
		const instance = betterQuery({
			database: {
				provider: "sqlite",
				url: ":memory:",
			},
			resources: [],
			plugins: [jobsPlugin({ enabled: true })],
		});

		// Verify all expected endpoints are present
		const expectedEndpoints = [
			"createJob",
			"listJobs",
			"getJob",
			"updateJob",
			"deleteJob",
			"triggerJob",
			"startRunner",
			"stopRunner",
			"getJobHistory",
		];

		for (const endpoint of expectedEndpoints) {
			expect(instance.api[endpoint]).toBeDefined();
		}
	});
});
