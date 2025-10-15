#!/bin/bash

# PR Creation Script
# Usage: ./scripts/create-pr.sh [target-branch]
# Example: ./scripts/create-pr.sh develop

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if target branch is provided
TARGET_BRANCH="${1:-develop}"

echo -e "${BLUE}🚀 PR Creation Script${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)

if [ -z "$CURRENT_BRANCH" ]; then
    echo -e "${RED}❌ Error: Not on a branch${NC}"
    exit 1
fi

if [ "$CURRENT_BRANCH" = "$TARGET_BRANCH" ]; then
    echo -e "${RED}❌ Error: You're already on the target branch ($TARGET_BRANCH)${NC}"
    exit 1
fi

echo -e "${GREEN}📍 Current branch:${NC} $CURRENT_BRANCH"
echo -e "${GREEN}🎯 Target branch:${NC} $TARGET_BRANCH\n"

# Check if there are uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo -e "${YELLOW}⚠️  Warning: You have uncommitted changes${NC}"
    read -p "Do you want to continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Fetch latest changes
echo -e "${BLUE}📥 Fetching latest changes...${NC}"
git fetch origin "$TARGET_BRANCH" --quiet

# Check if branch exists on remote
REMOTE_EXISTS=$(git ls-remote --heads origin "$CURRENT_BRANCH" | wc -l)
if [ "$REMOTE_EXISTS" -eq 0 ]; then
    echo -e "${YELLOW}📤 Branch doesn't exist on remote. Pushing...${NC}"
    git push -u origin "$CURRENT_BRANCH"
else
    echo -e "${YELLOW}📤 Pushing latest changes...${NC}"
    git push origin "$CURRENT_BRANCH"
fi

# Get commit count
COMMIT_COUNT=$(git rev-list --count "origin/$TARGET_BRANCH..$CURRENT_BRANCH")
echo -e "\n${GREEN}📊 Found $COMMIT_COUNT commit(s) to be included in PR${NC}\n"

if [ "$COMMIT_COUNT" -eq 0 ]; then
    echo -e "${RED}❌ Error: No commits to create PR${NC}"
    exit 1
fi

# Generate PR title from branch name
PR_TITLE=$(echo "$CURRENT_BRANCH" | sed 's/-/ /g' | sed 's/\b\(.\)/\u\1/g')

# Create temporary file for PR body
PR_BODY_FILE=$(mktemp)

# Generate PR body with summary
{
    echo "## 📝 Summary"
    echo ""
    echo "This PR includes changes from the \`$CURRENT_BRANCH\` branch."
    echo ""
    echo "## 🔄 Commits ($COMMIT_COUNT)"
    echo ""
    git log "origin/$TARGET_BRANCH..$CURRENT_BRANCH" --pretty=format:"- **%s** (%h)" --reverse
    echo ""
    echo ""
    echo "## 📋 Changes"
    echo ""
    echo "### Files Changed"
    echo ""
    git diff "origin/$TARGET_BRANCH...$CURRENT_BRANCH" --name-status | while read status file; do
        case $status in
            A) echo "- ➕ Added: \`$file\`" ;;
            M) echo "- ✏️  Modified: \`$file\`" ;;
            D) echo "- ❌ Deleted: \`$file\`" ;;
            R*) echo "- 🔄 Renamed: \`$file\`" ;;
            *) echo "- $status: \`$file\`" ;;
        esac
    done
    echo ""
    echo "### Statistics"
    echo ""
    echo "\`\`\`"
    git diff "origin/$TARGET_BRANCH...$CURRENT_BRANCH" --shortstat
    echo "\`\`\`"
    echo ""
    echo "## 🔍 Detailed Changes"
    echo ""
    echo "<details>"
    echo "<summary>Click to expand full diff</summary>"
    echo ""
    echo "\`\`\`diff"
    git diff "origin/$TARGET_BRANCH...$CURRENT_BRANCH" --color=never | head -n 500
    echo ""
    TOTAL_DIFF_LINES=$(git diff "origin/$TARGET_BRANCH...$CURRENT_BRANCH" --color=never | wc -l)
    if [ "$TOTAL_DIFF_LINES" -gt 500 ]; then
        echo "... (diff truncated, showing first 500 lines of $TOTAL_DIFF_LINES total)"
    fi
    echo "\`\`\`"
    echo ""
    echo "</details>"
    echo ""
    echo "---"
    echo ""
    echo "🤖 *This PR was automatically generated using the PR creation script*"
} > "$PR_BODY_FILE"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}📄 PR Title:${NC} $PR_TITLE"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Ask for confirmation
read -p "Create PR with this title? (y/n/edit) " -n 1 -r
echo
if [[ $REPLY =~ ^[Ee]$ ]]; then
    read -p "Enter PR title: " PR_TITLE
elif [[ ! $REPLY =~ ^[Yy]$ ]]; then
    rm "$PR_BODY_FILE"
    exit 1
fi

# Create the PR
echo -e "\n${BLUE}🔨 Creating pull request...${NC}\n"

PR_URL=$(gh pr create \
    --base "$TARGET_BRANCH" \
    --head "$CURRENT_BRANCH" \
    --title "$PR_TITLE" \
    --body-file "$PR_BODY_FILE" \
    2>&1)

# Clean up
rm "$PR_BODY_FILE"

# Check if PR was created successfully
if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ Pull Request Created Successfully!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
    echo -e "${BLUE}🔗 PR URL:${NC} $PR_URL\n"
    
    # Try to open in browser
    if command -v open &> /dev/null; then
        read -p "Open PR in browser? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            open "$PR_URL"
        fi
    fi
else
    echo -e "\n${RED}❌ Failed to create PR${NC}"
    echo "$PR_URL"
    exit 1
fi

