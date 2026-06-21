#!/bin/bash
# loop.sh — unattended Ralph-style loop over an OpenSpec change.
#
# Usage: bash scripts/loop.sh <change-name> [max-iters] [model]
#   change-name  required, e.g. add-users-filter-pagination
#   max-iters    default: 20
#   model        default: the `spec-loop` agent default (github-copilot/claude-sonnet-4.6)
#
# Each iteration is a FRESH `spec-loop` agent session. The agent implements ONE
# task per iteration, gated by @project-validator, and emits the completion
# sigil only when every task in tasks.md is checked. The git history and the
# files on disk are the agent's memory across iterations.
#
# opencode is invoked through scripts/opencode.ts so .env.local and the
# DATABASE_URL alias are loaded (same wrapper as `bun run opencode`).

set -euo pipefail

cd "$(dirname "$0")/.."

CHANGE="${1:?'Usage: bash scripts/loop.sh <change-name> [max-iters] [model]'}"
MAX_ITERS="${2:-20}"
MODEL="${3:-}"
COMPLETION="<promise>DONE</promise>"

export CHANGE

KICKOFF="Run a single loop iteration for the OpenSpec change \"$CHANGE\". Follow your loop harness (openspec-loop) exactly: orient, pick the lowest-numbered unchecked task in openspec/changes/$CHANGE/tasks.md, implement it with strict TDD, run @project-validator until green, flip the checkbox, and commit. Emit <promise>DONE</promise> alone on its own line ONLY when every task and acceptance criterion is checked."

MODEL_ARGS=()
if [[ -n "$MODEL" ]]; then
  MODEL_ARGS=(--model "$MODEL")
fi

echo "[loop] change=$CHANGE max-iters=$MAX_ITERS model=${MODEL:-<agent default>}"

for iter in $(seq 1 "$MAX_ITERS"); do
  echo "[loop] iter $iter/$MAX_ITERS"

  OUTPUT=$(bun --env-file=.env.local run scripts/opencode.ts run \
    --agent spec-loop \
    "${MODEL_ARGS[@]}" \
    "$KICKOFF" 2>&1)
  echo "$OUTPUT"

  if echo "$OUTPUT" | grep -qE "^[[:space:]]*${COMPLETION}[[:space:]]*$"; then
    echo "[loop] DONE detected, exit at iter $iter"
    exit 0
  fi
done

echo "[loop] max iterations reached without DONE sigil"
exit 1
