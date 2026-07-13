# OneJs Documentation

Welcome to the official documentation for **OneJs**, a modern, type-safe, and feature-rich framework for building scalable web applications with [Elysia.js](https://elysiajs.com/), [Bun](https://bun.sh/), and [Prisma](https://www.prisma.io/).

OneJs is designed with **Hexagonal Architecture** and **Domain-Driven Design (DDD)** principles at its core, providing a robust foundation for enterprise-grade applications.

## Table of Contents

### Getting started

1. [**Getting Started**](getting-started.md) — Installation and first steps
2. [**Architecture**](architecture.md) — Hexagonal Architecture and DDD in OneJs
3. [**Feature Walkthrough**](feature-walkthrough.md) — Build a new bounded context end-to-end

### Framework packages

4. [**Core Features** (`@OneJs/core`)](core-features.md) — DI, bootstrap, plugins, domain primitives
5. [**Routing & Controllers** (`@OneJs/server`)](routing.md) — HTTP routing with decorators
6. [**Database & Persistence** (`@OneJs/prisma`)](database.md) — Prisma + repository pattern
7. [**Authentication** (`@OneJs/auth`)](auth.md) — JWT, Clerk, role-based access
8. [**Events & Jobs** (`@OneJs/event-bus`, `@OneJs/jobs`)](events-jobs.md) — Event bus, handlers, BullMQ
9. [**Testing Package** (`@OneJs/testing`)](testing-package.md) — InMemory fakes for unit tests
10. [**Health & Observability**](health-and-observability.md) — Health checks, request-id, production readiness

### Conventions

11. [**Conventions overview**](conventions/readme.md) — Project-wide rules
12. [**DDD principles**](conventions/architecture/ddd-principles.md) — No magic strings, no primitives, immutable entities
13. [**Service patterns**](conventions/patterns/service-patterns.md)
14. [**Repository patterns**](conventions/patterns/repository-patterns.md)
15. [**Error handling**](conventions/patterns/error-handling.md)
16. [**Testing**](conventions/patterns/testing.md) — AAA, FIRST, unit vs integration
17. [**TDD practices**](conventions/patterns/tdd-practices.md)
18. [**Complete example**](conventions/examples/user-management/complete-implementation.md) — User management bounded context

## Why OneJs?

- 🚀 **Performance** — leverages Bun's speed and Elysia's lightweight routing
- 🏗️ **Maintainability** — enforces clean separation of concerns (Hexagonal + DDD)
- 💉 **Developer Experience** — built-in DI, decorator-based API, auto-loading
- 📦 **Batteries included** — auth, events, jobs, database, health, testing
- 🛡️ **Type-Safe** — end-to-end TypeScript, strict mode
- 🧪 **Test-friendly** — InMemory fakes shipped as a workspace package; no mocks in unit tests
