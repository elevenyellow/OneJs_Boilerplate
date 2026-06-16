# Tasks: Align test location conventions across documentation

## Implementation order

Tasks follow documentation updates first, then canonical examples, then validation.

---

## Group 1: Documentation alignment

### Task 1.1: Update testing-standards SKILL

**Type**: Documentation

**What**: Rewrite `.agents/skills/guidelines/testing-standards/SKILL.md` to specify `tests/` folder structure instead of co-located tests.

**Steps**:
1. Read current SKILL file
2. Replace "Test location" section with new content specifying `tests/{unit,integration,e2e}/` structure
3. Add guidance on InMemory repository location (`src/infrastructure/`)
4. Add frontend exception note (React components can stay co-located)
5. Remove contradictory statements about "no separate tests/ hierarchy"

**Acceptance**:
- SKILL clearly states tests go in `tests/` folder
- InMemory repositories documented as living in `src/infrastructure/`
- No contradictions with AGENTS.md or testing.md

**COMMIT**: `docs(testing): align SKILL to use tests/ folder structure`

---

### Task 1.2: Update docs/conventions/patterns/testing.md

**Type**: Documentation

**What**: Modernize testing.md to reference Prisma/PGlite instead of MongoDB, add InMemory repository guidance.

**Steps**:
1. Read current testing.md
2. Replace all MongoDB/mongodb-memory-server references with Prisma/PGlite
3. Update integration test example to use `createTestPrisma()` from `@smoke/database/testing`
4. Add new section "InMemory Repository Fakes" explaining location and rationale
5. Update "Rules" section to mention InMemory fakes and PGlite
6. Ensure structure diagram matches `tests/{unit,integration,e2e}/` convention

**Acceptance**:
- No MongoDB references remain
- Integration test example uses PGlite
- InMemory repository location and rationale documented
- Structure matches SKILL and AGENTS.md

**COMMIT**: `docs(testing): update to Prisma/PGlite and add InMemory guidance`

---

### Task 1.3: Verify and clarify AGENTS.md

**Type**: Documentation

**What**: Ensure AGENTS.md clearly states test location convention and InMemory repository location.

**Steps**:
1. Read current AGENTS.md section on testing
2. Verify it mentions `tests/{unit,integration,e2e}/` structure
3. Add explicit note about InMemory repository location if missing
4. Add note about PGlite for integration tests if missing

**Acceptance**:
- AGENTS.md clearly states `tests/` folder structure
- Mentions InMemory repositories in `src/infrastructure/`
- Mentions PGlite for integration tests
- Consistent with SKILL and testing.md

**COMMIT**: `docs(testing): clarify test location in AGENTS.md`

---

## Group 2: Canonical examples in packages/users

### Task 2.1: Create UserInMemoryRepository

**Type**: Infrastructure (no TDD, test fake)

**What**: Create InMemory implementation of UserRepository in `packages/users/infrastructure/repositories/`.

**Steps**:
1. Create `packages/users/infrastructure/repositories/user-in-memory.repository.ts`
2. Implement `UserRepository` interface using a `Map<string, User>`
3. Implement all methods: `save`, `delete`, `findById`, `findByEmail`, `findForTable`
4. Add test helper method `clear()` (not on interface)
5. Export from `packages/users/infrastructure/index.ts`

**Acceptance**:
- File exists at correct location
- Implements all UserRepository methods
- Uses Map for in-memory storage
- Has `clear()` helper for tests
- No TypeScript errors

**COMMIT**: `feat(users): add UserInMemoryRepository for testing`

---

### Task 2.2: Create entity unit test

**Type**: Test (canonical example)

**What**: Create unit test for User entity in `packages/users/tests/unit/domain/entities/`.

**Steps**:
1. Create directory structure: `packages/users/tests/unit/domain/entities/`
2. Create `user.entity.test.ts`
3. Write tests following AAA structure and business-oriented naming:
   - Creates a user with valid data
   - Updates user properties correctly
   - Verifies email when requested
   - Converts to/from DTO correctly
4. Use `bun:test` imports
5. Follow "The [Subject]" describe format

**Acceptance**:
- File at `packages/users/tests/unit/domain/entities/user.entity.test.ts`
- Tests pass with `bun test`
- AAA structure with blank lines
- Business-oriented test names
- No TypeScript errors

**COMMIT**: `test(users): add User entity unit tests`

---

### Task 2.3: Create application service unit test

**Type**: Test (canonical example)

**What**: Create unit test for UserUpdater service using UserInMemoryRepository in `packages/users/tests/unit/application/`.

**Steps**:
1. Create directory structure: `packages/users/tests/unit/application/`
2. Create `user-updater.service.test.ts`
3. Write tests using UserInMemoryRepository:
   - Updates existing user successfully
   - Throws NotFoundError when user doesn't exist
   - Validates input data
4. Use `beforeEach` to set up fresh repository and service
5. Follow AAA structure and business naming

**Acceptance**:
- File at `packages/users/tests/unit/application/user-updater.service.test.ts`
- Uses UserInMemoryRepository from `../../infrastructure/repositories/`
- Tests pass with `bun test`
- AAA structure
- No TypeScript errors

**COMMIT**: `test(users): add UserUpdater service unit tests`

---

### Task 2.4: Create repository integration test

**Type**: Test (canonical example)

**What**: Create integration test for UserPrismaRepository using PGlite in `packages/users/tests/integration/infrastructure/repositories/`.

**Steps**:
1. Create directory structure: `packages/users/tests/integration/infrastructure/repositories/`
2. Create `user-prisma.repository.integration.test.ts`
3. Import `createTestPrisma` from `@smoke/database/testing`
4. Write tests:
   - Persists and retrieves a user
   - Returns undefined when user not found
   - Updates existing user
   - Deletes user
5. Use `beforeAll` to create Prisma client, `afterAll` to disconnect, `beforeEach` to clean data
6. Follow AAA structure

**Acceptance**:
- File at `packages/users/tests/integration/infrastructure/repositories/user-prisma.repository.integration.test.ts`
- Uses `createTestPrisma()` from `@smoke/database/testing`
- Tests pass with `bun test`
- Cleans data between tests
- No TypeScript errors

**COMMIT**: `test(users): add UserPrismaRepository integration tests`

---

## Group 3: Validation

### Task 3.1: Verify test discovery

**Type**: Validation

**What**: Ensure `bun test` discovers all new tests correctly.

**Steps**:
1. Run `bun test --dry-run` to see discovered tests
2. Verify all three new test files are discovered
3. Check `bunfig.toml` if needed (should auto-discover `*.test.ts`)
4. Run `bun test` to execute all tests
5. Verify all tests pass

**Acceptance**:
- `bun test --dry-run` shows all new test files
- `bun test` runs all tests successfully
- No configuration changes needed (or minimal if required)

**COMMIT**: (no commit, validation only)

---

### Task 3.2: Run full validation suite

**Type**: Validation

**What**: Run lint, typecheck, and tests to ensure no regressions.

**Steps**:
1. Run `bun run lint:fix`
2. Run `bun run typecheck`
3. Run `bun test`
4. All must pass

**Acceptance**:
- Zero lint errors
- Zero type errors
- All tests green

**COMMIT**: (no commit, validation only)

---

### Task 3.3: Run review tasks

**Type**: Validation

**What**: Run automated review tasks on changes.

**Steps**:
1. Run `/task-code-review` on:
   - `packages/users/infrastructure/repositories/user-in-memory.repository.ts`
2. Run `/task-tests-review` on:
   - `packages/users/tests/unit/domain/entities/user.entity.test.ts`
   - `packages/users/tests/unit/application/user-updater.service.test.ts`
   - `packages/users/tests/integration/infrastructure/repositories/user-prisma.repository.integration.test.ts`
3. Address any findings

**Acceptance**:
- Code review passes
- Tests review passes
- Any issues fixed

**COMMIT**: (fixes applied in previous commits if needed)

---

### Task 3.4: Final commit

**Type**: Finalization

**What**: Ensure all changes are committed with conventional commit message.

**Steps**:
1. Review `git status`
2. Ensure all files staged
3. If any uncommitted changes, commit with:
   ```
   docs(testing): align test location conventions across all documentation
   
   - Update testing-standards SKILL to specify tests/ folder structure
   - Modernize testing.md with Prisma/PGlite instead of MongoDB
   - Clarify test location and InMemory repository guidance in AGENTS.md
   - Add UserInMemoryRepository in packages/users/infrastructure/
   - Add canonical test examples in packages/users/tests/
   - Verify bun test discovers all tests correctly
   ```

**Acceptance**:
- Working tree clean
- All changes committed
- Conventional commit format

**COMMIT**: `docs(testing): align test location conventions across all documentation`

---

## Summary

**Total tasks**: 11 (3 groups)

**Estimated effort**:
- Group 1 (documentation): 1-2 hours
- Group 2 (canonical examples): 2-3 hours
- Group 3 (validation): 1 hour

**Total**: ~4-6 hours

**Dependencies**:
- Group 2 depends on Group 1 (docs first for reference)
- Group 3 depends on Group 2 (validate after implementation)

**Risk areas**:
- Test discovery patterns — verify bunfig.toml
- InMemory repository completeness — ensure all interface methods implemented
- Integration test setup — verify createTestPrisma() works correctly
