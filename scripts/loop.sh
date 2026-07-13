#!/bin/bash
# loop.sh — unattended Ralph-style loop over an OpenSpec change.
#
# Usage: bash scripts/loop.sh <change-name> [max-iters] [model]
#   change-name  required, e.g. add-users-filter-pagination
#   max-iters    optional hard backstop; empty/0 = unlimited (default). The loop
#                runs until every task is done, bounded by MAX_RETRIES_PER_TASK.
#   model        default: the `loop` agent model in opencode.json (openai/gpt-5.5)
#
# Env:
#   MAX_RETRIES_PER_TASK  consecutive no-progress iterations before aborting a
#                         stuck task (default: 3)
#
# Each iteration is a FRESH `loop` agent session, run INSIDE the change's git
# worktree (created/bootstrapped on first run). The agent implements ONE task
# per iteration, gated by @project-validator, commits that task in the worktree
# (main stays protected; never pushed), and emits the completion sigil only when
# every task in tasks.md is checked. The loop keeps spawning fresh sessions until
# that sigil appears — it stops early only if a single task makes no progress for
# MAX_RETRIES_PER_TASK iterations in a row. Committing per task keeps work durable
# across fresh sessions. The operator opens/merges the PR when ready.
#
# opencode is invoked through scripts/opencode.ts so .env.local and the
# DATABASE_URL alias are loaded (same wrapper as `bun run opencode`).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MAIN="$(cd "$SCRIPT_DIR/.." && pwd)"

CHANGE="${1:?'Usage: bash scripts/loop.sh <change-name> [max-iters] [model]'}"
# The loop runs until EVERY task is done (DONE sigil). max-iters is now an
# optional hard backstop only — leave it empty (or 0) for unlimited, which is
# the default: completion is bounded by the per-task retry cap below, not by a
# fixed iteration count.
MAX_ITERS_ARG="${2:-}"
MODEL="${3:-}"
COMPLETION="<promise>DONE</promise>"
# Per-task retry cap (the real safety valve): if the lowest unchecked task fails
# to complete this many iterations in a row, abort — it's stuck, and looping
# further only burns tokens. Progress on any task resets the counter.
MAX_RETRIES_PER_TASK="${MAX_RETRIES_PER_TASK:-3}"

# Run the unattended loop inside an isolated worktree for this change
# (1 change = 1 branch = 1 worktree). Create + bootstrap it if missing.
WT="$(dirname "$MAIN")/worktrees/$(basename "$MAIN")/$CHANGE"
if [ ! -d "$WT" ]; then
  echo "[loop] no worktree for $CHANGE — creating via spec-worktree.sh"
  bash "$SCRIPT_DIR/spec-worktree.sh" new "$CHANGE"
fi
if [ ! -d "$WT/openspec/changes/$CHANGE" ]; then
  echo "[loop] ERROR: openspec/changes/$CHANGE not found in $WT." >&2
  echo "       Propose the change first — its files must live on the spec branch (or main)." >&2
  exit 1
fi
cd "$WT"
echo "[loop] running in worktree $WT"

TASKS_FILE="openspec/changes/$CHANGE/tasks.md"

# Count unchecked "- [ ]" tasks. One iteration completes one task, so a drop in
# this count between iterations means real forward progress.
count_pending() {
  grep -cE '^[[:space:]]*- \[ \]' "$TASKS_FILE" 2>/dev/null || echo 0
}

export CHANGE

KICKOFF="Run a single loop iteration for the OpenSpec change \"$CHANGE\". You are inside the isolated git worktree for this change ($WT) — commits here are allowed and expected (main stays protected). Follow your loop harness (openspec-loop) exactly: orient, pick the lowest-numbered unchecked task in openspec/changes/$CHANGE/tasks.md, implement it with strict TDD, run @project-validator until green, flip the checkbox, then commit just that task in this worktree (git add -A && git commit with a Conventional Commit message). Do NOT push and do NOT touch main. Emit <promise>DONE</promise> alone on its own line ONLY when every task and acceptance criterion is checked."

MODEL_ARGS=()
if [[ -n "$MODEL" ]]; then
  MODEL_ARGS=(--model "$MODEL")
fi

# On completion: push the spec branch (runs the pre-push gate) and open a DRAFT
# PR so the work is verifiable in one place. Never merges — the operator does.
finalize_pr() {
  local branch="spec/$CHANGE"
  echo "[loop] complete — pushing $branch + opening draft PR"
  git push -u origin "$branch" 2>&1 | tail -3 || { echo "[loop] push failed (gate red?) — PR not opened"; return 1; }
  if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
    if [ -n "$(gh pr list --head "$branch" --state open --json number --jq '.[0].number' 2>/dev/null)" ]; then
      echo "[loop] draft PR already open for $branch"
    else
      gh pr create --draft --base main --head "$branch" \
        --title "$CHANGE" \
        --body "Automated draft PR for OpenSpec change \`$CHANGE\` (loop complete, gate green). Review the diff, run merge-review, then mark ready and merge.

🤖 Generated with [Claude Code](https://claude.com/claude-code)" 2>&1 | tail -2
    fi
  else
    echo "[loop] gh unavailable — open the PR manually from the branch on GitHub"
  fi
}

echo "[loop] change=$CHANGE retries/task=$MAX_RETRIES_PER_TASK max-iters=${MAX_ITERS_ARG:-∞} model=${MODEL:-<agent default>}"

iter=0
retries=0   # consecutive no-progress iterations on the current stuck task
while true; do
  iter=$((iter + 1))

  # Optional hard backstop — only if the operator passed an explicit, non-zero cap.
  if [[ -n "$MAX_ITERS_ARG" && "$MAX_ITERS_ARG" != "0" && "$iter" -gt "$MAX_ITERS_ARG" ]]; then
    echo "[loop] hit explicit max-iters backstop ($MAX_ITERS_ARG) without DONE sigil"
    exit 1
  fi

  pending_before="$(count_pending)"
  echo "[loop] iter $iter ($pending_before task(s) pending, retry $retries/$MAX_RETRIES_PER_TASK)"

  OUTPUT=$(bun --env-file=.env.local run scripts/opencode.ts run \
    --agent loop \
    "${MODEL_ARGS[@]}" \
    "$KICKOFF" 2>&1)
  echo "$OUTPUT"

  if echo "$OUTPUT" | grep -qE "^[[:space:]]*${COMPLETION}[[:space:]]*$"; then
    echo "[loop] DONE detected at iter $iter"
    finalize_pr
    exit 0
  fi

  # Progress = a task got checked off (pending count dropped). Reset the retry
  # counter. No progress = the current task is stuck; count it against the cap.
  pending_after="$(count_pending)"
  if [ "$pending_after" -lt "$pending_before" ]; then
    retries=0
  else
    retries=$((retries + 1))
    echo "[loop] no progress this iteration ($pending_after pending) — retry $retries/$MAX_RETRIES_PER_TASK"
    if [ "$retries" -ge "$MAX_RETRIES_PER_TASK" ]; then
      echo "[loop] ABORT: stuck on a task for $MAX_RETRIES_PER_TASK iterations without progress ($pending_after task(s) still pending)."
      echo "       Inspect the last output above for the blocker, then fix and re-run."
      exit 1
    fi
  fi
done
