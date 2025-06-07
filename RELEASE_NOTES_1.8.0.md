# Claude Memory v1.8.0 Release Notes

## 🎯 Overview
Version 1.8.0 introduces essential CLI flags that modern command-line tools require, significantly improving usability in automated environments, CI/CD pipelines, and general developer experience.

## ✨ New Features

### CLI Flags Enhancement (Issue #19)
We've added 5 essential command-line flags that work globally across all commands:

#### 1. **Version Flag** (`--version`, `-v`)
```bash
$ cmem --version
claude-memory v1.8.0
```

#### 2. **Quiet Mode** (`--quiet`, `-q`)
Suppress non-essential output for scripting and automation:
```bash
$ cmem decision "Use React" "Better ecosystem" --quiet
# No output - perfect for scripts
```

#### 3. **Output Format Control** (`--output`, `-o`)
Control output format with support for JSON, YAML, and text:
```bash
$ cmem stats --output json
{
  "statistics": {
    "sessions": 2,
    "decisions": 1,
    "patterns": 0,
    ...
  }
}
```

#### 4. **No Color Mode** (`--no-color`)
Disable colored output and emojis for CI/CD environments:
```bash
$ cmem help --no-color
# Plain text output without ANSI codes or emojis
```

#### 5. **Verbose Mode** (`--verbose`)
Show detailed execution information for debugging:
```bash
$ cmem init "My Project" --verbose
[VERBOSE] Creating project directory: /path/to/project
[VERBOSE] Changed to project directory: /path/to/project
[VERBOSE] Creating memory system instance...
```

### Documentation Improvements
- Made `cmem` alias more prominent throughout all documentation
- Updated USAGE line: `claude-memory (or cmem) [command] [options]`
- All examples now use the shorter `cmem` command
- Added dedicated GLOBAL FLAGS section to help output

## 🔧 Technical Details

### Implementation
- Global flag parsing occurs before command execution
- Flags work consistently across all commands
- No breaking changes to existing functionality
- Comprehensive test coverage (17 test cases)

### Compatibility
- Node.js 14.0.0 or higher required
- Tested on Windows, macOS, and Linux
- Backward compatible with all previous versions

## 📈 Stats
- 5 new CLI flags implemented
- 17 test cases added
- 100% backward compatibility maintained
- 0 breaking changes

## 🙏 Acknowledgments
Special thanks to the community for feedback on CLI usability. This release directly addresses user requests for standard command-line flags.

## 📋 Full Changelog
See [CHANGELOG.md](CHANGELOG.md) for complete details.

## 🚀 Upgrade Instructions
```bash
npm install -g claude-memory@1.8.0
```

Or if you already have it installed:
```bash
npm update -g claude-memory
```

---

*Claude Memory - Transform AI conversations into persistent project intelligence*