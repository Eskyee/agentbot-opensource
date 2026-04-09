#!/bin/bash
# Clean up stale Claude Code worktrees and branches
# Run weekly or manually

REPO_DIR="/Users/raveculture/Documents/GitHub/agentbot"
cd "$REPO_DIR" || exit 1

echo "=== Pruning stale worktrees ==="
git worktree prune 2>&1

echo "=== Removing orphaned .claude/worktrees ==="
for wt in .claude/worktrees/*/; do
  if [ ! -d "$wt/.git" ]; then
    echo "Removing orphaned worktree: $wt"
    rm -rf "$wt"
  fi
done

echo "=== Cleaning stale .lock files ==="
find .git -name "*.lock" -delete 2>/dev/null

echo "=== Stale branches (gone from remote) ==="
git branch -vv | grep ': gone]' | awk '{print $1}' | while read branch; do
  echo "Deleting stale branch: $branch"
  git branch -D "$branch" 2>/dev/null
done

echo "=== Pruning remote refs ==="
git remote prune origin 2>/dev/null
git remote prune upstream 2>/dev/null

echo "=== Done ==="
git branch -v
echo ""
echo "Worktrees:"
git worktree list
