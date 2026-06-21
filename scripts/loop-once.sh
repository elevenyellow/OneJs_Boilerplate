#!/bin/bash
# loop-once.sh — run a SINGLE loop iteration on an OpenSpec change.
#
# Usage: bash scripts/loop-once.sh <change-name> [model]
#   change-name  required, e.g. add-users-filter-pagination
#   model        default: the `spec-loop` agent default (github-copilot/claude-sonnet-4.6)
#
# Use this to learn the harness and to tune the openspec-loop skill before
# letting the full loop run unattended via scripts/loop.sh.

set -euo pipefail

cd "$(dirname "$0")/.."

CHANGE="${1:?'Usage: bash scripts/loop-once.sh <change-name> [model]'}"
MODEL="${2:-}"

export CHANGE

KICKOFF="Run a single loop iteration for the OpenSpec change \"$CHANGE\". Follow your loop harness (openspec-loop) exactly: orient, pick the lowest-numbered unchecked task in openspec/changes/$CHANGE/tasks.md, implement it with strict TDD, run @project-validator until green, flip the checkbox, and commit. Emit <promise>DONE</promise> alone on its own line ONLY when every task and acceptance criterion is checked."

MODEL_ARGS=()
if [[ -n "$MODEL" ]]; then
  MODEL_ARGS=(--model "$MODEL")
fi

echo "[loop-once] change=$CHANGE model=${MODEL:-<agent default>}"

bun --env-file=.env.local run scripts/opencode.ts run \
  --agent spec-loop \
  "${MODEL_ARGS[@]}" \
  "$KICKOFF"
