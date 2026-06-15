---
name: design-principles
description: Design, naming, and error-handling rules for this monorepo — kebab-case files, PascalCase classes, run() service entry point, @Injectable()/@Inject() DI, no getters/setters, rich domain models, OneJsError. Load when writing, renaming, or reviewing TypeScript code in packages/.
---

# Design Principles

Short checklist. Canonical rules live in `docs/conventions/` — go there for full tables, examples, and edge cases.

## Naming

- Files: `kebab-case.ts` — no `.entity.ts` / `.vo.ts` suffixes; the directory (`entities/`, `value-objects/`) provides context.
- Suffixes used: `.service.ts`, `.repository.interface.ts`, `.repository.ts`, `.controller.ts`, `.event.ts`, `.dto.ts`.
- Classes: `PascalCase`. Repository interfaces: `I[Entity]Repository` (with `I` prefix).
- Methods: `camelCase`. Constants: `SCREAMING_SNAKE_CASE`.
- Functions = verbs (`findByEmail`). Classes = nouns (`UserCreator`).
- No `helper`, `util`, `manager` catch-alls. No `Impl`, `Abstract` unless the abstraction is real.
- No factory classes — use `@Injectable()` / `@Inject()`.

→ Full tables and examples: [naming-conventions.md](../../../../docs/conventions/naming-conventions.md)

## Classes and modules

- `@Injectable()` on every service and repository implementation; `@Inject(ConcreteClass)` on constructor params.
- Inject by interface type, bind via concrete token: `@Inject(InMemoryRepo) private readonly repo: IRepo`.
- No service locators, no globals, no factory classes.
- No getters/setters on domain models — expose behavior through named methods.
- Rich domain models — invariants and transitions belong on the entity, not in a service.
- Application services expose a single public `run(vo|entity)` method. No `UseCase` suffix.
- **No primitives as parameters**: `run()` and repository interface methods receive VOs, entities, or aggregates.
- Entities are immutable: all properties `readonly`; state transitions via `with*()` returning new instances.

→ Full service pattern: [patterns/service-patterns.md](../../../../docs/conventions/patterns/service-patterns.md)

## Functions

- Single responsibility.
- Guard clauses over deep nesting.
- Boolean parameters split into specific functions (`activateUser()` / `deactivateUser()`, not `setActive(bool)`).
- Return types inferred by TypeScript — only annotate on interfaces and abstract methods.
- Rule of Three: don't abstract before the third occurrence of duplication.

## Error handling

- Domain failures throw `OneJsError` from `@OneJs/core` with a `ErrorCodes` value — never `new Error()`.
- Signature: `new OneJsError(type, statusCode, message, details, ErrorCodes.CODE)`.
- **No magic strings**: every error type label, error message, and log scope is a named constant per bounded context — never inline. See [ddd-principles.md — No Magic Strings](../../../../docs/conventions/architecture/ddd-principles.md#no-magic-strings).
- Infrastructure failures propagate; wrap with context only when it adds value.
- Never `catch (e) {}`. Never `@ts-ignore` or `as any` to mask a type problem.

→ Full patterns and status-code table: [patterns/error-handling.md](../../../../docs/conventions/patterns/error-handling.md)

## Comments and JSDoc

- No JSDoc by default — TypeScript types are the contract.
- Only comment the *why* when it's non-obvious (hidden constraint, workaround, surprising invariant).
- Never reference the current task, ticket, or author in comments.
