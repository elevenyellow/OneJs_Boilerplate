#!/usr/bin/env bash
# spec-worktree.sh — lifecycle helper for the worktree→PR workflow.
#
#   1 change = 1 branch (spec/<change>) = 1 git worktree = 1 PR into main.
#
# Subcommands:
#   new <change>        Create branch spec/<change> off main + a worktree under
#                       ../worktrees/<repo>/<change> and bootstrap it. Prints path.
#   bootstrap [<path>]  Hydrate a worktree so validation/push don't hit FALSE
#                       failures: copy .env, bun install (drop lockfile churn),
#                       prisma:build. Defaults to the current worktree.
#   remove <change>     After the PR is merged: remove the worktree, then delete
#                       the local AND remote branch (worktree first — git won't
#                       delete a checked-out branch). Refuses unless the branch is
#                       in origin/main (--force to discard; --keep-remote to keep
#                       the remote branch).
#   list                Show worktrees + their spec branches (raw git output).
#   status [<change>]   Progress dashboard: one line per spec worktree with
#                       commits-ahead-of-main, tasks done/total, uncommitted
#                       count, and PR state. Optional <change> filter.
#
# See AGENTS.md → Git Policy and .agents/skills/guidelines/git-strategy/SKILL.md.
set -euo pipefail

# Main checkout = repo root that holds this script (scripts/spec-worktree.sh).
MAIN="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECTS="$(dirname "$MAIN")"
# Worktrees live in a shared sibling folder, namespaced by repo:
#   <projects>/worktrees/<repo>/<change>
WT_ROOT="$PROJECTS/worktrees/$(basename "$MAIN")"

die() { echo "error: $*" >&2; exit 1; }
info() { echo "▸ $*"; }

wt_path() { echo "$WT_ROOT/$1"; }
branch_of() { echo "spec/$1"; }

cmd_bootstrap() {
  local wt="${1:-$PWD}"
  [ -d "$wt/.git" ] || [ -f "$wt/.git" ] || die "not a git worktree: $wt"
  info "bootstrapping $wt"
  for envf in .env .env.local; do
    if [ -f "$MAIN/$envf" ] && [ ! -e "$wt/$envf" ]; then
      cp "$MAIN/$envf" "$wt/$envf"; info "copied $envf (gitignored — never commit)"
    fi
  done
  # Grant full, frictionless editing INSIDE this worktree (gitignored, per-
  # worktree — never reaches the spec branch, auto-gone when the worktree is
  # removed). The guard hooks already allow worktree edits; this drops the
  # interactive edit prompts too, and CLAUDE_GIT_ALLOW lets the assistant
  # commit/push its own spec branch. main stays protected (that's a DIFFERENT
  # checkout with its own settings). Only written if absent — never clobber.
  if [ ! -e "$wt/.claude/settings.local.json" ]; then
    mkdir -p "$wt/.claude"
    cat > "$wt/.claude/settings.local.json" <<'JSON'
{
  "env": {
    "CLAUDE_GIT_ALLOW": "1"
  },
  "permissions": {
    "defaultMode": "acceptEdits"
  }
}
JSON
    info "wrote .claude/settings.local.json (acceptEdits + CLAUDE_GIT_ALLOW — worktree-scoped, gitignored)"
  fi
  ( cd "$wt" && bun install >/dev/null 2>&1 && git checkout -- bun.lock 2>/dev/null || true )
  info "deps hydrated (bun.lock churn dropped)"
  ( cd "$wt" && bun run prisma:build >/dev/null 2>&1 ) && info "prisma client generated" \
    || echo "  ! prisma:build failed — check $wt/.env" >&2
  info "ready. cd $wt"
}

cmd_new() {
  local change="${1:?usage: new <change>}"
  local br; br="$(branch_of "$change")"
  local wt; wt="$(wt_path "$change")"
  [ -e "$wt" ] && die "worktree path already exists: $wt"
  mkdir -p "$WT_ROOT" # ensure ../worktrees/<repo>/ exists (git won't create parents)
  info "fetching main"
  git -C "$MAIN" fetch origin main --quiet
  # Branch off the freshest main; create worktree in one step.
  if git -C "$MAIN" show-ref --verify --quiet "refs/heads/$br"; then
    git -C "$MAIN" worktree add "$wt" "$br"
  else
    git -C "$MAIN" worktree add -b "$br" "$wt" origin/main
  fi
  info "worktree $wt on $br (off origin/main)"
  cmd_bootstrap "$wt"
}

cmd_remove() {
  local change="${1:?usage: remove <change> [--force]}"; shift || true
  local force=""; [ "${1:-}" = "--force" ] && force="--force"
  local br; br="$(branch_of "$change")"
  local wt; wt="$(wt_path "$change")"
  if [ -z "$force" ] && git -C "$MAIN" show-ref --verify --quiet "refs/heads/$br"; then
    git -C "$MAIN" fetch origin main --quiet
    git -C "$MAIN" merge-base --is-ancestor "$br" origin/main \
      || die "$br is NOT merged into origin/main — pass --force to discard anyway"
  fi
  # Order matters: remove the worktree FIRST — git refuses to delete a branch
  # still checked out in a worktree (this is why `gh pr merge --delete-branch`
  # fails while the worktree exists).
  [ -e "$wt" ] && git -C "$MAIN" worktree remove $force "$wt" && info "removed worktree $wt"
  git -C "$MAIN" worktree prune
  git -C "$MAIN" show-ref --verify --quiet "refs/heads/$br" \
    && git -C "$MAIN" branch -D "$br" && info "deleted local branch $br" || true
  # Delete the remote branch too (the merged PR no longer needs it). Skip with
  # --keep-remote.
  if [ "${2:-}" != "--keep-remote" ] && \
     git -C "$MAIN" ls-remote --exit-code --heads origin "$br" >/dev/null 2>&1; then
    git -C "$MAIN" push origin --delete "$br" && info "deleted remote branch origin/$br"
  fi
  info "done."
}

cmd_list() { git -C "$MAIN" worktree list; }

# Progress dashboard: one line per spec worktree — commits ahead of main, tasks
# done/total, uncommitted count, and PR state. Optional <change> filter.
cmd_status() {
  local filter="${1:-}"
  git -C "$MAIN" fetch origin main --quiet 2>/dev/null || true
  echo "worktree progress (change · commits-ahead · tasks · dirty · PR):"
  local found=0
  while IFS= read -r wt; do
    [ "$wt" = "$MAIN" ] && continue
    local br change ahead tasks dirty pr tf done_ total
    br="$(git -C "$wt" branch --show-current 2>/dev/null)"
    change="${br#spec/}"
    if [ -n "$filter" ] && [ "$change" != "$filter" ]; then continue; fi
    found=1
    ahead="$(git -C "$wt" rev-list --count main..HEAD 2>/dev/null || echo '?')"
    tf="$wt/openspec/changes/$change/tasks.md"
    if [ -f "$tf" ]; then
      done_="$(grep -c '^- \[x\]' "$tf" 2>/dev/null || echo 0)"
      total="$(grep -cE '^- \[[ xX]\]' "$tf" 2>/dev/null || echo 0)"
      tasks="${done_}/${total}"
    else
      tasks="—"
    fi
    dirty="$(git -C "$wt" status --porcelain 2>/dev/null | wc -l | tr -d ' ')"
    pr="—"
    if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
      pr="$(gh pr list --head "$br" --state all \
        --json state,isDraft --jq 'if length>0 then (.[0].state + (if .[0].isDraft then " (draft)" else "" end)) else "none" end' \
        2>/dev/null || echo '?')"
    fi
    printf '  %-40s %-4s %-9s %-4s %s\n' "$change" "$ahead" "$tasks" "$dirty" "$pr"
  done < <(git -C "$MAIN" worktree list --porcelain | awk '/^worktree /{print $2}')
  [ "$found" = 0 ] && echo "  (no spec worktrees)"
  return 0
}

# Prune every spec worktree whose PR is already merged (or whose branch is in
# origin/main). Skips worktrees with uncommitted work — safety. Each removal
# tears down worktree + local + remote branch via cmd_remove.
cmd_gc() {
  git -C "$MAIN" fetch origin main --quiet 2>/dev/null || true
  local removed=0
  while IFS= read -r wt; do
    [ "$wt" = "$MAIN" ] && continue
    local br change
    br="$(git -C "$wt" branch --show-current 2>/dev/null)"
    [ "$br" = "${br#spec/}" ] && continue # not a spec/* branch
    change="${br#spec/}"
    # Merged = GitHub confirms a MERGED PR for this branch. (No ancestor-based
    # fallback: a branch with no commits ahead of main is trivially an ancestor,
    # which would wrongly flag an in-progress change as merged.)
    if ! command -v gh >/dev/null 2>&1 || ! gh auth status >/dev/null 2>&1; then
      info "skip $change — gh unavailable, cannot confirm PR is merged"
      continue
    fi
    [ "$(gh pr list --head "$br" --state merged --json number --jq 'length' 2>/dev/null || echo 0)" != "0" ] || continue
    if [ "$(git -C "$wt" status --porcelain 2>/dev/null | wc -l)" -ne 0 ]; then
      info "skip $change — merged but has uncommitted changes"
      continue
    fi
    info "gc: removing merged $change"
    cmd_remove "$change"
    removed=$((removed + 1))
  done < <(git -C "$MAIN" worktree list --porcelain | awk '/^worktree /{print $2}')
  [ "$removed" = 0 ] && info "no merged worktrees to prune"
  return 0
}

case "${1:-}" in
  new)       shift; cmd_new "$@" ;;
  bootstrap) shift; cmd_bootstrap "$@" ;;
  remove)    shift; cmd_remove "$@" ;;
  list)      shift; cmd_list "$@" ;;
  status)    shift; cmd_status "$@" ;;
  gc)        shift; cmd_gc "$@" ;;
  *) echo "usage: $0 {new <change>|bootstrap [path]|remove <change> [--force]|list|status [change]|gc}" >&2; exit 1 ;;
esac
