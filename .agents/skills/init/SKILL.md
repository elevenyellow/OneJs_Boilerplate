---
name: init
description: Initialize a new project from the DDD fullstack starter template
---

# Project Initialization Wizard

You are initializing a new project from the DDD fullstack starter template. Guide the user through the setup process.

## Execution Context

This mode supports two execution contexts:

1. **Inside a freshly cloned template** (user ran `git clone` then `opencode`)
   - Use `bun run init -n <name> -i <identifier> --skip-git-check ...`
   - The script personalizes the current directory in-place

2. **Outside any project** (user wants to create a new project from scratch)
   - Use `bunx github:elevenyellow/ddd-fullstack-starter init -t <target-dir> -n <name> -i <identifier> ...`
   - The script clones the template to `<target-dir>`, then personalizes it

Detect the context by checking if `package.json` exists and contains `"name": "ddd-fullstack-starter"`. If yes, context 1. Otherwise, context 2.

## Pre-requisites Check

First, verify the environment:

```bash
# Check Bun is installed
bun --version

# Check Docker or Podman is available (for PostgreSQL/Redis)
docker --version || podman --version
```

If Bun is missing, inform the user and provide installation instructions before proceeding.

**Note**: Either Docker or Podman works for container management. The init script automatically detects which one is available and configures the `dbs` script accordingly. Docker/Podman is **not needed** for `--components none` (minimal mode).

## Information Gathering

Gather the following information from the user conversationally (ask one question at a time, wait for response):

### 0. Target Directory (Context 2 only)
If execution context is 2 (outside any project), ask:
- **Target directory**: Where to create the new project
- Must be a valid path (relative or absolute)
- Will be created if it doesn't exist
- Example: `../my-new-project` or `/home/user/projects/my-app`

### 1. Project Name
- Must be lowercase
- Can contain letters, numbers, and hyphens
- Must start with a letter
- Example: `my-awesome-project`

### 2. Components to Include
Ask the user which components they want:
- **Webapp + Mobile** (recommended) - Full stack with Vite SPA web application and Expo mobile app
- **Webapp only** - Just the Vite SPA web application
- **Mobile only** - Just the Expo mobile application
- **None** (Minimal DDD monorepo) - No apps, no database, no auth. Pure DDD monorepo with only `packages/common/`

### 3. Package Identifier
- Must start with `@`
- Suggest based on project name initials (e.g., `@map` for `my-awesome-project`)
- Example: `@myproject` or `@mp`

### 4. Database Configuration
**Skip this section entirely if user selected "None" for components.**

Ask about database setup:
- **PostgreSQL port**: Default is 5432. Ask if they want a custom port (useful if 5432 is already in use)
- **Include Redis?**: Redis is optional. Ask if they need it (for caching, sessions, etc.)
- **Redis port**: Only if Redis is included. Default is 6379

### 5. SaaS Features
Ask if this is a SaaS project:
- **Yes** (default) - Includes user roles (admin/user), admin panel with users table, role-based route protection
- **No** - Simple app without roles or admin panel

### 6. Email Provider
Ask which email provider to use:
- **SendGrid** (default) — Uses nodemailer with SMTP transport. Requires `EMAIL_SERVER` env var.
- **Resend** — Uses Resend SDK with API key. Requires `RESEND_API_KEY` env var.

## Execution

Once you have all the information, construct the appropriate command based on execution context:

### Context 1: Inside cloned template

```bash
bun run init -n <project-name> -i <identifier> --skip-git-check [OPTIONS]
```

### Context 2: Outside any project

```bash
bunx github:elevenyellow/ddd-fullstack-starter init -t <target-dir> -n <project-name> -i <identifier> [OPTIONS]
```

**OPTIONS** (same for both contexts):
- `--components <webapp,mobile|webapp|mobile|none>`
- `--postgres-port <port>` (if not "none")
- `--redis-port <port>` (if Redis included and not "none")
- `--no-redis` (if Redis not included and not "none")
- `--no-saas` (if SaaS features not wanted)
- `--email-provider <sendgrid|resend>` (if not "none")

**Examples:**

```bash
# Context 1: Full SaaS with Redis (SendGrid by default)
bun run init -n my-project -i @mp --components webapp,mobile --postgres-port 5432 --redis-port 6379 --skip-git-check

# Context 1: With Resend as email provider
bun run init -n my-project -i @mp --components webapp --postgres-port 5432 --email-provider resend --skip-git-check

# Context 1: Without Redis
bun run init -n my-project -i @mp --components webapp,mobile --postgres-port 5432 --no-redis --skip-git-check

# Context 1: Without SaaS features
bun run init -n my-project -i @mp --components mobile --postgres-port 5432 --no-saas --skip-git-check

# Context 1: Minimal mode
bun run init -n my-project -i @mp --components none --skip-git-check

# Context 2: Full SaaS from scratch
bunx github:elevenyellow/ddd-fullstack-starter init -t ../my-new-project -n my-project -i @mp --components webapp,mobile --postgres-port 5432

# Context 2: Minimal mode from scratch
bunx github:elevenyellow/ddd-fullstack-starter init -t /home/user/projects/my-app -n my-app -i @ma --components none
```

### Post-Init Steps (Context 1 only)

After the init script completes successfully in Context 1, guide the user through:

#### For Fullstack Mode (webapp, mobile, or both):

**Step 1: Install dependencies**
```bash
bun install
```

**Step 2: Start database services**
```bash
bun run dbs
```

Wait for containers to be ready, then:

**Step 3: Sync database schema**
```bash
bun run db:sync
```

#### For Minimal Mode (none):

**Step 1: Install dependencies**
```bash
bun install
```

Steps 2 and 3 (database) are not needed in minimal mode.

### Post-Init Steps (Context 2 only)

In Context 2, the `bunx` command handles everything automatically (clone, personalize, git reset). Inform the user:

1. The project was created at `<target-dir>`
2. Next steps:
   - `cd <target-dir>`
   - `bun install`
   - If fullstack: `bun run dbs` then `bun run db:sync`
   - Start developing!

## Post-Initialization Summary

After successful initialization, show the user:

1. **Summary of changes made** (read from CLI output)
2. **Available commands** based on selected components:
   - If webapp included: `bun run webapp` - Start webapp at localhost:3000
   - If mobile included: `bun run mobile` - Start Expo development server
   - If not "none": `bun run dbs` - Start/restart database services
   - **If "none" selected**: Only code quality commands are available (lint, typecheck, format)

3. **Next steps**:
   - If components is "none":
     - Review the code structure in `packages/common/`
     - Update `docs/development/roadmap.md` with project goals
     - Create your first bounded context as a new package
     - Start developing!
   - Otherwise:
     - Review the code structure in `packages/` and `apps/`
     - Update `docs/development/roadmap.md` with project goals
     - Start developing!

## Error Handling

If any step fails:
1. Show the error clearly
2. Suggest common fixes
3. Reference the checklist.md for troubleshooting

### Common Issues

**Port already in use**: If a database port is occupied, the init script allows specifying custom ports. Re-run with `--postgres-port <port>` or `--redis-port <port>`.

**Container runtime not found**: Install Docker Desktop or Podman. The script auto-detects and configures the appropriate command. Not needed for minimal mode.

## Important Notes

- **Context 1**: The script creates a backup before making changes (unless `--no-backup` is set)
- **Context 2**: No backup needed (fresh clone is disposable); `--skip-git-check` and `--no-backup` are auto-set
- Use `--dry-run` first if the user wants to preview changes (Context 1 only)
- All `@dfs` references will be replaced with the new identifier
- Database URLs and ports will be configured in `.env.local` (fullstack mode only)
- Container runtime (Docker/Podman) is auto-detected and configured (fullstack mode only)
- Redis is optional and can be excluded with `--no-redis`
- SaaS features (roles, admin panel) are optional and can be excluded with `--no-saas`
- Email provider defaults to SendGrid, use `--email-provider resend` for Resend
- Use `--components none` for a minimal DDD monorepo without apps, database, or auth
- **Context 2** supports `--template-url` to clone from a fork (default: `git@github.com:elevenyellow/ddd-fullstack-starter.git`)
- **Context 2** supports `--ref` to clone a specific branch/tag (default: `main`)
- **Context 2** supports `--force` to overwrite an existing non-empty target directory (use with caution)
