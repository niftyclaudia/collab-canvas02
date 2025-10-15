# PR Creation Workflow Guide

## Overview

This project includes an automated PR creation script that streamlines the process of creating pull requests with comprehensive summaries.

## Quick Start

From the project root, simply run:

```bash
./pr develop
```

Or for other target branches:

```bash
./pr main
./pr staging
```

### Optional: Git Alias Setup

For even easier access, set up a git alias to run from anywhere in the repo:

```bash
# Run once to set up the alias
./.github/pr-alias-setup.sh

# Then use from anywhere in the repo
git pr develop
```

## What the Script Does

When you run the PR creation script, it automatically:

1. **Validates your branch** - Ensures you're not on the target branch and checks for uncommitted changes
2. **Fetches latest changes** - Gets the latest updates from the remote target branch
3. **Pushes your branch** - Pushes your current branch to remote (or creates it if needed)
4. **Analyzes commits** - Collects all commits between your branch and the target
5. **Generates a summary** - Creates a comprehensive PR description including:
   - List of all commits with their hashes
   - Files changed (added, modified, deleted)
   - Statistics (lines added/removed)
   - Full diff preview (first 500 lines)
6. **Creates the PR** - Uses GitHub CLI to create the pull request
7. **Provides the link** - Outputs the PR URL and optionally opens it in your browser

## PR Description Format

The generated PR description includes:

### 📝 Summary
A brief overview of the branch being merged

### 🔄 Commits
A chronological list of all commits with format:
- **commit message** (hash)

### 📋 Changes

#### Files Changed
Lists all modified files with emojis:
- ➕ Added files
- ✏️  Modified files
- ❌ Deleted files
- 🔄 Renamed files

#### Statistics
Shows lines added/removed summary

### 🔍 Detailed Changes
Expandable section with full diff (truncated at 500 lines for readability)

## Typical Workflow

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/my-new-feature
   ```

2. **Make your changes with multiple commits:**
   ```bash
   git add .
   git commit -m "Add user authentication"
   git add .
   git commit -m "Add login form"
   git add .
   git commit -m "Add tests for auth flow"
   ```

3. **Create the PR:**
   ```bash
   ./pr develop
   ```

4. **Review and confirm:**
   - The script shows you the PR title (auto-generated from branch name)
   - You can accept it, edit it, or cancel
   - It creates the PR and gives you the link

5. **Done!** 
   - You get the PR URL immediately
   - Option to open it in your browser
   - Ready to request reviews

## Advanced Usage

### Direct Script Usage

You can also call the script directly:

```bash
./scripts/create-pr.sh develop
```

### Customizing PR Title

When prompted, choose 'e' to edit the PR title:
```
Create PR with this title? (y/n/edit) e
Enter PR title: My Custom PR Title
```

### Handling Uncommitted Changes

If you have uncommitted changes, the script will warn you and ask if you want to continue.

## Requirements

- Git
- GitHub CLI (`gh`) - [Install guide](https://cli.github.com/)
- Authenticated with GitHub CLI (`gh auth login`)

## Troubleshooting

### "gh: command not found"

Install GitHub CLI:
```bash
brew install gh
```

### "gh: authentication required"

Authenticate with GitHub:
```bash
gh auth login
```

### "No commits to create PR"

Your branch is up to date with the target. Make sure you've:
1. Made commits on your feature branch
2. Not already merged these commits

### Script Permission Denied

Make sure the script is executable:
```bash
chmod +x ./pr
chmod +x ./scripts/create-pr.sh
```

## Tips

- **Branch naming**: Use descriptive branch names like `feature/user-auth` or `bugfix/login-error` - these automatically generate nice PR titles
- **Commit messages**: Write clear commit messages as they appear in the PR description
- **Regular pushes**: The script pushes your branch, but it's good practice to push regularly
- **Review before creating**: The script shows you a summary before creating the PR

## Example Output

```
🚀 PR Creation Script
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 Current branch: feature/add-drawing-tools
🎯 Target branch: develop

📥 Fetching latest changes...
📤 Pushing latest changes...

📊 Found 3 commit(s) to be included in PR

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 PR Title: Feature Add Drawing Tools
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create PR with this title? (y/n/edit) y

🔨 Creating pull request...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Pull Request Created Successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔗 PR URL: https://github.com/yourusername/yourrepo/pull/123

Open PR in browser? (y/n) y
```

## Notes

- The script automatically truncates diffs longer than 500 lines to keep PR descriptions readable
- All emojis and formatting are GitHub-compatible markdown
- The script respects your git configuration and hooks
- It's safe to run multiple times - GitHub CLI will handle if a PR already exists

