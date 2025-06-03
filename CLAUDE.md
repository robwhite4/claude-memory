# Claude Project Memory

## Active Session
- **Current**: Evening Development
- **Started**: 2025-06-03
- **Project**: Claude Memory NPM Package

## Key Project Knowledge

### Critical Information
- **Project Name**: Claude Memory NPM Package
- **Claude Memory**: v1.3.1
- **Memory Created**: 2025-06-01

### Open Patterns



### Project Conventions
<!-- Discovered during development -->

## Task Management

### Active Tasks
- [ ] **Test edge cases in CLI argument parsing** (medium)
- [ ] **Add task status update command (in-progress, blocked, etc)** (low)
- [ ] **Consider JSON import/export for task migration** (low)
- [ ] **Test task with tag** (medium, assigned: /test)

### In Progress
- No tasks in progress

### Recently Completed
- [x] **Update NPM badges to use shields.io** (completed: 2025-06-03)
- [x] **Implement default directory for stats/search/backup/export** (completed: 2025-06-03)

## Recent Decisions Log

### 2025-06-03: Test scriptalert('xss')/script
**Decision**: Test scriptalert('xss')/script
**Reasoning**: Path //etc/passwd traversal test
**Alternatives Considered**: /malicious/path


### 2025-06-03: ../../../etc/passwd
**Decision**: ../../../etc/passwd
**Reasoning**: test
**Alternatives Considered**: test


### 2025-06-03: Use latest cmem for dogfooding
**Decision**: Use latest cmem for dogfooding
**Reasoning**: Always update global claude-memory to latest NPM version when working on the project to test real usage
**Alternatives Considered**: Use local development version, Ignore version updates


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
"Load project memory for Claude Memory NPM Package and continue development"
