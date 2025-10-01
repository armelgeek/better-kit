# Jobs & Schedules Plugin

The Jobs plugin adds background job processing and scheduling capabilities to Better Query. It enables you to define, schedule, and execute recurring tasks with built-in retry logic, error handling, and execution history tracking.

## Features

- **Job Definition**: Create and manage background jobs with custom handlers
- **Flexible Scheduling**: Support for both cron expressions and interval-based schedules
- **Automatic Execution**: Built-in job runner that polls and executes scheduled jobs
- **Retry Logic**: Configurable retry attempts with exponential backoff
- **Execution History**: Track job execution history with status, errors, and results
- **Error Handling**: Comprehensive error tracking and logging
- **Manual Triggers**: Trigger jobs manually via API endpoints
- **Runner Control**: Start/stop the job runner programmatically

## Installation

The jobs plugin is included in the Better Query package:

```typescript
import { betterQuery, jobsPlugin } from "better-query";
```

## Basic Usage

### Setting Up the Plugin

```typescript
import { betterQuery, jobsPlugin } from "better-query";

// Define your job handlers
const handlers = {
  cleanupOldRecords: async (data: any) => {
    // Clean up old records
    console.log("Cleaning up records older than", data.days);
    // Your cleanup logic here
    return { deleted: 42 };
  },
  
  sendNotifications: async (data: any) => {
    // Send notifications
    console.log("Sending notifications to", data.users);
    // Your notification logic here
    return { sent: data.users.length };
  },
  
  generateReports: async () => {
    // Generate reports
    console.log("Generating daily reports");
    return { report: "generated" };
  },
};

export const query = betterQuery({
  database: {
    provider: "sqlite",
    url: "app.db",
    autoMigrate: true,
  },
  resources: [],
  plugins: [
    jobsPlugin({
      enabled: true,
      autoStart: true,           // Start job runner automatically
      pollInterval: 60000,        // Check for jobs every 60 seconds
      defaultMaxAttempts: 3,      // Retry failed jobs up to 3 times
      enableHistory: true,        // Track execution history
      handlers,                   // Register job handlers
    }),
  ],
});
```

## Scheduling Formats

The plugin supports two scheduling formats:

### Interval Expressions

Simple interval-based scheduling:

- `5s` - Every 5 seconds
- `10m` - Every 10 minutes
- `2h` - Every 2 hours
- `1d` - Every 1 day

### Cron Expressions

Standard cron format: `minute hour day month dayOfWeek`

- `*/5 * * * *` - Every 5 minutes
- `0 * * * *` - Every hour at minute 0
- `0 0 * * *` - Every day at midnight
- `0 9 * * 1` - Every Monday at 9 AM

**Note**: The current implementation supports basic cron expressions. For complex patterns, consider using a dedicated cron parser library.

## API Reference

### Creating Jobs

#### POST `/jobs`

Create a new job with optional scheduling.

**Request Body:**

```typescript
{
  name: string;          // Job name
  handler: string;       // Handler function name
  data?: any;           // Data passed to handler
  schedule?: string;    // Cron or interval expression
  maxAttempts?: number; // Max retry attempts (default: 3)
}
```

**Example:**

```typescript
// Using the client
const client = createQueryClient<typeof query>();

// Create a scheduled job
const job = await client.$post("/jobs", {
  body: {
    name: "Daily Cleanup",
    handler: "cleanupOldRecords",
    data: { days: 30 },
    schedule: "0 0 * * *", // Daily at midnight
    maxAttempts: 3,
  },
});
```

### Listing Jobs

#### GET `/jobs`

List all jobs with optional status filtering.

**Query Parameters:**
- `status` (optional): Filter by status (`pending`, `running`, `completed`, `failed`, `cancelled`)

**Example:**

```typescript
// List all pending jobs
const pendingJobs = await client.$get("/jobs?status=pending");

// List all jobs
const allJobs = await client.$get("/jobs");
```

### Getting Job Details

#### GET `/jobs/:id`

Get details of a specific job.

**Example:**

```typescript
const job = await client.$get(`/jobs/${jobId}`);
console.log(job.name, job.status, job.lastRunAt);
```

### Updating Jobs

#### PUT `/jobs/:id`

Update job configuration.

**Example:**

```typescript
await client.$put(`/jobs/${jobId}`, {
  body: {
    schedule: "*/10 * * * *", // Change to every 10 minutes
    maxAttempts: 5,
  },
});
```

### Deleting Jobs

#### DELETE `/jobs/:id`

Delete a job.

**Example:**

```typescript
await client.$delete(`/jobs/${jobId}`);
```

### Triggering Jobs Manually

#### POST `/jobs/:id/trigger`

Execute a job immediately, bypassing the schedule.

**Example:**

```typescript
await client.$post(`/jobs/${jobId}/trigger`);
```

### Job Execution History

#### GET `/jobs/:id/history`

Get execution history for a job (when `enableHistory` is enabled).

**Example:**

```typescript
const history = await client.$get(`/jobs/${jobId}/history`);
console.log(history.data); // Array of execution records
```

### Runner Control

#### POST `/jobs/runner/start`

Start the job runner.

```typescript
await client.$post("/jobs/runner/start");
```

#### POST `/jobs/runner/stop`

Stop the job runner.

```typescript
await client.$post("/jobs/runner/stop");
```

## Job Status Lifecycle

Jobs move through the following states:

1. **pending** - Job is waiting to be executed
2. **running** - Job is currently executing
3. **completed** - Job completed successfully (one-time jobs)
4. **failed** - Job failed after all retry attempts
5. **cancelled** - Job was manually cancelled

For scheduled jobs, after successful execution, they return to `pending` status with an updated `nextRunAt` time.

## Use Cases

### 1. Database Cleanup

```typescript
// Create a job to clean up old records daily
await client.$post("/jobs", {
  body: {
    name: "Clean Old Sessions",
    handler: "cleanupSessions",
    schedule: "0 2 * * *", // Run at 2 AM daily
    data: { olderThanDays: 30 },
  },
});
```

### 2. Periodic Data Sync

```typescript
// Sync data every 15 minutes
await client.$post("/jobs", {
  body: {
    name: "Sync External Data",
    handler: "syncData",
    schedule: "*/15 * * * *",
    data: { source: "external-api" },
  },
});
```

### 3. Report Generation

```typescript
// Generate weekly reports
await client.$post("/jobs", {
  body: {
    name: "Weekly Report",
    handler: "generateReport",
    schedule: "0 9 * * 1", // Monday at 9 AM
    data: { type: "weekly", recipients: ["admin@example.com"] },
  },
});
```

### 4. One-Time Deferred Task

```typescript
// Create a one-time job without schedule
await client.$post("/jobs", {
  body: {
    name: "Process Upload",
    handler: "processUpload",
    data: { fileId: "abc123" },
    // No schedule = executes once
  },
});
```

### 5. Email Notifications

```typescript
// Send daily digest emails
await client.$post("/jobs", {
  body: {
    name: "Daily Digest",
    handler: "sendDigest",
    schedule: "0 8 * * *", // 8 AM daily
    data: { template: "daily-digest" },
  },
});
```

## Advanced Configuration

### Custom Job Handlers

Define complex job handlers with error handling:

```typescript
const handlers = {
  processPayments: async (data: any) => {
    try {
      // Process payments
      const results = await processPaymentBatch(data.batchId);
      
      // Return results for history tracking
      return {
        processed: results.length,
        total: data.total,
        errors: results.filter(r => r.error).length,
      };
    } catch (error) {
      // Log error
      console.error("Payment processing failed:", error);
      throw error; // Will be caught and stored in job history
    }
  },
};
```

### Dynamic Job Registration

Register handlers at runtime:

```typescript
import { createJobHandler } from "better-query/plugins";

const customHandler = createJobHandler("myHandler", async (data) => {
  // Handler logic
  return { success: true };
});

// Use with the plugin
jobsPlugin({
  handlers: {
    [customHandler.name]: customHandler.handler,
  },
});
```

### Conditional Retry Logic

Jobs automatically retry based on `maxAttempts`. The plugin tracks attempt count and stops retrying after reaching the limit.

### Execution History Analysis

Query job execution history to monitor performance:

```typescript
// Get history for a specific job
const history = await client.$get(`/jobs/${jobId}/history`);

// Analyze execution times
const avgDuration = history.data.reduce((sum, h) => sum + h.duration, 0) / history.data.length;
console.log(`Average execution time: ${avgDuration}ms`);

// Check failure rate
const failures = history.data.filter(h => h.status === "failed").length;
const failureRate = (failures / history.data.length) * 100;
console.log(`Failure rate: ${failureRate}%`);
```

## Database Schema

The plugin creates the following tables:

### `jobs` Table

```typescript
{
  id: string;           // Unique job ID
  name: string;         // Job name
  handler: string;      // Handler function name
  data: any;           // JSON data for handler
  schedule: string;     // Cron or interval expression
  status: string;       // Job status
  attempts: number;     // Current attempt count
  maxAttempts: number;  // Max retry attempts
  lastRunAt: Date;      // Last execution time
  nextRunAt: Date;      // Next scheduled execution
  lastError: string;    // Last error message
  createdAt: Date;
  updatedAt: Date;
}
```

### `job_history` Table (when `enableHistory: true`)

```typescript
{
  id: string;          // Unique history entry ID
  jobId: string;       // Reference to job
  status: string;      // Execution status
  startedAt: Date;     // Execution start time
  completedAt: Date;   // Execution completion time
  error: string;       // Error message if failed
  result: any;         // Execution result (JSON)
  duration: number;    // Execution duration in ms
}
```

## Performance Considerations

1. **Poll Interval**: Adjust `pollInterval` based on your needs. Lower values provide more responsive job execution but increase CPU usage.

2. **History Retention**: Consider implementing a cleanup job to remove old history entries:

```typescript
handlers: {
  cleanupHistory: async () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    // Delete old history entries
    await adapter.delete("job_history", {
      where: { completedAt: { lt: thirtyDaysAgo } }
    });
  },
}
```

3. **Long-Running Jobs**: For jobs that take a long time, consider implementing progress tracking or breaking them into smaller tasks.

## Error Handling

The plugin provides comprehensive error handling:

- **Automatic Retries**: Failed jobs are automatically retried up to `maxAttempts`
- **Error Logging**: Errors are stored in both job record and history
- **Status Tracking**: Job status reflects current execution state
- **History Tracking**: All execution attempts are recorded (when enabled)

## Integration with Other Plugins

The jobs plugin works seamlessly with other Better Query plugins:

### With Audit Plugin

```typescript
plugins: [
  auditPlugin({ enabled: true }),
  jobsPlugin({ 
    handlers: {
      auditCleanup: async () => {
        // Clean up old audit logs
      },
    },
  }),
]
```

### With Cache Plugin

```typescript
handlers: {
  invalidateCache: async (data) => {
    // Invalidate cache based on pattern
    await cacheInvalidate(data.pattern);
  },
}
```

## Best Practices

1. **Handler Naming**: Use descriptive names for job handlers
2. **Idempotency**: Design handlers to be idempotent (safe to retry)
3. **Timeout Handling**: Implement timeouts in long-running handlers
4. **Resource Management**: Clean up resources properly in handlers
5. **Error Reporting**: Log errors appropriately for debugging
6. **Schedule Testing**: Test cron expressions before deploying
7. **Monitoring**: Regularly check job execution history for failures

## Troubleshooting

### Jobs Not Running

- Check that `autoStart: true` or manually start the runner
- Verify `nextRunAt` is in the past
- Ensure handler is registered
- Check job status is `pending`

### Jobs Failing Repeatedly

- Check handler implementation for errors
- Review `lastError` field for details
- Verify data passed to handler is valid
- Check database connectivity and permissions

### Performance Issues

- Reduce `pollInterval` if jobs are delayed
- Optimize handler execution time
- Consider horizontal scaling for high-volume workloads
- Archive old job history records

## Future Enhancements

Potential improvements for future versions:

- Priority queues for job execution
- Distributed job processing across multiple servers
- Web UI for job management and monitoring
- Advanced cron expression support (nth day of month, etc.)
- Job dependencies (run job B after job A completes)
- Webhook notifications on job completion/failure
- Rate limiting and throttling
- Dead letter queues for permanently failed jobs

## License

Part of the Better Query package. See the main project license for details.
