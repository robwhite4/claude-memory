# Release Notes - v1.9.0

## 🚀 Overview

Claude Memory v1.9.0 brings significant improvements to the CLI experience with new global flags for better control and debugging, plus a major code refactoring that improves maintainability without affecting functionality.

## ✨ New Features

### Global CLI Flags
- **`--dry-run`** - Preview any command without making changes
- **`--config <path>`** - Use custom configuration files
- **`--force`** - Skip confirmation prompts for automation
- **`--debug`** - Get detailed execution information for troubleshooting

### Code Quality Improvements
- Modular architecture reduces main file by 37% (from 2,828 to 1,770 lines)
- Better separation of concerns with dedicated utility modules
- Improved testability and maintainability

## 🎯 Key Improvements

### Developer Experience
```bash
# Preview changes without executing
cmem task add "Important task" --dry-run

# Use a custom config file
cmem init "My Project" --config ./custom-config.json

# Skip confirmations in scripts
cmem session cleanup --force

# Debug issues with detailed output
cmem stats --debug
```

### Architecture Benefits
- Easier to contribute and maintain
- Clear module boundaries
- Reduced complexity in main file
- Better error handling throughout

## 📦 Installation

```bash
npm install -g claude-memory@1.9.0
```

## 🔧 Compatibility

- Node.js 14 or higher required
- Fully backward compatible with v1.8.x
- No breaking changes

## 📚 Documentation

- Updated help text includes all new flags
- Environment variable support documented
- Comprehensive test coverage for all features

## 🙏 Contributors

Thanks to everyone who provided feedback that shaped these improvements!

---

For the complete changelog, see [CHANGELOG.md](./CHANGELOG.md)