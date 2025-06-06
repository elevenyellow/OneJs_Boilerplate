# Jobs Package

A robust job queue system built on top of BullMQ and Redis, designed to handle background tasks and scheduled jobs in your application.

## Features

- 🚀 Easy-to-use queue management system
- ⚡ High-performance job processing
- 🔄 Automatic job deduplication
- 📊 Queue metrics and monitoring
- 🔌 Redis-based persistence
- 🎯 TypeScript support
- 🔄 Event-driven architecture

## Prerequisites

- Node.js 16+ or Bun runtime
- Redis server
- TypeScript 5.0+

## Installation

1. Install the package in your project:

```bash
npm install containerv2
# or
yarn add containerv2
# or
bun add containerv2
```

2. Make sure you have Redis running and accessible in your environment.

## Configuration

The package requires a Redis connection. Configure your Redis connection through your application's configuration system. The package expects the following environment variables:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password  # Optional
```

## Usage

### 1. Setting Up the Queue Service

```typescript
import { QueueService } from 'containerv2';

// In your application setup
const queueService = new QueueService(configService, logger);

// Add a job to a queue
await queueService.add('my-queue', 'job-name', {
  data: 'my-data'
}, {
  delay: 5000, // Optional delay in milliseconds
  attempts: 3  // Optional retry attempts
});
```

### 2. Setting Up Workers

```typescript
import { WorkerService } from 'containerv2';

// In your application setup
const workerService = new WorkerService(configService, logger, eventBus);

// Register a worker
workerService.registerWorker('my-queue', async (job) => {
  // Process the job
  const { data } = job.data;
  // Your processing logic here
  return result;
}, 5); // Optional concurrency (default: 1)

// Start all workers
workerService.startAll();
```

### 3. Advanced Features

#### Unique Jobs

To prevent duplicate jobs:

```typescript
// Add a unique job based on data content
await queueService.addUniqueByData('my-queue', 'job-name', {
  userId: 123,
  action: 'process'
});

// Add a job with explicit ID
await queueService.addUnique('my-queue', 'job-name', 'custom-id', {
  data: 'my-data'
});
```

#### Queue Management

```typescript
// Pause a queue
await queueService.pauseQueue('my-queue');

// Resume a queue
await queueService.resumeQueue('my-queue');

// Clean completed jobs
await queueService.cleanQueue('my-queue', 3600000, 'completed');

// Get queue metrics
const metrics = await queueService.getQueueMetrics('my-queue');
console.log(metrics);
// {
//   waiting: 0,
//   active: 1,
//   completed: 10,
//   failed: 0,
//   delayed: 2
// }
```

#### Job Monitoring

```typescript
// Get jobs by status
const completedJobs = await queueService.getJobs('my-queue', 'completed');
const failedJobs = await queueService.getJobs('my-queue', 'failed');
const waitingJobs = await queueService.getJobs('my-queue', 'waiting');
```

## Best Practices

1. **Error Handling**: Always implement proper error handling in your job processors.
2. **Job Deduplication**: Use `addUniqueByData` when you want to prevent duplicate jobs.
3. **Resource Management**: Set appropriate concurrency levels based on your system's capabilities.
4. **Monitoring**: Regularly check queue metrics to ensure system health.
5. **Cleanup**: Implement regular cleanup of completed jobs to prevent Redis memory issues.

## Events

The package emits several events that you can listen to:

- `RegisterWorkerEvent`: When a new worker is registered
- `WorkerStartedEvent`: When a worker starts processing
- `WorkerStoppedEvent`: When a worker stops

## Development

To run the package in development mode:

```bash
bun run start:dev
```

To run tests:

```bash
bun test
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This package is private and proprietary.

## Support

For support, please contact the development team. 