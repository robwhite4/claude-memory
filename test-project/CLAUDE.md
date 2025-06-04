# Claude Project Memory

## Active Session
- **Current**: Evening Development
- **Started**: 2025-06-04
- **Project**: Test Project

## Key Project Knowledge

### Critical Information
- **Project Name**: Test Project
- **Claude Memory**: v1.3.1
- **Memory Created**: 2025-06-04

### Open Patterns
#### Medium Priority
- **Test first**: Prevents bugs (effectiveness: 0.9)
- **Dummy**: Force update (effectiveness: 0.5)



### Project Conventions
<!-- Discovered during development -->

## Task Management

### Active Tasks
- No active tasks

### In Progress
- No tasks in progress


## Recent Decisions Log

### 2025-06-04: Use React
**Decision**: Use React
**Reasoning**: Better ecosystem
**Alternatives Considered**: Vue, Angular


### 2025-06-04: Install Claude Memory
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
claude-memory pattern "Pattern" "Description" [effectiveness] [--priority critical|high|medium|low]
claude-memory pattern resolve <pattern-id> "solution"

# Decision tracking
claude-memory decision "Choice" "Reasoning" "alternatives"

# Memory utilities
claude-memory stats
claude-memory search "query"
```

## Session Continuation
To resume work, tell Claude:
"Load project memory for Test Project and continue development"
