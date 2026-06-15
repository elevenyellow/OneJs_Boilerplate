# Agentic Workflow

This template is designed to work with AI agents as teammates, not just autocomplete. The agentic system has five pieces that work together to give agents context, process, and guardrails.

## Overview

```
  ┌──────────────────────────────────────────────────────┐
  │  WHAT YOU GIVE THE AGENT (substrate)                 │
  │  ─────────────────────────────────────────────────   │
  │  1. A SINGLE SOURCE OF TRUTH                         │
  │     canonical .agents/ + symlinks + AGENTS.md        │
  │                                                      │
  │  2. GUIDELINES AS CONTEXT                            │
  │     Your conventions loaded in every conversation    │
  ├──────────────────────────────────────────────────────┤
  │  HOW YOU USE IT (machinery)                          │
  │  ─────────────────────────────────────────────────   │
  │  3. AGENTS, SUBAGENTS AND SKILLS                     │
  │     A team with roles, not a single assistant        │
  │                                                      │
  │  4. OPENSPEC WORKFLOW                                │
  │     Specify before implementing                      │
  │                                                      │
  │  5. OPENCODE MODES                                   │
  │     Each phase, the right brain and the right perms  │
  └──────────────────────────────────────────────────────┘
```

**Core principle**: An agent without context and without process is an intern in a hurry. With context and with process, it's a teammate.

---

## 1. A Single Source of Truth

### The Problem

Every AI tool wants its own folder: `.claude/`, `.cursor/`, `.github/copilot/`, `.opencode/`. Duplicating content across all of them guarantees they'll be out of sync within two weeks.

### How It Works

- **One canonical folder**: `.agents/` with `agents/` (subagent definitions) and `skills/` (loadable prompts).
- **The rest are symlinks** to that single folder.
- **`AGENTS.md` at the repo root** as the universal entry point (Cursor and Copilot read it directly).

```
.agents/                          ← source of truth
├── agents/                       ← subagent definitions (9 roles)
│   ├── code-reviewer.md
│   ├── architecture-reviewer.md
│   ├── tests-reviewer.md
│   ├── frontend-reviewer.md
│   ├── spec-writer.md
│   ├── spec-reviewer.md
│   ├── project-validator.md
│   ├── qa-tester.md
│   └── ux-reviewer.md
└── skills/                       ← loadable prompts (16 skills)
    ├── guidelines/               ← project conventions
    │   ├── design-principles/
    │   ├── hexagonal-architecture/
    │   ├── tdd-practices/
    │   ├── testing-standards/
    │   ├── frontend-patterns/
    │   └── git-strategy/
    ├── openspec-*/               ← spec-driven workflow
    ├── action-*/                 ← focused workflows (TDD, refactor, tests)
    └── task-*/                   ← task automations (validate, review, QA)

.claude/agents  → ../.agents/agents      ← symlink
.claude/skills  → ../.agents/skills      ← symlink

AGENTS.md                         ← universal entry point
```

### Operational Rule

> Always edit inside `.agents/`. Never through the symlinks.
> Reference `.agents/...` in config and docs. Never `.claude/...`.

The symlinks exist for tool compatibility, not as a canonical path.

---

## 2. Guidelines as Context

### The Problem

If your conventions live in your head, the agent ignores them. If they live in a wiki, nobody reads them. If they live in the repo but aren't loaded, the agent improvises.

### How It Works

- **Conventions as skills** in `.agents/skills/guidelines/` (naming, architecture, testing, TDD, frontend, git).
- **Short format**: 30-50 lines per skill, actionable checklist, no fluff.
- **Auto-loaded** via `instructions[]` in `opencode.json`: injected into *every* conversation.

```jsonc
// opencode.json
"instructions": [
  "AGENTS.md",
  ".agents/skills/guidelines/design-principles/SKILL.md",
  ".agents/skills/guidelines/hexagonal-architecture/SKILL.md",
  ".agents/skills/guidelines/tdd-practices/SKILL.md",
  ".agents/skills/guidelines/testing-standards/SKILL.md",
  ".agents/skills/guidelines/frontend-patterns/SKILL.md",
  ".agents/skills/guidelines/git-strategy/SKILL.md"
]
```

Each skill has a standard header:

```yaml
---
name: design-principles
description: Design, naming, and error-handling rules — load when
             writing or reviewing TypeScript code in packages/.
---
```

The `description` tells the agent **when** to load the skill.

### What Gets Loaded

The skills are **short checklists** that reference the full documentation in `docs/conventions/`. For example, `design-principles/SKILL.md` is 50 lines and links to:

- [naming-conventions.md](../naming-conventions.md)
- [patterns/service-patterns.md](../patterns/service-patterns.md)
- [patterns/error-handling.md](../patterns/error-handling.md)

The agent reads the full docs on demand when it needs detail.

---

## 3. Agents, Subagents and Skills

### Mental Model

| Piece | Is | Lives in |
|---|---|---|
| **Skill** | A loadable prompt (how to do something) | `.agents/skills/` |
| **Agent** | A role: model + tools + loaded skill | `.agents/agents/` |
| **Subagent** | An agent that another agent can invoke | same place, `mode: subagent` |

**Skills** are the WHAT to do. **Agents** are the WHO does it.

### Team Roles

The template includes 9 subagents:

- **code-reviewer** — reviews production code against design, naming, and error-handling rules
- **architecture-reviewer** — checks hexagonal/DDD compliance (layers, ports, adapters)
- **tests-reviewer** — reviews test quality and coverage
- **frontend-reviewer** — checks component, hook, routing, and tRPC integration
- **spec-writer** — drafts OpenSpec artifacts (proposal, design, specs, tasks)
- **spec-reviewer** — validates OpenSpec changes for completeness and consistency
- **project-validator** — runs lint, typecheck, tests; fixes issues until clean
- **qa-tester** — functional QA of the webapp with Playwright
- **ux-reviewer** — visual UX evaluation of the webapp

Each role has an `.md` file defining:

- **Description** — what the agent does
- **Tools** — which tools it can use
- **Constraints** — what it must NOT do
- **Scope** — how it determines what to review
- **What to review** — specific checklist
- **Output format** — how it reports findings

Example from `code-reviewer.md`:

```markdown
## Constraints

- DO NOT review the whole repository by default.
- DO NOT edit files outside the resolved scope.
- DO NOT apply rules that are not documented under `docs/conventions/`.
- ONLY review production code and directly related files.
- NEVER impose undocumented rules from other projects.
```

### The Mandatory Review Gate

The most impactful rule in `AGENTS.md`:

```markdown
## Mandatory Review Gate
After modifying production code, you MUST run code-review,
tests-review, and architecture-review IN PARALLEL before
reporting the task as complete. Non-negotiable.
```

When the main agent finishes implementing, it **fires the three reviewers in parallel**. You get back code already reviewed by three different roles.

For frontend changes, add `frontend-review` to the gate.

---

## 4. OpenSpec Workflow

### The Problem

An agent that improvises **drifts in 20 minutes**. It starts well, wanders off, and you end up with code that doesn't fit your architecture.

### The Solution: Spec Driven Development

The spec is the **contract** between you and the agent. Four phases, one folder per change:

```
  explore  →  think, investigate the codebase
              writes NOTHING
              
  plan     →  generate proposal.md, design.md,
              specs/ (Given/When/Then), tasks.md
              writes ONLY inside openspec/
              
  build    →  execute the tasks from the plan
              this is where real code gets touched
              
  archive  →  close the change, move to archive/,
              update canonical specs
```

### Anatomy of a Change

```
openspec/changes/<change-id>/
├── proposal.md     ← what and why (with non-goals)
├── design.md       ← how (layers, ports, adapters)
├── specs/          ← Given/When/Then scenarios
└── tasks.md        ← ordered inside-out steps,
                       with TDD where behavior matters
```

### Configuration

`openspec/config.yaml` defines:

- **Schema**: `spec-driven` (the workflow above)
- **Context**: tech stack, architecture, package structure
- **Rules**: what each artifact must contain

Key rules from `config.yaml`:

```yaml
rules:
  proposal:
    - Always include a Non-goals section
    - Reference affected packages and apps
    - Identify which bounded context(s) the change belongs to
  
  design:
    - Read .agents/skills/guidelines/hexagonal-architecture/ before designing
    - Map components to hexagonal layers (domain, application, infrastructure)
    - Identify ports (domain interfaces) and adapters (infrastructure implementations)
  
  tasks:
    - Read .agents/skills/guidelines/tdd-practices/ before creating tasks
    - Tasks with behavior use TDD format (RED → GREEN → COMMIT → REFACTOR)
    - Order tasks inside-out (domain first, then application, then infrastructure)
    - Always include a final validation group (run all reviewers)
```

### Why It Works

- The **plan is validated before** writing code. Iterating on markdown is cheap; iterating on code is expensive.
- **Checked tasks** (`[x]`) give real traceability of what got done.
- **Archiving** turns the change into history, not noise.

---

## 5. OpenCode Modes

### The Problem

Using the same model, the same temperature and the same tools for *everything* is expensive and dangerous. Opus to move files is wasting money. Allowing `write` in an exploration phase is asking for disaster.

### The Solution: Modes Per Phase

Each OpenSpec phase becomes a **mode** with its own model, temperature and tool permissions.

```jsonc
// opencode.json (excerpt)
"explore": {
  "model": "claude-opus-4.7",
  "temperature": 0.7,
  "reasoningEffort": "high",
  "tools": { "write": false, "edit": false, "bash": false }
},
"propose": {
  "model": "claude-opus-4.7",
  "temperature": 0.2,
  "reasoningEffort": "high",
  "tools": { "write": true, "edit": true }  // only inside openspec/
},
"apply": {
  "model": "claude-sonnet-4.5",
  "temperature": 0.2,
  "reasoningEffort": "medium",
  "tools": { "write": true, "edit": true, "bash": true }
},
"archive": {
  "model": "claude-sonnet-4.5",
  "temperature": 0.1,
  "reasoningEffort": "low"
}
```

### The Three Ideas Behind It

1. **Each phase uses the brain it needs.** Opus to think and plan, Sonnet to execute and archive.
2. **Tools are restricted per phase.** In `explore`, the agent literally cannot write. Even if you ask it to.
3. **Temperature changes too.** 0.7 to explore (creative), 0.1 to archive (mechanical).

---

## How to Extend

### Adding a New Guideline Skill

1. Create `.agents/skills/guidelines/<name>/SKILL.md`
2. Follow the standard header format (name + description)
3. Keep it short (30-50 lines, checklist format)
4. Link to full docs in `docs/conventions/` for detail
5. Add to `instructions[]` in `opencode.json`

### Adding a New Subagent

1. Create `.agents/agents/<name>.md`
2. Define: description, tools, constraints, scope, what to review, output format
3. Reference it from a skill or `AGENTS.md` so the main agent knows when to invoke it

### Adding a New Skill (Non-Guideline)

1. Create `.agents/skills/<category>-<name>/SKILL.md`
2. Categories: `openspec-*` (workflow), `action-*` (focused task), `task-*` (automation)
3. Follow the standard header format
4. Optionally add to `instructions[]` if it should be always loaded

---

## File Map

| File | Purpose |
|---|---|
| `AGENTS.md` | Universal entry point, loaded by all tools |
| `.agents/README.md` | Explains the source of truth pattern |
| `.agents/agents/*.md` | Subagent definitions (9 roles) |
| `.agents/skills/guidelines/*/SKILL.md` | Project conventions (6 skills, always loaded) |
| `.agents/skills/openspec-*/SKILL.md` | Spec-driven workflow skills (4 phases) |
| `.agents/skills/action-*/SKILL.md` | Focused workflows (TDD, refactor, tests) |
| `.agents/skills/task-*/SKILL.md` | Task automations (validate, review, QA) |
| `opencode.json` | Mode definitions, instructions[], subagent config |
| `openspec/config.yaml` | Spec-driven workflow rules |
| `docs/conventions/` | Full documentation (referenced by skills) |

---

## References

- [.agents/README.md](../../../.agents/README.md) — Source of truth pattern
- [AGENTS.md](../../../AGENTS.md) — Universal entry point
- [opencode.json](../../../opencode.json) — Mode and subagent configuration
- [openspec/config.yaml](../../../openspec/config.yaml) — Spec-driven workflow rules
- [OpenSpec documentation](https://github.com/Fission-AI/OpenSpec)
- [OpenCode documentation](https://opencode.ai)
