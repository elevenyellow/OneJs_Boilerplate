# OpenSpec Workflow

OpenSpec is the working agreement for product and architecture changes in this project.

## Directory Roles

```text
openspec/
  specs/      Accepted behavior. This is the canonical baseline.
  changes/    Proposed or in-progress deltas from the baseline.
  config.yaml Project context and rules for OpenSpec artifacts.
```

## Standard Flow

```text
explore -> propose -> apply -> review -> archive
```

| Phase | Cursor | Claude Code | OpenCode |
| --- | --- | --- | --- |
| Explore | `/opsx-explore` | `/opsx:explore` | `spec-explore` |
| Propose | `/opsx-propose` | `/opsx:propose` | `spec-propose` |
| Apply | `/opsx-apply` | `/opsx:apply` | `spec-apply` |
| Review | `/opsx-review` | `/opsx:review` | `spec-review` |
| Archive | `/opsx-archive` | `/opsx:archive` | `spec-archive` |

## Review Gate

When implementation tasks are complete, run the explicit review command/agent for your tool before archive:

```text
Cursor:      /opsx-review
Claude Code: /opsx:review
OpenCode:    spec-review
```

The review workflow validates first, launches scoped reviewers in parallel, applies low-ambiguity fixes, and leaves the change ready for archive.

## Archive and Sync

`archive` delegates the final spec merge and change move to the official OpenSpec CLI:

```bash
openspec archive <change> --yes
```

`sync` is optional and anticipatory. Use it before review only when you want to inspect or share updated `openspec/specs/` while the change remains active. The default flow does not require a separate sync step because `openspec archive` applies pending delta specs before moving the change to `openspec/changes/archive/`.

## Unattended Loop

`spec-loop` is the unattended sibling of `spec-apply`. It is driven by scripts rather than Cursor or Claude slash commands:

```bash
bun run loop:once <change>
bun run loop <change> [max-iters] [model]
```

Each iteration starts a fresh OpenCode session, implements one pending task, runs `@project-validator`, checks off the task only when green, commits, and exits. The external runner repeats until every task is complete.
