#!/bin/bash

# ============================================================================
# BASEFM GIT SYNC MONITOR
# Ensures local /tmp/agentbot stays in sync with GitHub main branch
# ============================================================================

REPO_PATH="/tmp/agentbot"
GITHUB_REPO="https://github.com/Eskyee/agentbot"
MAIN_BRANCH="main"

echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║                    BASEFM GIT SYNC MONITOR                                ║"
echo "║                   Keep Local ↔ GitHub in Sync                             ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"
echo ""

# Check if repo exists
if [ ! -d "$REPO_PATH/.git" ]; then
    echo "❌ ERROR: Not a git repository: $REPO_PATH"
    exit 1
fi

cd "$REPO_PATH"

echo "📍 Repository: $REPO_PATH"
echo "🔗 Remote: $GITHUB_REPO"
echo "🌿 Branch: $MAIN_BRANCH"
echo ""

# Fetch latest from GitHub
echo "🔄 Fetching latest from GitHub..."
git fetch origin main 2>&1 | grep -v "^From" | head -3

echo ""
echo "📊 SYNC STATUS:"
echo "─────────────────────────────────────────────────────────────────────────────"

# Get local and remote commit hashes
LOCAL_COMMIT=$(git rev-parse HEAD)
REMOTE_COMMIT=$(git rev-parse origin/main)

echo "Local Commit:  $LOCAL_COMMIT"
echo "Remote Commit: $REMOTE_COMMIT"

if [ "$LOCAL_COMMIT" = "$REMOTE_COMMIT" ]; then
    echo "Status:        ✅ IN SYNC"
    echo ""
    echo "✅ Local and GitHub are synchronized!"
    exit 0
else
    echo "Status:        ⚠️  OUT OF SYNC"
    echo ""
    
    # Check if local is ahead
    BEHIND=$(git rev-list origin/main..HEAD --count)
    if [ "$BEHIND" -gt 0 ]; then
        echo "⚠️  Local has $BEHIND commits not pushed"
        echo ""
        echo "📤 Pushing to GitHub..."
        git push origin main
        echo "✅ Pushed successfully"
    else
        echo "⬇️  GitHub has commits not pulled locally"
        echo ""
        echo "📥 Pulling from GitHub..."
        git pull origin main
        echo "✅ Pulled successfully"
    fi
fi

echo ""
echo "─────────────────────────────────────────────────────────────────────────────"
echo "📋 Latest 5 Commits:"
git log --oneline -5
echo ""

# Check for uncommitted changes
UNCOMMITTED=$(git status --porcelain)
if [ -z "$UNCOMMITTED" ]; then
    echo "✅ No uncommitted changes"
else
    echo "⚠️  Uncommitted changes found:"
    echo "$UNCOMMITTED" | head -5
    if [ $(echo "$UNCOMMITTED" | wc -l) -gt 5 ]; then
        echo "... and $(( $(echo "$UNCOMMITTED" | wc -l) - 5 )) more"
    fi
fi

echo ""
echo "✅ SYNC CHECK COMPLETE"
