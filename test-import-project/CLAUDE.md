# Claude Project Memory

## Active Session
- **Current**: Project Setup
- **Started**: 2025-07-05
- **Project**: Import Test Project

## Key Project Knowledge

### Critical Information
- **Project Name**: Import Test Project
- **Claude Memory**: v1.11.0
- **Memory Created**: 2025-07-05

### Knowledge Base
- No knowledge stored yet


### Recent Changes
#### Recent Decisions
- **2025-07-05**: Install Claude Memory


### Open Patterns



### Project Conventions
<!-- Discovered during development -->

## Task Management

### Active Tasks
- No active tasks

### In Progress
- No tasks in progress


## Recent Decisions Log

### 2025-07-05: Install Claude Memory
**Decision**: Install Claude Memory
**Reasoning**: Enable persistent AI memory across sessions for better project intelligence
**Alternatives Considered**: Manual documentation, External tools, No memory system


## Commands & Workflows

### Claude Memory Commands
```bash
# Session management
claude-memory session start "Session Name"
claude-memory session end ["outcome"]
claude-memory session cleanup

# Task management
claude-memory task add "description" [--priority high|medium|low] [--assignee name]
claude-memory task complete <task-id>
claude-memory task list [status]

# Pattern management
claude-memory pattern add "Pattern" "Description" [--effectiveness 0.8] [--priority high]
claude-memory pattern list [--priority high]
claude-memory pattern search "query"
claude-memory pattern resolve <pattern-id> "solution"

# Decision tracking
claude-memory decision "Choice" "Reasoning" "alternatives"

# Knowledge management
claude-memory knowledge add "key" "value" --category category
claude-memory knowledge get "key" [category]
claude-memory knowledge list [category]

# Export and reporting (v1.10.0)
claude-memory export [file.json] [--types tasks,patterns] [--format json|yaml|csv|markdown]
claude-memory import <file.json> [--mode merge|replace] [--types tasks,patterns]
claude-memory report [--type summary|tasks|patterns|decisions|progress|sprint] [--save]

# Memory utilities
claude-memory stats
claude-memory search "query"
claude-memory handoff [--format markdown|json]
```

## Full Context Files
For complete information without truncation:
- 📚 **Knowledge Base**: `.claude/context/knowledge.md` (0 items)
- 🧩 **All Patterns**: `.claude/context/patterns.md` (0 patterns)
- 🎯 **Decision Log**: `.claude/context/decisions.md` (1 decisions)
- ✅ **Task Details**: `.claude/context/tasks.md` (0 tasks)

## Session Continuation
To resume work, tell Claude:
"Load project memory for Import Test Project and continue development"
