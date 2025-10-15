# Scripts

This directory contains automation scripts for the project.

## Available Scripts

### `create-pr.sh` - Automated PR Creation

Creates a pull request with a comprehensive summary including commits, file changes, and diffs.

**Usage:**
```bash
# From project root
./pr develop

# Or directly
./scripts/create-pr.sh develop
```

**Features:**
- Automatically collects all commits in your branch
- Lists all changed files with status indicators
- Includes diff statistics and preview
- Generates formatted PR description
- Creates PR and returns the URL
- Option to open PR in browser

**See the full documentation:** [docs/guides/pr-workflow.md](../docs/guides/pr-workflow.md)

## Setup

Make sure scripts are executable:
```bash
chmod +x scripts/*.sh
chmod +x pr
```

## Requirements

- Git
- GitHub CLI (`gh`) - Install with `brew install gh`
- Authenticated GitHub CLI - Run `gh auth login`

