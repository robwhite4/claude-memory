# Claude Memory System

> Transform any AI conversation into persistent project intelligence

[![npm version](https://img.shields.io/npm/v/claude-memory.svg)](https://www.npmjs.com/package/claude-memory)
[![CI/CD Pipeline](https://github.com/robwhite4/claude-memory/actions/workflows/ci.yml/badge.svg)](https://github.com/robwhite4/claude-memory/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)](https://nodejs.org/)
[![Downloads](https://img.shields.io/npm/dt/claude-memory.svg)](https://www.npmjs.com/package/claude-memory)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/robwhite4/claude-memory/pulls)
[![Code Quality](https://img.shields.io/badge/code%20quality-A-brightgreen.svg)](https://github.com/robwhite4/claude-memory)
[![Test Coverage](https://img.shields.io/badge/coverage-78.79%25-brightgreen.svg)](https://github.com/robwhite4/claude-memory/actions)
[![Code Quality](https://img.shields.io/badge/eslint-passing-brightgreen.svg)](https://github.com/robwhite4/claude-memory)
[![Tests](https://img.shields.io/badge/tests-25%20passed-brightgreen.svg)](https://github.com/robwhite4/claude-memory/actions)

## ⚡ Quick Start

```bash
# Install globally
npm install -g claude-memory

# Initialize in any project
cd your-project
claude-memory init

# Start using immediately
echo "Load project memory and help me with development"
```

## 🎯 What This Solves

**Before Claude Memory:**
```
You: "Help me deploy this app"
Claude: "What's your tech stack? What deployment platform?"
You: [5 minutes explaining context from scratch]

You: "What tasks need to be done?"
Claude: "I'd need to see your codebase to understand current status..."
You: [Re-explaining project state and priorities]
```

**After Claude Memory:**
```
You: "Load project memory and help with deployment"
Claude: "I see this is a Node.js app with AWS ECS. Based on our 
previous deployment pattern, I'll check the Docker config first..."

You: "Load project memory and show current tasks" 
Claude: "You have 3 high-priority tasks: API rate limiting, error 
handling, and database optimization. The auth system was completed 
yesterday. Should we tackle rate limiting next?"
```

## 🧠 Core Features

- **🔄 Persistent Memory**: Claude remembers everything across sessions
- **📋 Decision Tracking**: Why every choice was made, with alternatives
- **🧩 Pattern Learning**: AI gets smarter by learning from your project
- **✅ Task Management**: Track TODOs, priorities, and completion with CLI commands
- **🎯 Pattern Resolution**: Mark patterns as solved with documented solutions
- **🔍 Smart Search**: Find any decision, pattern, or knowledge instantly
- **📝 Living Documentation**: CLAUDE.md stays current automatically
- **🚀 Zero Setup**: Works immediately after one command

## 📦 Installation

### Global Installation (Recommended)
```bash
npm install -g claude-memory
```

### Per-Project Installation
```bash
npm install claude-memory
npx claude-memory init
```

### Alternative Installation
```bash
# Via yarn
yarn global add claude-memory

# Via pnpm  
pnpm add -g claude-memory
```

## 🚀 Usage

### Initialize Memory in Any Project
```bash
cd your-project
claude-memory init

# Or specify project name
claude-memory init "My Amazing App"
```

### The Magic Phrase
Every conversation with Claude should start with:
> **"Load project memory and [your task]"**

### CLI Commands
```bash
# View project intelligence
claude-memory stats

# Search knowledge base
claude-memory search "authentication"

# Task management (NEW in v1.1.0)
claude-memory task add "Implement rate limiting" --priority high
claude-memory task add "Write tests" --assignee sarah --due "2025-01-15"
claude-memory task complete abc123 "Added Redis middleware"
claude-memory task list open

# Pattern management (Enhanced in v1.1.0)
claude-memory pattern "Test locally first" "Prevents production issues" 0.9 high
claude-memory pattern resolve def456 "Added automated testing pipeline"

# Manual operations (usually automatic)
claude-memory decision "Use PostgreSQL" "Better JSON support"

# Session management (Enhanced in v1.1.0)
claude-memory session start "Feature Development"
claude-memory session end "Authentication completed"
claude-memory session cleanup  # End all active sessions

# Backup and export
claude-memory backup
claude-memory export data.json
```

## 📁 What Gets Created

```
your-project/
├── CLAUDE.md              # Living project memory
├── .claude/
│   ├── memory.json        # Structured intelligence storage
│   ├── sessions/          # Session history
│   └── backups/           # Automatic backups
└── .gitignore             # Updated to handle memory files
```

## 🎨 Project Examples

### Web Development
```bash
cd my-web-app
claude-memory init "E-commerce Platform"

# Add tasks and track progress
claude-memory task add "Implement user authentication" --priority high
claude-memory task add "Set up payment processing" --assignee "alex"

# Tell Claude:
"Load project memory and implement user authentication"
# Claude sees: current tasks, previous decisions, learned patterns

claude-memory task complete abc123 "OAuth with JWT implemented"
```

### Data Science
```bash
cd ml-project
claude-memory init "Customer Analytics" 

# Track model iterations
claude-memory task add "Optimize prediction accuracy" --priority high
claude-memory pattern "Feature scaling" "StandardScaler works best" 0.85

# Tell Claude:
"Load project memory and optimize the prediction model"
# Claude knows: previous experiments, what worked, current goals

claude-memory pattern resolve def456 "Used ensemble methods, +15% accuracy"
```

### DevOps/Infrastructure
```bash
cd infrastructure
claude-memory init "Kubernetes Cluster"

# Track deployment issues and solutions
claude-memory task add "Fix pod scaling issues" --priority critical
claude-memory decision "Use HPA" "Better auto-scaling than manual" "VPA,Manual"

# Tell Claude:
"Load project memory and troubleshoot the deployment pipeline"
# Claude understands: infrastructure decisions, known issues, patterns
```

## 🏢 Team Usage

### Shared Intelligence
```bash
# Commit CLAUDE.md to share team knowledge
git add CLAUDE.md
git commit -m "Update project intelligence"

# New developers get instant context
git clone project-repo
cd project-repo
claude-memory stats  # See accumulated intelligence
```

### Onboarding Automation
New team members read `CLAUDE.md` and understand:
- Why every architectural decision was made
- What patterns work best for this project
- Current project context and conventions

## 🔄 Cross-Project Benefits

Intelligence learned in one project improves ALL projects:

```bash
# Pattern learned in Project A
"Always validate API inputs early to prevent downstream errors"

# Automatically applied in Project B when working on APIs
# Knowledge compounds across your entire development workflow
```

## 📊 Memory Statistics

```bash
claude-memory stats
```

```
📊 Claude Memory Statistics

Sessions: 15
Decisions: 23
Patterns: 8
Actions: 156
Knowledge Items: 34 (6 categories)

🕒 Recent Sessions:
  • API Optimization (2025-06-01)
  • Database Migration (2025-05-30)
  • Security Audit (2025-05-29)

🤔 Recent Decisions:
  • Use Redis for session storage
  • Implement JWT with refresh tokens
  • Deploy with blue-green strategy
```

## 🔍 Smart Search

```bash
claude-memory search "authentication"
```

```
🔍 Search results for: "authentication"

📋 Decisions:
  • Implement JWT authentication (2025-05-30)
    More secure than session cookies, supports microservices

🧩 Patterns:
  • Validate tokens early in middleware: Prevents unauthorized access

💡 Knowledge:
  • [security] JWT_SECRET: Stored in environment variables
  • [config] AUTH_TIMEOUT: 15 minutes for security
```

## 📈 ROI & Cost Benefits

### Time Savings
**Time saved per developer:**
- Context switching: 25 min/week
- Repeated explanations: 1.75 hours/week
- Finding old decisions: 55 min/week
- **Total: 2.75 hours/week per developer**

**10-person team: $140,000/year value at $100/hour**

### AI Usage Cost Reduction

#### Traditional Approach (High Token Usage):
```
Session 1: "Help with authentication"
→ Claude explores codebase (15,000 tokens)
→ Discovers patterns, architecture, previous decisions

Session 2: "Help with API endpoints"  
→ Claude re-explores codebase (15,000 tokens)
→ Re-discovers same context and patterns

Session 3: "Help with testing"
→ Claude explores again (15,000 tokens)
→ Rebuilds understanding from scratch
```

#### With claude-memory (Optimized Usage):
```
Session 1: "Load project memory and help with authentication"
→ Claude reads CLAUDE.md (500 tokens)
→ Instantly knows: JWT patterns, security decisions, current tasks

Session 2: "Load project memory and help with API endpoints"
→ Claude reads CLAUDE.md (500 tokens)
→ Knows: auth is JWT, database schema, patterns learned

Session 3: "Load project memory and help with testing"
→ Claude reads CLAUDE.md (500 tokens)
→ Understands: testing patterns, what works, current coverage
```

**Result: ~40-60% reduction in AI tokens after initial setup week**

**Cost trajectory:**
- **Week 1**: Slightly higher (building project intelligence)
- **Week 2+**: Significantly lower (leveraging persistent memory)  
- **Month 2+**: Dramatically more efficient with compound intelligence

## 🤝 Contributing

```bash
git clone https://github.com/robwhite4/claude-memory.git
cd claude-memory
npm install
npm test
```

## 📄 License

MIT License - Use anywhere, modify freely, no restrictions.

## 🌟 Success Stories

> *"I spent 3 hours debugging the same OAuth issue across different sessions. With Claude memory, it remembered the solution and fixed it in 5 minutes the next time."*
> 
> — Individual Developer

> *"The task management system is a game-changer. Claude now knows exactly what needs to be done and can prioritize work based on our active tasks. No more 'what should I work on next?' conversations."*
> 
> — Senior Developer

> *"New developers used to take 2 weeks to understand our architecture decisions. Now they read CLAUDE.md and understand the reasoning behind every choice in 2 hours."*
> 
> — Development Team Lead

> *"Pattern resolution is brilliant. When we solve a recurring issue, we mark the pattern as resolved with our solution. Claude remembers this and applies the same fix to similar problems automatically."*
> 
> — DevOps Engineer

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

- 🐛 [Report bugs](https://github.com/robwhite4/claude-memory/issues/new?template=bug_report.md)
- 💡 [Request features](https://github.com/robwhite4/claude-memory/issues/new?template=feature_request.md)
- 📖 [Read contribution guidelines](CONTRIBUTING.md)
- 📜 [View code of conduct](CODE_OF_CONDUCT.md)

## 📄 License

MIT © Rob White

---

**Transform your AI conversations today. Install Claude Memory and never lose context again.**

```bash
npm install -g claude-memory && claude-memory init
```