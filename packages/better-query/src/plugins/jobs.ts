import { z } from "zod";
import { createCrudEndpoint } from "../endpoints/crud-endpoint";
import { FieldAttribute } from "../types";
import { Plugin, PluginInitContext } from "../types/plugins";

/**
 * Job status enum
 */
export type JobStatus =
	| "pending" // Job is waiting to be executed
	| "running" // Job is currently executing
	| "completed" // Job completed successfully
	| "failed" // Job failed with error
	| "cancelled"; // Job was cancelled

/**
 * Job definition structure
 */
export interface JobDefinition {
	id: string;
	name: string;
	handler: string; // Name of the registered handler function
	data?: any; // JSON data passed to the handler
	schedule?: string; // Cron expression or interval (e.g., "*/5 * * * *" or "5m")
	status: JobStatus;
	attempts: number; // Number of execution attempts
	maxAttempts: number; // Maximum retry attempts
	lastRunAt?: Date;
	nextRunAt?: Date;
	lastError?: string;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Job execution history entry
 */
export interface JobHistory {
	id: string;
	jobId: string;
	status: JobStatus;
	startedAt: Date;
	completedAt?: Date;
	error?: string;
	result?: any;
	duration?: number; // Execution duration in ms
}

/**
 * Job handler function type
 */
export type JobHandler = (data?: any) => Promise<any> | any;

/**
 * Job plugin options
 */
export interface JobPluginOptions {
	/** Whether to enable the job system */
	enabled?: boolean;
	/** Poll interval for checking scheduled jobs (in ms) */
	pollInterval?: number;
	/** Default max retry attempts */
	defaultMaxAttempts?: number;
	/** Whether to store job execution history */
	enableHistory?: boolean;
	/** Auto-start the job runner */
	autoStart?: boolean;
	/** Custom job handlers */
	handlers?: Record<string, JobHandler>;
}

/**
 * Job execution context
 */
export interface JobContext {
	job: JobDefinition;
	adapter: any;
	handlers: Map<string, JobHandler>;
}

/**
 * Parse schedule expression to next run time
 */
function parseSchedule(schedule: string, from: Date = new Date()): Date | null {
	// Handle interval expressions (e.g., "5m", "1h", "30s")
	const intervalMatch = schedule.match(/^(\d+)(s|m|h|d)$/);
	if (intervalMatch && intervalMatch[1] && intervalMatch[2]) {
		const value = intervalMatch[1];
		const unit = intervalMatch[2];
		const num = Number.parseInt(value, 10);
		const multipliers: Record<string, number> = {
			s: 1000,
			m: 60 * 1000,
			h: 60 * 60 * 1000,
			d: 24 * 60 * 60 * 1000,
		};
		const multiplier = multipliers[unit];
		if (multiplier) {
			const interval = num * multiplier;
			return new Date(from.getTime() + interval);
		}
	}

	// Handle cron expressions (simplified implementation)
	// Format: minute hour day month dayOfWeek
	// Example: "*/5 * * * *" = every 5 minutes
	const cronMatch = schedule.match(
		/^(\*|[\d,\-\/]+)\s+(\*|[\d,\-\/]+)\s+(\*|[\d,\-\/]+)\s+(\*|[\d,\-\/]+)\s+(\*|[\d,\-\/]+)$/,
	);
	if (cronMatch) {
		return parseCronExpression(schedule, from);
	}

	return null;
}

/**
 * Parse cron expression to next execution time
 * Simplified cron parser - supports star-slash-n syntax and specific values
 */
function parseCronExpression(cron: string, from: Date): Date {
	const parts = cron.split(" ");
	const [
		minutePart = "*",
		hourPart = "*",
		dayPart = "*",
		monthPart = "*",
		weekdayPart = "*",
	] = parts;

	const next = new Date(from);
	next.setSeconds(0);
	next.setMilliseconds(0);

	// Add one minute to start from next available slot
	next.setMinutes(next.getMinutes() + 1);

	// Parse minute
	if (minutePart && minutePart !== "*") {
		if (minutePart.startsWith("*/")) {
			const interval = Number.parseInt(minutePart.slice(2), 10);
			const currentMinute = next.getMinutes();
			const nextMinute = Math.ceil(currentMinute / interval) * interval;
			if (nextMinute >= 60) {
				next.setMinutes(0);
				next.setHours(next.getHours() + 1);
			} else {
				next.setMinutes(nextMinute);
			}
		} else {
			next.setMinutes(Number.parseInt(minutePart, 10));
		}
	}

	// Parse hour
	if (hourPart && hourPart !== "*" && !hourPart.startsWith("*/")) {
		next.setHours(Number.parseInt(hourPart, 10));
	}

	return next;
}

/**
 * Job executor - runs job handlers
 */
class JobExecutor {
	private handlers: Map<string, JobHandler> = new Map();
	private adapter: any;
	private enableHistory: boolean;

	constructor(
		adapter: any,
		handlers: Record<string, JobHandler> = {},
		enableHistory = true,
	) {
		this.adapter = adapter;
		this.enableHistory = enableHistory;
		for (const [name, handler] of Object.entries(handlers)) {
			this.handlers.set(name, handler);
		}
	}

	registerHandler(name: string, handler: JobHandler): void {
		this.handlers.set(name, handler);
	}

	async executeJob(job: JobDefinition): Promise<void> {
		const handler = this.handlers.get(job.handler);
		if (!handler) {
			throw new Error(`Job handler '${job.handler}' not found`);
		}

		const startTime = Date.now();
		let historyEntry: Partial<JobHistory> | null = null;

		if (this.enableHistory) {
			historyEntry = {
				id: this.generateId(),
				jobId: job.id,
				status: "running",
				startedAt: new Date(),
			};
		}

		try {
			// Update job status to running
			await this.adapter.update("jobs", job.id, {
				status: "running",
				lastRunAt: new Date(),
			});

			// Execute the handler
			const result = await handler(job.data);

			// Calculate next run time if scheduled
			const nextRunAt = job.schedule
				? parseSchedule(job.schedule, new Date())
				: null;

			// Update job as completed
			await this.adapter.update("jobs", job.id, {
				status: nextRunAt ? "pending" : "completed",
				attempts: 0, // Reset attempts on success
				lastRunAt: new Date(),
				nextRunAt: nextRunAt,
				lastError: null,
			});

			// Save history
			if (this.enableHistory && historyEntry) {
				await this.adapter.create("job_history", {
					...historyEntry,
					status: "completed",
					completedAt: new Date(),
					result: result,
					duration: Date.now() - startTime,
				});
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);

			// Update job as failed
			const newAttempts = job.attempts + 1;
			const shouldRetry = newAttempts < job.maxAttempts;
			const nextRunAt =
				shouldRetry && job.schedule
					? parseSchedule(job.schedule, new Date())
					: null;

			await this.adapter.update("jobs", job.id, {
				status: shouldRetry ? "pending" : "failed",
				attempts: newAttempts,
				lastRunAt: new Date(),
				lastError: errorMessage,
				nextRunAt: nextRunAt,
			});

			// Save history
			if (this.enableHistory && historyEntry) {
				await this.adapter.create("job_history", {
					...historyEntry,
					status: "failed",
					completedAt: new Date(),
					error: errorMessage,
					duration: Date.now() - startTime,
				});
			}

			throw error;
		}
	}

	private generateId(): string {
		return (
			Math.random().toString(36).substring(2, 15) +
			Math.random().toString(36).substring(2, 15)
		);
	}
}

/**
 * Job runner - polls and executes scheduled jobs
 */
class JobRunner {
	private executor: JobExecutor;
	private adapter: any;
	private pollInterval: number;
	private isRunning = false;
	private timerId?: NodeJS.Timeout;

	constructor(executor: JobExecutor, adapter: any, pollInterval: number) {
		this.executor = executor;
		this.adapter = adapter;
		this.pollInterval = pollInterval;
	}

	start(): void {
		if (this.isRunning) {
			return;
		}

		this.isRunning = true;
		this.poll();
	}

	stop(): void {
		this.isRunning = false;
		if (this.timerId) {
			clearTimeout(this.timerId);
			this.timerId = undefined;
		}
	}

	private async poll(): Promise<void> {
		if (!this.isRunning) {
			return;
		}

		try {
			// Find jobs that are ready to run
			const now = new Date();
			const jobs = await this.adapter.list("jobs", {
				where: {
					status: "pending",
					nextRunAt: { lte: now },
				},
			});

			// Execute jobs
			for (const job of jobs) {
				try {
					await this.executor.executeJob(job);
				} catch (error) {
					console.error(`Failed to execute job ${job.id}:`, error);
				}
			}
		} catch (error) {
			console.error("Error polling jobs:", error);
		}

		// Schedule next poll
		if (this.isRunning) {
			this.timerId = setTimeout(() => this.poll(), this.pollInterval);
		}
	}
}

/**
 * Jobs plugin factory
 */
export function jobsPlugin(options: JobPluginOptions = {}): Plugin {
	const {
		enabled = true,
		pollInterval = 60000, // 1 minute default
		defaultMaxAttempts = 3,
		enableHistory = true,
		autoStart = true,
		handlers = {},
	} = options;

	if (!enabled) {
		return {
			id: "jobs",
			endpoints: {},
		};
	}

	let executor: JobExecutor;
	let runner: JobRunner;

	// Plugin schema for database tables
	const schema = {
		jobs: {
			fields: {
				id: { type: "string" as const, required: true, unique: true },
				name: { type: "string" as const, required: true },
				handler: { type: "string" as const, required: true },
				data: { type: "json" as const, required: false },
				schedule: { type: "string" as const, required: false },
				status: { type: "string" as const, required: true },
				attempts: { type: "number" as const, required: true },
				maxAttempts: { type: "number" as const, required: true },
				lastRunAt: { type: "date" as const, required: false },
				nextRunAt: { type: "date" as const, required: false },
				lastError: { type: "string" as const, required: false },
				createdAt: { type: "date" as const, required: true },
				updatedAt: { type: "date" as const, required: true },
			},
		},
		...(enableHistory
			? {
					job_history: {
						fields: {
							id: { type: "string" as const, required: true, unique: true },
							jobId: {
								type: "string" as const,
								required: true,
								references: { model: "jobs", field: "id" },
							},
							status: { type: "string" as const, required: true },
							startedAt: { type: "date" as const, required: true },
							completedAt: { type: "date" as const, required: false },
							error: { type: "string" as const, required: false },
							result: { type: "json" as const, required: false },
							duration: { type: "number" as const, required: false },
						},
					},
				}
			: {}),
	};

	// Plugin endpoints
	const endpoints = {
		// Create a new job
		createJob: createCrudEndpoint(
			"/jobs",
			{
				method: "POST",
			},
			async (ctx: any) => {
				const { context } = ctx;
				const body = await ctx.body;

				// Validate required fields
				if (!body.name || !body.handler) {
					return ctx.json(
						{ error: "name and handler are required" },
						{ status: 400 },
					);
				}

				// Calculate next run time if schedule is provided
				const nextRunAt = body.schedule
					? parseSchedule(body.schedule, new Date())
					: new Date();

				const job = {
					id: generateId(),
					name: body.name,
					handler: body.handler,
					data: body.data || null,
					schedule: body.schedule || null,
					status: "pending" as JobStatus,
					attempts: 0,
					maxAttempts: body.maxAttempts || defaultMaxAttempts,
					lastRunAt: null,
					nextRunAt: nextRunAt,
					lastError: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				};

				const created = await context.adapter.create("jobs", job);
				return ctx.json(created, { status: 201 });
			},
		),

		// List all jobs
		listJobs: createCrudEndpoint(
			"/jobs",
			{
				method: "GET",
			},
			async (ctx: any) => {
				const { context } = ctx;
				const url = new URL(ctx.request.url);
				const status = url.searchParams.get("status");

				const where = status ? { status } : {};
				const jobs = await context.adapter.list("jobs", { where });

				return ctx.json({ data: jobs });
			},
		),

		// Get job by ID
		getJob: createCrudEndpoint(
			"/jobs/:id",
			{
				method: "GET",
			},
			async (ctx: any) => {
				const { context, params } = ctx;
				const job = await context.adapter.read("jobs", params.id);

				if (!job) {
					return ctx.json({ error: "Job not found" }, { status: 404 });
				}

				return ctx.json(job);
			},
		),

		// Update job
		updateJob: createCrudEndpoint(
			"/jobs/:id",
			{
				method: "PUT",
			},
			async (ctx: any) => {
				const { context, params } = ctx;
				const body = await ctx.body;

				const existing = await context.adapter.read("jobs", params.id);
				if (!existing) {
					return ctx.json({ error: "Job not found" }, { status: 404 });
				}

				// Recalculate next run time if schedule changed
				if (body.schedule && body.schedule !== existing.schedule) {
					body.nextRunAt = parseSchedule(body.schedule, new Date());
				}

				body.updatedAt = new Date();
				const updated = await context.adapter.update("jobs", params.id, body);

				return ctx.json(updated);
			},
		),

		// Delete job
		deleteJob: createCrudEndpoint(
			"/jobs/:id",
			{
				method: "DELETE",
			},
			async (ctx: any) => {
				const { context, params } = ctx;

				const existing = await context.adapter.read("jobs", params.id);
				if (!existing) {
					return ctx.json({ error: "Job not found" }, { status: 404 });
				}

				await context.adapter.delete("jobs", params.id);
				return ctx.json({ success: true });
			},
		),

		// Trigger job immediately
		triggerJob: createCrudEndpoint(
			"/jobs/:id/trigger",
			{
				method: "POST",
			},
			async (ctx: any) => {
				const { context, params } = ctx;

				const job = await context.adapter.read("jobs", params.id);
				if (!job) {
					return ctx.json({ error: "Job not found" }, { status: 404 });
				}

				try {
					await executor.executeJob(job);
					return ctx.json({ success: true });
				} catch (error) {
					return ctx.json(
						{
							error: "Job execution failed",
							message: error instanceof Error ? error.message : String(error),
						},
						{ status: 500 },
					);
				}
			},
		),

		// Get job execution history
		...(enableHistory
			? {
					getJobHistory: createCrudEndpoint(
						"/jobs/:id/history",
						{
							method: "GET",
						},
						async (ctx: any) => {
							const { context, params } = ctx;

							const history = await context.adapter.list("job_history", {
								where: { jobId: params.id },
								orderBy: { startedAt: "desc" },
							});

							return ctx.json({ data: history });
						},
					),
				}
			: {}),

		// Job runner control
		startRunner: createCrudEndpoint(
			"/jobs/runner/start",
			{
				method: "POST",
			},
			async (ctx: any) => {
				if (runner) {
					runner.start();
					return ctx.json({ success: true, message: "Job runner started" });
				}
				return ctx.json(
					{ error: "Job runner not initialized" },
					{ status: 500 },
				);
			},
		),

		stopRunner: createCrudEndpoint(
			"/jobs/runner/stop",
			{
				method: "POST",
			},
			async (ctx: any) => {
				if (runner) {
					runner.stop();
					return ctx.json({ success: true, message: "Job runner stopped" });
				}
				return ctx.json(
					{ error: "Job runner not initialized" },
					{ status: 500 },
				);
			},
		),
	};

	return {
		id: "jobs",
		schema,
		endpoints,
		options,

		// Initialize plugin
		init: async (context: PluginInitContext) => {
			executor = new JobExecutor(context.adapter, handlers, enableHistory);
			runner = new JobRunner(executor, context.adapter, pollInterval);

			if (autoStart) {
				runner.start();
				console.log("[Jobs Plugin] Job runner started");
			}
		},

		// Cleanup on destroy
		destroy: async () => {
			if (runner) {
				runner.stop();
				console.log("[Jobs Plugin] Job runner stopped");
			}
		},
	};
}

/**
 * Helper to generate IDs
 */
function generateId(): string {
	return (
		Math.random().toString(36).substring(2, 15) +
		Math.random().toString(36).substring(2, 15)
	);
}

/**
 * Helper to register job handlers at runtime
 */
export function createJobHandler(name: string, handler: JobHandler) {
	return { name, handler };
}
