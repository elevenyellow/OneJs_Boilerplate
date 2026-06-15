# Proposal: Align test location conventions across documentation

## Problem

There is a **critical contradiction** in the template's testing guidelines that causes agents and developers to place tests inconsistently:

1. **AGENTS.md** (line ~32) states: *"Tests live in `tests/{unit,integration,e2e}/` inside each package, mirroring the source layout"*

2. **testing-standards SKILL** (`.agents/skills/guidelines/testing-standards/SKILL.md`) states: *"Unit tests: `<name>.test.ts` **next to** the source file. No `__tests__/` folders. No separate `tests/` hierarchy mirroring `src/`."*

3. **docs/conventions/patterns/testing.md** states: *"Tests live inside each module: `package/[module-name]/tests/` with `unit/`, `integration/`, `e2e/` subdirectories"*

The SKILL file (which agents load automatically) directly contradicts both AGENTS.md and the canonical testing.md documentation. This causes agents to co-locate tests next to source files instead of organizing them in a dedicated `tests/` folder structure.

Additionally, `docs/conventions/patterns/testing.md` is **outdated**:
- References MongoDB and `mongodb-memory-server` when the actual stack uses **Prisma + PGlite** (`createTestPrisma()` from `@dfs/database/testing`)
- No examples exist in `packages/users` to serve as a canonical reference

## Solution

Align all three sources of truth to consistently specify:

1. **Test location**: `tests/{unit,integration,e2e}/` folder structure mirroring source layout
2. **InMemory repositories**: Live in `infrastructure/` next to production adapters (for reusability)
3. **Stack references**: Update all MongoDB references to Prisma + PGlite
4. **Canonical example**: Add reference tests in `packages/users` so agents have a living pattern to copy

## Goals

- **Single source of truth**: All documentation (AGENTS.md, SKILL, testing.md) says the same thing
- **Agent consistency**: Agents automatically place tests in the correct location
- **Modern stack**: Documentation reflects actual tooling (Prisma/PGlite, not MongoDB)
- **Living example**: `packages/users` has reference tests showing the pattern
- **Backward compatible**: No breaking changes to existing test runner configuration

## Non-goals

- Migrating existing tests in other packages (if any exist) — this is a forward-looking convention
- Changing test runner (stays `bun test`)
- Changing test framework (stays `bun:test`)
- Frontend component test location (addressed separately if needed)
- Enforcing the convention via linting (future enhancement)

## Affected components

- **AGENTS.md** — verify/clarify test location wording
- **.agents/skills/guidelines/testing-standards/SKILL.md** — rewrite to specify `tests/` folder structure
- **docs/conventions/patterns/testing.md** — update MongoDB → Prisma/PGlite, clarify structure
- **packages/users/** — add canonical test examples (entity unit, service unit, repository integration)
- **bunfig.toml** — verify test discovery patterns still work

## Success criteria

1. All three documentation sources (AGENTS.md, SKILL, testing.md) specify the same test location convention
2. MongoDB references replaced with Prisma/PGlite throughout testing.md
3. `packages/users/tests/` contains at least 3 reference tests:
   - `tests/unit/domain/user.entity.test.ts` (entity unit test)
   - `tests/unit/application/user-creator.service.test.ts` (service with InMemory repo)
   - `tests/integration/infrastructure/user-prisma.repository.integration.test.ts` (PGlite integration)
4. `bun test` discovers and runs all tests successfully
5. Agent creates tests in `tests/` folder when asked to generate tests

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Breaking existing test discovery | Verify `bunfig.toml` patterns before/after, run `bun test` |
| InMemory repos in `src/infrastructure/` feel wrong | Document rationale: reusability across contexts, compile-time safety |
| Frontend tests unclear (React components) | Document pragmatic exception: frontend components can stay co-located per React conventions |
| Agents still place tests incorrectly | Add canonical examples in `packages/users` for agents to reference |
