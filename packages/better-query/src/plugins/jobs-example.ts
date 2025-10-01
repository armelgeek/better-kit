/**
 * Example: Using the Jobs Plugin with Better Query
 * 
 * This example demonstrates how to use the jobs and schedules plugin
 * for background task processing and scheduled jobs.
 */

import { betterQuery, jobsPlugin } from "better-query";

// Step 1: Define your job handlers
const jobHandlers = {
	// Example: Clean up old records
	cleanupOldRecords: async (data: { days: number }) => {
		console.log(`Cleaning up records older than ${data.days} days`);
		// Implement your cleanup logic here
		// e.g., await db.delete().from(table).where(...)
		return { deleted: 42 };
	},

	// Example: Send email notifications
	sendNotifications: async (data: { users: string[]; template: string }) => {
		console.log(`Sending ${data.template} to ${data.users.length} users`);
		// Implement your email sending logic here
		for (const user of data.users) {
			// await emailService.send(user, data.template);
		}
		return { sent: data.users.length };
	},

	// Example: Generate daily reports
	generateDailyReport: async () => {
		console.log("Generating daily report");
		// Implement your report generation logic
		const report = {
			date: new Date(),
			stats: {
				users: 150,
				orders: 42,
				revenue: 12500,
			},
		};
		return report;
	},

	// Example: Sync external data
	syncExternalData: async (data: { source: string }) => {
		console.log(`Syncing data from ${data.source}`);
		// Implement your data sync logic
		return { synced: 100 };
	},
};

// Step 2: Initialize Better Query with the jobs plugin
export const query = betterQuery({
	database: {
		provider: "sqlite",
		url: "app.db",
		autoMigrate: true,
	},
	resources: [], // Add your resources here
	plugins: [
		jobsPlugin({
			enabled: true,
			autoStart: true, // Automatically start the job runner
			pollInterval: 60000, // Check for jobs every 60 seconds
			defaultMaxAttempts: 3, // Retry failed jobs up to 3 times
			enableHistory: true, // Track execution history
			handlers: jobHandlers, // Register your job handlers
		}),
	],
});

// Step 3: Use the job system in your application

// Example: Create a scheduled cleanup job
async function setupCleanupJob() {
	const request = new Request("http://localhost/jobs", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			name: "Daily Cleanup",
			handler: "cleanupOldRecords",
			data: { days: 30 },
			schedule: "0 2 * * *", // Every day at 2 AM
			maxAttempts: 3,
		}),
	});

	const response = await query.handler(request);
	const job = await response.json();
	console.log("Created cleanup job:", job.id);
}

// Example: Create a periodic sync job
async function setupSyncJob() {
	const request = new Request("http://localhost/jobs", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			name: "External Data Sync",
			handler: "syncExternalData",
			data: { source: "external-api" },
			schedule: "15m", // Every 15 minutes
		}),
	});

	const response = await query.handler(request);
	const job = await response.json();
	console.log("Created sync job:", job.id);
}

// Example: Create a one-time job
async function sendWelcomeEmails(users: string[]) {
	const request = new Request("http://localhost/jobs", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			name: "Welcome Email Batch",
			handler: "sendNotifications",
			data: {
				users: users,
				template: "welcome",
			},
			// No schedule = runs once
		}),
	});

	const response = await query.handler(request);
	const job = await response.json();
	console.log("Created email job:", job.id);
}

// Example: Manually trigger a job
async function triggerJob(jobId: string) {
	const request = new Request(`http://localhost/jobs/${jobId}/trigger`, {
		method: "POST",
	});

	const response = await query.handler(request);
	const result = await response.json();
	console.log("Job triggered:", result);
}

// Example: List all pending jobs
async function listPendingJobs() {
	const request = new Request("http://localhost/jobs?status=pending", {
		method: "GET",
	});

	const response = await query.handler(request);
	const jobs = await response.json();
	console.log("Pending jobs:", jobs.data);
}

// Example: Get job execution history
async function getJobHistory(jobId: string) {
	const request = new Request(`http://localhost/jobs/${jobId}/history`, {
		method: "GET",
	});

	const response = await query.handler(request);
	const history = await response.json();
	console.log("Job history:", history.data);

	// Calculate average execution time
	const avgDuration =
		history.data.reduce(
			(sum: number, h: { duration: number }) => sum + h.duration,
			0,
		) / history.data.length;
	console.log(`Average execution time: ${avgDuration}ms`);
}

// Example: Update a job's schedule
async function updateJobSchedule(jobId: string, newSchedule: string) {
	const request = new Request(`http://localhost/jobs/${jobId}`, {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			schedule: newSchedule,
		}),
	});

	const response = await query.handler(request);
	const job = await response.json();
	console.log("Updated job:", job);
}

// Example: Delete a job
async function deleteJob(jobId: string) {
	const request = new Request(`http://localhost/jobs/${jobId}`, {
		method: "DELETE",
	});

	const response = await query.handler(request);
	const result = await response.json();
	console.log("Deleted job:", result);
}

// Example: Control the job runner
async function controlRunner() {
	// Stop the runner
	const stopRequest = new Request("http://localhost/jobs/runner/stop", {
		method: "POST",
	});
	await query.handler(stopRequest);
	console.log("Runner stopped");

	// Do some maintenance...

	// Start the runner again
	const startRequest = new Request("http://localhost/jobs/runner/start", {
		method: "POST",
	});
	await query.handler(startRequest);
	console.log("Runner started");
}

// Initialize jobs when your application starts
export async function initializeJobs() {
	console.log("Initializing jobs...");

	// Set up recurring jobs
	await setupCleanupJob();
	await setupSyncJob();

	console.log("Jobs initialized");
}

// Example: Common scheduling patterns
const scheduleExamples = {
	// Interval-based
	everyMinute: "1m",
	every5Minutes: "5m",
	every15Minutes: "15m",
	everyHour: "1h",
	every6Hours: "6h",
	daily: "1d",

	// Cron-based
	everyMinuteCron: "* * * * *",
	every5MinutesCron: "*/5 * * * *",
	hourly: "0 * * * *",
	daily2AM: "0 2 * * *",
	weeklyMonday9AM: "0 9 * * 1",
	monthlyFirst: "0 0 1 * *",
};

// Export for use in your application
export {
	setupCleanupJob,
	setupSyncJob,
	sendWelcomeEmails,
	triggerJob,
	listPendingJobs,
	getJobHistory,
	updateJobSchedule,
	deleteJob,
	controlRunner,
	scheduleExamples,
};
