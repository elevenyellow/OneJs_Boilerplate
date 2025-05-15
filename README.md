# Elysia.js Boilerplate

A modern, type-safe, and feature-rich boilerplate for building web applications with Elysia.js, Bun, and MongoDB.

## Features

- 🚀 **Built with Elysia.js** - A fast, type-safe web framework
- ⚡ **Powered by Bun** - The all-in-one JavaScript runtime & toolkit
- 🗄️ **MongoDB Integration** - Ready-to-use database setup with Docker
- 📦 **TypeScript Support** - Full type safety out of the box
- 🎨 **Biome Integration** - Modern code formatting and linting
- 🐳 **Docker Support** - Easy development environment setup
- 📝 **CLI Tool** - Create new applications with ease

## Prerequisites

- [Bun](https://bun.sh/) (Latest version)
- [Docker](https://www.docker.com/) or [Podman](https://podman.io/)
- [Node.js](https://nodejs.org/) (v18 or later)

## Getting Started

1. Clone the repository:
```bash
git clone <repository-url>
cd eyjs-boilerplate
```

2. Install dependencies:
```bash
bun install
```

3. Start the development environment:
```bash
# Start MongoDB and the application
bun start:dev

# Or start only the application (if MongoDB is already running)
bun start:dev:simple
```

## Available Scripts

- `bun start:db` - Start the MongoDB database using Docker/Podman
- `bun start:dev` - Start both the database and the application in development mode
- `bun start:dev:simple` - Start only the application in development mode
- `bun start` - Start the application in production mode
- `bun test` - Run tests
- `bun create-app` - Create a new application using the CLI tool

## Project Structure

```
eyjs-boilerplate/
├── src/              # Source code
├── packages/         # Additional packages and tools
├── data/            # MongoDB data persistence
├── .vscode/         # VS Code configuration
├── docker-compose.yml # Docker configuration
├── biome.json       # Biome configuration
├── tsconfig.json    # TypeScript configuration
└── package.json     # Project dependencies and scripts
```

## Database Setup

The boilerplate includes a MongoDB setup using Docker/Podman. The database is configured to run on port 27017 with the following default settings:

- Database name: ddd-boilerplate
- Port: 27017
- Data persistence: ./data directory

## Development

1. The application uses Biome for code formatting and linting. Make sure to install the Biome extension in your IDE.

2. For VS Code users, the project includes recommended extensions and settings in the `.vscode` directory.

3. The project uses TypeScript for type safety. Make sure to follow the type definitions and interfaces.

## Creating New Applications

You can create new applications using the included CLI tool:

```bash
bun create-app
```

This will guide you through the process of creating a new application with the boilerplate structure.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Available Packages

The boilerplate includes several packages that provide different functionalities:

### Core Package (`packages/core`)
The foundation of the boilerplate that provides essential functionality:
- Server configuration and setup
- Event bus system for event-driven architecture
- Logging system
- Auto-loader for automatic module loading
- Dependency injection container
- Configuration management

### Create App (`packages/create-app`)
A CLI tool to generate new applications with a hexagonal architecture:
```bash
bun create-app my-new-app
```
This will create a new application with the following structure:
```
my-new-app/
├── domain/          # Business logic and domain models
├── application/     # Use cases and application services
├── infrastructure/  # External services and implementations
└── interfaces/      # API endpoints and controllers
```

### Authentication (`packages/auth`)
Provides authentication and authorization functionality:
- JWT token management
- User authentication
- Role-based access control
- Session management

### MongoDB Integration (`packages/mongo`)
MongoDB database integration with:
- Connection management
- Repository pattern implementation
- Query builders
- Data validation

### Prisma Integration (`packages/prisma`)
Alternative database integration using Prisma ORM:
- Type-safe database queries
- Schema management
- Migration tools
- Database seeding

### Background Jobs (`packages/jobs`)
Background job processing system:
- Job queue management
- Worker processes
- Scheduled tasks
- Job monitoring

## Using the Packages

1. **Creating a New Application**
```bash
# Create a new application with hexagonal architecture
bun create-app my-app

# The application will be created in src/apps/my-app
```

2. **Adding Authentication**
```typescript
import { AuthService } from '@boilerplate/auth'

// Initialize auth service
const auth = new AuthService()

// Use authentication in your routes
app.post('/login', async (c) => {
  const token = await auth.login(c.body)
  return { token }
})
```

3. **Using MongoDB**
```typescript
import { MongoRepository } from '@boilerplate/mongo'

// Create a repository for your entity
const userRepo = new MongoRepository('users')

// Use the repository
const users = await userRepo.find({ role: 'admin' })
```

4. **Setting up Background Jobs**
```typescript
import { JobQueue } from '@boilerplate/jobs'

// Create a job queue
const queue = new JobQueue()

// Add a job
await queue.add('process-data', { data: 'example' })
``` 