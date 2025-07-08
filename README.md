# Claude Memory System

> Automatic AI context management that works silently in the background

[![npm version](https://img.shields.io/npm/v/claude-memory.svg)](https://www.npmjs.com/package/claude-memory)
[![CI/CD Pipeline](https://github.com/robwhite4/claude-memory/actions/workflows/ci.yml/badge.svg)](https://github.com/robwhite4/claude-memory/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)](https://nodejs.org/)
[![Downloads](https://img.shields.io/npm/dt/claude-memory.svg)](https://www.npmjs.com/package/claude-memory)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/robwhite4/claude-memory/pulls)
[![Code Quality](https://img.shields.io/badge/code%20quality-A-brightgreen.svg)](https://github.com/robwhite4/claude-memory)
[![Test Coverage](https://img.shields.io/badge/coverage-78.79%25-brightgreen.svg)](https://github.com/robwhite4/claude-memory/actions)
[![Code Quality](https://img.shields.io/badge/eslint-passing-brightgreen.svg)](https://github.com/robwhite4/claude-memory)
[![Tests](https://img.shields.io/badge/tests-25%20passed-brightgreen.svg)](https://github.com/robwhite4/claude-memory/actions)

## 🤖 Set and Forget

Claude Memory runs automatically in the background, maintaining perfect context for AI assistants without any manual intervention.

```bash
# Install once
npm install -g claude-memory

# Initialize and forget
cmem init

# That's it! Claude now has persistent memory
```

## 🎯 The Problem It Solves

**Without Claude Memory** - Every conversation starts from zero:
```
You: "Continue working on the auth system"
AI: "What framework? What auth method? Where are the files?"
You: *10 minutes explaining everything again...*
```

**With Claude Memory** - AI knows your project instantly:
```
You: "Continue working on the auth system" 
AI: "I see you're using NextAuth with JWT. Last session you completed 
the login flow. The remaining tasks are password reset and 2FA. 
Should I start with the password reset endpoint you stubbed in 
/api/auth/reset.ts?"
```

## 🪄 How It Works (Automatically)

### 1. **Auto-Session Management**
Sessions start and rotate automatically every 4 hours, organizing your work by time of day:
- Morning Development (6am-12pm)
- Afternoon Development (12pm-5pm)
- Evening Development (5pm-9pm)
- Night Development (9pm-6am)

### 2. **Auto-Backups**
Your project memory is automatically backed up:
- After every 10 significant actions
- When sessions rotate
- Daily on first activity
- Keeps 7 days of history

### 3. **Token-Optimized Context**
CLAUDE.md is automatically optimized to include only:
- Current session info
- Recent decisions (last 3-5)
- Active tasks and high-priority items
- Recent completions for continuity
- Critical patterns only

### 4. **Zero Configuration**
Default settings work perfectly for most projects:
```json
{
  "autoSession": true,
  "autoSessionHours": 4,
  "autoBackup": true,
  "backupInterval": 10,
  "tokenOptimization": true
}
```

## 📦 What Gets Created

```
your-project/
├── CLAUDE.md          # AI-readable project context (commit this!)
└── .claude/           # Auto-generated memory system
    ├── memory.json    # Full memory database
    ├── config.json    # Your preferences  
    ├── backups/       # Automatic backups
    └── context/       # Full context files (v1.7.0+)
        ├── knowledge.md   # Complete knowledge base
        ├── patterns.md    # All patterns with details
        ├── decisions.md   # Full decision history
        └── tasks.md       # Detailed task information
```

**Version Control:**
- ✅ **Commit:** `CLAUDE.md` - This is your project's AI context
- ❌ **Don't commit:** `.claude/` directory - Contains generated files and personal preferences
- 💡 **Optional:** You can commit `.claude/context/` if you want to share full project knowledge with your team

## 🔄 Multi-Machine & Team Development

### Working Across Multiple Machines

If you work on multiple computers, commit the context files to sync your memory:

```bash
# In your .gitignore, change this:
.claude/

# To this (keeping config and raw data local):
.claude/sessions/
.claude/backups/
.claude/memory.json
.claude/config.json
!.claude/context/
```

📁 **[See more .gitignore templates](examples/gitignore-templates.md)** for different team setups.

**Workflow:**
1. `git pull` - Get latest memory from other machine
2. Work and update memory with `cmem` commands  
3. `git add . && git commit` - Include memory updates
4. `git push` - Share memory with other machines

### Team Development

Claude Memory can work for teams with some considerations:

**Best for:**
- Shared project knowledge and decisions
- Onboarding new developers
- AI-assisted development handoffs

**Potential Issues:**
- Merge conflicts in context files (auto-generated)
- Personal patterns mixed with team patterns

**Recommended Team Approach:**

1. **Designate a Memory Keeper** - One person updates project memory
2. **Use PR Descriptions** - Document decisions in PRs instead
3. **Team Conventions**:
   ```bash
   # Prefix patterns for clarity
   cmem pattern add "[TEAM] Code review required" "..." 
   cmem pattern add "[ALICE] Personal debugging" "..."
   
   # Use categories
   cmem knowledge add "API_v2_Design" "..." --category architecture
   ```

4. **Handle Merge Conflicts**:
   ```bash
   # Accept incoming changes and regenerate
   git checkout --theirs .claude/context/
   cmem knowledge add "merge_note" "Merged from main"
   ```

## 🚀 Basic Usage (Manual Commands)

While Claude Memory works automatically, you can also use manual commands:

```bash
# Check what Claude knows
cmem stats

# Add important decisions
cmem decision "Use PostgreSQL" "Need ACID compliance" "MongoDB,DynamoDB"

# Track patterns
cmem pattern "API-first design" "Build APIs before UI" 0.9 high

# Manage tasks
cmem task add "Implement user settings" --priority high
cmem task complete abc123 "Added settings page"

# Bulk task operations (v1.10.0+)
cmem task add-bulk tasks.json
cmem task export github pending

# Enhanced export and reporting (v1.10.0+)
cmem export --format yaml --types tasks,patterns --from 2024-01-01
cmem import backup.json --mode merge
cmem report summary --save
cmem report sprint --format markdown

# Search your memory
cmem search "authentication"
```

## 🔧 Claude-Code Integration

For [claude-code](https://github.com/anthropics/claude-code) users, memory is automatically included:

```bash
# Get current context as JSON
cmem context

# Returns:
{
  "session": "Afternoon Development",
  "activeTasks": [...],
  "recentDecisions": [...],
  "openPatterns": [...]
}
```

This context is automatically injected into your Claude conversations, giving perfect continuity without any extra tokens or manual steps.

## 💰 Token Efficiency

Claude Memory significantly reduces token usage by eliminating repeated context. The token optimization feature intelligently manages context size while preserving critical information.

**Typical savings scenarios:**
- **Quick questions about ongoing work**: Minimal context needed, maximum savings
- **Continuing previous sessions**: No need to re-explain project structure or decisions
- **Team handoffs**: Shared context eliminates lengthy explanations

When token optimization is enabled (default), CLAUDE.md stays concise while maintaining full context in the memory system.

## 📂 Multi-File Context System (v1.7.0+)

Claude Memory now preserves complete information without truncation through a multi-file context system:

### How It Works
- **CLAUDE.md**: Remains the primary context file, optimized for tokens
- **Context Files**: Full details stored in `.claude/context/` directory
- **No Information Loss**: Everything is preserved, just better organized

### Context Files
- **knowledge.md**: Complete knowledge base with all values untruncated
- **patterns.md**: All patterns with full descriptions and history
- **decisions.md**: Complete decision log with reasoning and outcomes
- **tasks.md**: Detailed task information including assignments and dates

### Benefits
- **Full Context Access**: AI can read specific context files when needed
- **Token Efficient**: Main CLAUDE.md stays under 3K tokens
- **Human Readable**: Well-organized markdown files for easy browsing
- **Git Friendly**: Context files can be tracked or ignored as needed

The CLAUDE.md file includes references to these context files, allowing AI assistants to request more detailed information when necessary.

## 🛠️ Configuration

Adjust behavior if needed:

```bash
# View current config
cmem config get

# Adjust settings
cmem config set autoSessionHours 6
cmem config set tokenOptimization false
cmem config set silentMode true
```

## 🏗️ Code Structure

The codebase is organized into modular components for maintainability:

```
claude-memory/
├── bin/
│   └── claude-memory.js     # CLI entry point (1,770 lines)
├── lib/
│   ├── ClaudeMemory.js      # Core memory management (1,016 lines)
│   └── utils/
│       ├── validators.js     # Input validation functions
│       ├── sanitizers.js     # Security sanitization
│       └── formatters.js     # Output formatting
└── package.json              # NPM configuration
```

This modular structure makes the codebase easier to maintain and extend while preserving all functionality.

## 🚩 Global CLI Flags

Control Claude Memory behavior with these global flags:

```bash
# Preview changes without executing
cmem task add "New feature" --dry-run

# Use custom configuration file
cmem init "Project" --config ~/my-config.json
export CLAUDE_MEMORY_CONFIG=~/my-config.json  # Or via environment

# Skip confirmation prompts
cmem session cleanup --force

# Debug execution issues
cmem stats --debug

# Control output format
cmem search "bug" --output json
cmem stats --quiet  # Suppress non-essential output
cmem help --no-color  # Disable colors for CI/CD
```

Available flags:
- `--dry-run` - Preview changes without making them
- `--config <path>` - Use custom config file
- `--force` - Skip confirmation prompts
- `--debug` - Show detailed execution info
- `--quiet` - Suppress non-essential output
- `--output <format>` - Output format (json/yaml/text)
- `--no-color` - Disable colored output
- `--verbose` - Show detailed information

## 📊 Advanced Features

### Pattern Resolution
```bash
# Learn from problems
cmem pattern "Memory leak in useEffect" "Always cleanup subscriptions" 1.0 critical

# Document solutions
cmem pattern resolve abc123 "Added cleanup function to all effects"
```

### Session Control
```bash
# Manual session management (optional)
cmem session start "Feature: Payment Integration"
cmem session end "Completed Stripe integration"

# View history
cmem session list
```

### Import/Export (Enhanced in v1.10.0)
```bash
# Basic export (JSON format)
cmem export memory-backup.json

# Export with different formats
cmem export report.md --format markdown
cmem export data.yaml --format yaml
cmem export tasks.csv --format csv

# Filter by data types
cmem export tasks-only.json --types tasks
cmem export --types tasks,patterns,decisions

# Date range filtering
cmem export --from 2024-01-01 --to 2024-12-31
cmem export quarterly-report.md --format markdown --from 2024-10-01

# Sanitize sensitive information
cmem export --sanitized team-memory.json

# Combine options for focused exports
cmem export sprint-report.md --format markdown --types tasks,decisions --from 2024-01-01 --sanitized

# Bulk task operations
cmem task add-bulk tasks.json     # Import multiple tasks
cmem task export json > tasks.json # Export tasks for backup
```

**Export Formats:**
- **JSON**: Complete data structure, perfect for backups and re-import
- **YAML**: Human-readable, good for configuration management
- **CSV**: Spreadsheet-compatible for analysis
- **Markdown**: Documentation-ready reports

### Import Command (v1.10.0)
```bash
# Basic import (merge mode by default)
cmem import backup.json

# Import with replace mode (clears existing data)
cmem import fresh-start.json --mode replace

# Preview import without making changes
cmem import data.json --dry-run

# Import specific data types only
cmem import tasks.json --types tasks
cmem import --types tasks,patterns archived-data.yaml

# Import from YAML
cmem import config.yaml

# Combine options
cmem import sprint-data.json --types tasks,decisions --dry-run
```

**Import Features:**
- **Merge Mode** (default): Adds new items, skips duplicates by ID
- **Replace Mode**: Clears existing data before importing
- **Type Filtering**: Import only specific data types
- **Format Support**: JSON and YAML files
- **Validation**: Ensures data integrity before import
- **Dry Run**: Preview changes without applying them

### Report Generation (v1.10.0)
```bash
# Generate project summary report
cmem report
cmem report summary

# Different report types
cmem report tasks                  # Task-focused report
cmem report patterns               # Pattern analysis
cmem report decisions              # Decision log
cmem report progress               # Progress timeline
cmem report sprint                 # 2-week sprint summary

# Output formats
cmem report --format json          # JSON format
cmem report --format markdown      # Markdown (default)

# Save to file
cmem report summary project-status.md
cmem report sprint sprint-review.md

# Auto-save with timestamps (v1.10.0)
cmem report summary --save                        # Saves to .claude/reports/
cmem report sprint --save --format json          # Auto-timestamp: sprint-20240115143022.json
cmem report tasks --save --save-dir ./archives   # Custom directory

# Date filtering
cmem report --from 2024-01-01 --to 2024-01-31
cmem report tasks monthly.md --from 2024-01-01
```

**Report Types:**
- **Summary**: High-level project overview with statistics
- **Tasks**: Detailed task breakdown by status
- **Patterns**: Pattern analysis with priorities and solutions
- **Decisions**: Chronological decision log with reasoning
- **Progress**: Timeline of activities and completion metrics
- **Sprint**: 2-week activity summary for agile workflows

### Summary Management
```bash
# Create a new summary with context
cmem summary generate "Sprint Retrospective"

# Link to specific session
cmem summary generate "Feature Complete" --session 2025-01-15-morning

# List all summaries
cmem summary list

# View a summary
cmem summary view 2025-01-15-sprint-retrospective
```

The `.claude/summaries/` directory stores narrative documentation that complements your structured memory data. Generated summaries include context from your current session (tasks, decisions, patterns) and provide a template for adding your insights.

### AI Assistant Handoffs
```bash
# Generate comprehensive handoff summary (saves to HANDOFF.md)
cmem handoff

# Output to console instead of file
cmem handoff --stdout

# JSON format for programmatic use
cmem handoff --format=json

# Focus on specific information
cmem handoff --include=tasks
cmem handoff --include=decisions
```

Perfect for transitioning between AI assistants or team members. The handoff summary is saved to `HANDOFF.md` by default to prevent accidental overwrites of `CLAUDE.md`. Includes active tasks, recent decisions, key patterns, and session context.

## 🔄 Workflow Examples

### Daily Development Flow
```bash
# Morning - Memory handles everything automatically
$ cd my-project
$ echo "Continue where I left off yesterday"
# Claude reads CLAUDE.md, knows exactly what you were doing

# Make decisions - Memory captures them
$ cmem decision "Switch to TypeScript" "Type safety for scale" "Keep JS"

# Track progress - Memory maintains context  
$ cmem task complete task-123 "Refactored auth module"

# Evening - Memory auto-rotates session with summary
# Everything saved, backed up, and ready for tomorrow
```

### Team Collaboration
```bash
# Developer A works on auth
$ cmem session start "Auth System Implementation"
# ... work happens, patterns learned, decisions made ...

# Developer B picks up the next day
$ cat CLAUDE.md  # Sees auth decisions, patterns, progress
$ echo "Continue auth implementation"
# Claude knows exactly what Developer A did
```

## 🎯 Best Practices

1. **Commit CLAUDE.md** - Share team knowledge
2. **Don't worry about sessions** - They manage themselves
3. **Document decisions** - Future you will thank you
4. **Track patterns** - Claude learns and improves
5. **Let it run** - The magic happens automatically

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

- 🐛 [Report bugs](https://github.com/robwhite4/claude-memory/issues/new?template=bug_report.md)
- 💡 [Request features](https://github.com/robwhite4/claude-memory/issues/new?template=feature_request.md)
- 📖 [Read contribution guidelines](CONTRIBUTING.md)
- 📜 [View code of conduct](CODE_OF_CONDUCT.md)

## 📄 License

MIT © Rob White

---

**Stop explaining your project over and over. Install Claude Memory and let AI truly understand your codebase.**

```bash
npm install -g claude-memory && cmem init
```