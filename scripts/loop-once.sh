#!/bin/bash
# loop-once.sh — run a SINGLE loop iteration on an OpenSpec change.
#
# Usage: bash scripts/loop-once.sh <change-name> [model]
#   change-name  required, e.g. add-users-filter-pagination
#   model        default: the `loop` agent model in opencode.json (openai/gpt-5.5)
#
# Use this to learn the harness and to tune the openspec-loop skill before
# letting the full loop run unattended via scripts/loop.sh.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MAIN="$(cd "$SCRIPT_DIR/.." && pwd)"

CHANGE="${1:?'Usage: bash scripts/loop-once.sh <change-name> [model]'}"
MODEL="${2:-}"

# Run inside the change's isolated worktree (1 change = 1 worktree); create if missing.
WT="$(dirname "$MAIN")/worktrees/$(basename "$MAIN")/$CHANGE"
if [ ! -d "$WT" ]; then
  echo "[loop-once] no worktree for $CHANGE — creating via spec-worktree.sh"
  bash "$SCRIPT_DIR/spec-worktree.sh" new "$CHANGE"
fi
if [ ! -d "$WT/openspec/changes/$CHANGE" ]; then
  echo "[loop-once] ERROR: openspec/changes/$CHANGE not found in $WT — propose the change first." >&2
  exit 1
fi
cd "$WT"
echo "[loop-once] running in worktree $WT"

export CHANGE

KICKOFF="Run a single loop iteration for the OpenSpec change \"$CHANGE\". You are inside the isolated git worktree for this change ($WT) — commits here are allowed and expected (main stays protected). Follow your loop harness (openspec-loop) exactly: orient, pick the lowest-numbered unchecked task in openspec/changes/$CHANGE/tasks.md, implement it with strict TDD, run @project-validator until green, flip the checkbox, then commit just that task in this worktree (git add -A && git commit). Do NOT push and do NOT touch main. Emit <promise>DONE</promise> alone on its own line ONLY when every task and acceptance criterion is checked."

MODEL_ARGS=()
if [[ -n "$MODEL" ]]; then
  MODEL_ARGS=(--model "$MODEL")
fi

echo "[loop-once] change=$CHANGE model=${MODEL:-<agent default>}"

bun --env-file=.env.local run scripts/opencode.ts run \
  --agent loop \
  "${MODEL_ARGS[@]}" \
  "$KICKOFF"
