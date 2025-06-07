# Architecture Overview

This document describes the technical architecture of Claude Memory.

## 🏗️ System Architecture

```
┌─────────────────┐     ┌──────────────────┐
│   CLI (cmem)    │────▶│  Memory System   │
└─────────────────┘     └──────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌──────────────────┐
│  Command Parser │     │   File System    │
└─────────────────┘     └──────────────────┘
                                 │
                        ┌────────┴────────┐
                        ▼                 ▼
                ┌──────────────┐  ┌──────────────┐
                │  .claude/    │  │  CLAUDE.md   │
                └──────────────┘  └──────────────┘
```

## 📁 Directory Structure

```
project-root/
├── CLAUDE.md                 # Primary AI context (committed)
└── .claude/                  # Memory system directory
    ├── memory.json          # Core data store
    ├── config.json          # User configuration
    ├── context/             # Full context files (v1.7.0+)
    │   ├── knowledge.md     # Complete knowledge base
    │   ├── patterns.md      # All patterns
    │   ├── decisions.md     # Decision history
    │   └── tasks.md         # Task details
    ├── backups/             # Automatic backups
    │   └── YYYY-MM-DD/      # Daily backup folders
    └── sessions/            # Session data (future)
```

## 🧩 Core Components

### 1. CLI Layer (`bin/claude-memory.js`)
- Command parsing and routing
- Global flag handling
- Input validation
- Output formatting

### 2. Memory System (inline in CLI)
- Data persistence
- CLAUDE.md generation
- Context file management
- Backup operations

### 3. Data Models

#### Memory Structure
```javascript
{
  version: "1.8.2",
  projectName: "Project Name",
  createdAt: "ISO-8601",
  sessions: [...],
  decisions: [...],
  patterns: [...],
  tasks: [...],
  actions: [...],
  knowledge: { category: { key: value } }
}
```

#### Session Model
```javascript
{
  id: "uuid",
  name: "Session Name",
  startedAt: "ISO-8601",
  endedAt: "ISO-8601",
  outcome: "string",
  decisionsCount: 0,
  patternsCount: 0
}
```

#### Decision Model
```javascript
{
  id: "uuid",
  timestamp: "ISO-8601",
  sessionId: "uuid",
  decision: "string",
  reasoning: "string",
  alternatives: ["string"],
  impact: "string"
}
```

## 🔄 Data Flow

### 1. Command Execution
```
User Input → CLI Parser → Validation → Command Handler → Memory Update → File Write → CLAUDE.md Generation
```

### 2. CLAUDE.md Generation
```
Memory Data → Token Optimization → Template Rendering → Section Assembly → File Write
```

### 3. Context File Generation (v1.7.0+)
```
Memory Data → Category Grouping → Markdown Formatting → Individual File Write
```

## 🎯 Design Principles

### 1. Single Source of Truth
- `memory.json` contains all data
- Other files are generated views
- No data duplication

### 2. Token Efficiency
- CLAUDE.md optimized for AI consumption
- Truncation with references to full data
- Smart summarization

### 3. Human Readable
- All files in Markdown or JSON
- Clear structure and formatting
- Self-documenting

### 4. Extensibility
- Plugin system planned for v2.0
- Clean command structure
- Modular design

## 🔐 Security Considerations

### Input Validation
- Path traversal prevention
- XSS protection in outputs
- Command injection prevention
- Size limits on inputs

### File System
- Restricted to project directory
- Safe file operations
- Backup before modifications

## 🚀 Performance

### Current Optimizations
- Lazy loading of memory
- Efficient file writes
- Minimal dependencies

### Future Improvements
- Streaming for large files
- Indexed searches
- Background operations
- Memory compression

## 🔌 Integration Points

### 1. Git Integration
- `.gitignore` awareness
- Commit helpers planned
- Branch-aware sessions

### 2. AI Assistant Integration
- CLAUDE.md format
- Token optimization
- Context references

### 3. Editor Integration (Future)
- VS Code extension planned
- Language server protocol
- Real-time updates

## 📊 Configuration System

### Default Configuration
```json
{
  "autoSession": true,
  "autoSessionHours": 4,
  "autoBackup": true,
  "backupInterval": 10,
  "maxBackupDays": 7,
  "tokenOptimization": true,
  "silentMode": false
}
```

### Environment Variables
- `CLAUDE_MEMORY_CONFIG` - Alternate config path
- `CLAUDE_MEMORY_SILENT` - Silent mode
- `CLAUDE_MEMORY_PROJECT` - Project name override

## 🧪 Testing Architecture

### Test Levels
1. **Unit Tests** - Individual functions
2. **Integration Tests** - Command flows
3. **Security Tests** - Input validation
4. **E2E Tests** - Full workflows

### Test Coverage
- Target: 80%+ coverage
- Critical paths: 100%
- Security: 100%

---

*For implementation details, see the source code and [[Development Workflow]].*