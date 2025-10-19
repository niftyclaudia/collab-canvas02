# Agent Prompts - Split Architecture

This document contains prompts for the two-agent architecture:

## Project Manager Agent (Alex)
- **File**: `agent/pm-prompts.md`
- **Role**: Requirements analysis, PRD creation, task breakdown
- **Input**: PR briefs from `docs/prd-briefs.md`
- **Output**: Complete PRD + Task List + Acceptance Gates

## Builder Agent (Bob)  
- **File**: `agent/builder-prompts.md`
- **Role**: Implementation, testing, PR creation
- **Input**: PRD + Task List from PM Agent
- **Output**: Working feature + Tests + PR

## Workflow:
1. **PM Agent (Alex)** reads PR briefs and creates detailed specifications
2. **Builder Agent (Bob)** implements features from PM Agent specifications
3. **User** reviews and merges PRs

## Usage:
- Use `agent/pm-prompts.md` for planning and requirements work
- Use `agent/builder-prompts.md` for implementation work
- Each agent has its own template file for detailed instructions