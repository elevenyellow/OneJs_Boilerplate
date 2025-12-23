# @OneJs/jobs

Job queue system for OneJs framework with BullMQ integration.

## Installation

```bash
npm install @OneJs/jobs
```

## Features

- **BullMQ Integration**: Redis-based job queue system
- **Worker Decorators**: `@WorkerJob` decorator for job handlers
- **Queue Management**: Automatic queue and worker registration
- **Concurrency Control**: Configurable worker concurrency

## Usage

### Basic Setup

```typescript
import { OneJs, PluginRegistry } from '@OneJs/core'
import { JobsPlugin } from '@OneJs/jobs'

PluginRegistry.register(new JobsPlugin())

const oneJs = new OneJs(import.meta.url)
await oneJs.start()
```

### Creating Job Handlers

```typescript
import { Injectable, Inject } from '@OneJs/core'
import { WorkerJob } from '@OneJs/jobs'

@Injectable()
export class EmailService {
  constructor(@Inject(Logger) private logger: Logger) {}

  @WorkerJob('email-queue', { concurrency: 5 })
  async sendEmail(job: Job<EmailJobData>): Promise<void> {
    const { to, subject, body } = job.data
    
    this.logger.info('email:send', `Sending email to ${to}`)
    
    // Send email logic here
    await this.emailProvider.send({ to, subject, body })
  }
}
```

### Adding Jobs to Queue

```typescript
import { Injectable, Inject } from '@OneJs/core'
import { QueueService } from '@OneJs/jobs'

@Injectable()
export class UserService {
  constructor(@Inject(QueueService) private queueService: QueueService) {}

  async createUser(userData: CreateUserDto): Promise<User> {
    const user = await this.userRepository.create(userData)
    
    // Add job to queue
    await this.queueService.add('email-queue', 'send-welcome-email', {
      to: user.email,
      subject: 'Welcome!',
      body: 'Welcome to our platform!'
    })
    
    return user
  }
}
```

### Job Configuration

```typescript
@WorkerJob('email-queue', {
  concurrency: 10,
  delay: 5000, // 5 second delay
  attempts: 3,
  backoff: 'exponential'
})
async processEmail(job: Job): Promise<void> {
  // Job processing logic
}
```

## Jobs Plugin

The `JobsPlugin` automatically:
- Registers `QueueService` and `WorkerService`
- Discovers and registers all `@WorkerJob` decorated methods
- Starts workers for registered job handlers

## Queue Management

```typescript
import { QueueService } from '@OneJs/jobs'

// Add job with options
await queueService.add('queue-name', 'job-type', data, {
  delay: 1000,
  attempts: 3,
  priority: 10
})

// Get queue statistics
const stats = await queueService.getQueueStats('queue-name')
```
