#!/bin/bash

# PR Alias Setup Script
# This script adds a git alias so you can run "git pr develop" from anywhere in the repo

echo "Setting up 'git pr' alias..."

# Get the repository root
REPO_ROOT=$(git rev-parse --show-toplevel)

if [ -z "$REPO_ROOT" ]; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Add git alias
git config alias.pr "!f() { $REPO_ROOT/scripts/create-pr.sh \"\$@\"; }; f"

echo "✅ Git alias configured!"
echo ""
echo "You can now use:"
echo "  git pr develop"
echo "  git pr main"
echo ""
echo "from anywhere in the repository!"

