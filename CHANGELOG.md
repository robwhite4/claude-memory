# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.9.0] - 2025-06-08

### Added
- **--dry-run flag** (Issue #22)
  - Preview changes without executing them
  - Works globally across all commands
  - Shows clear "DRY RUN MODE" indicator
  - Prevents all file system changes and memory updates
  - Verbose mode shows detailed "Would" messages
  - Comprehensive test coverage for dry run behavior

### Changed
- **Code Refactoring** (Issue #32)
  - Modularized monolithic `bin/claude-memory.js` into smaller components
  - Extracted `ClaudeMemory` class to `lib/ClaudeMemory.js` (1,016 lines)
  - Created `lib/utils/` directory with focused modules:
    - `validators.js` - Input validation functions
    - `sanitizers.js` - Security sanitization functions
    - `formatters.js` - Output formatting functions
  - Reduced main file from 2,828 to 1,770 lines (37% reduction)
  - No breaking changes - all functionality preserved

### Documentation
- Updated README with code structure section
- Added comprehensive test file for --dry-run functionality

## [1.8.2] - 2025-06-07

### Added
- Comprehensive multi-machine development documentation
- Team development guidelines and best practices
- Memory management section in CONTRIBUTING.md
- Gitignore templates for different team setups (examples/gitignore-templates.md)
- Merge conflict resolution strategies for context files

### Changed
- Updated README with dedicated "Multi-Machine & Team Development" section
- Enhanced CONTRIBUTING.md with project memory guidelines

### Documentation
- Clarified when to commit `.claude/context/` files vs keep them local
- Added workflows for solo developers on multiple machines
- Documented team approaches (memory keeper, shared memory, hybrid)
- Created retroactive Issue #21 for documentation purposes

## [1.8.1] - 2025-06-07

### Fixed
- Corrected `package.json` main field pointing to non-existent `src/memory.js`
- Added missing `.npmignore` file for cleaner npm packages
- Added missing `RELEASE_NOTES_1.6.0.md` to version control
- Included v1.7.0 context files in repository for development continuity

### Changed
- Updated `.gitignore` with better Claude Memory patterns
- Clarified version control guidance in README
- Removed stale export file from repository

## [1.8.0] - 2025-06-06

### Added
- **CLI Flags Enhancement** (Issue #19)
  - `--version, -v` flag to display version information
  - `--quiet, -q` flag to suppress non-essential output
  - `--output, -o <format>` flag to control output format (json, text, yaml)
  - `--no-color` flag to disable colored output and emojis (for CI/CD)
  - `--verbose` flag to show detailed execution information
  - Made `cmem` alias more prominent in documentation and help text
  - Added GLOBAL FLAGS section to help output

### Changed
- Updated USAGE line to show both commands: "claude-memory (or cmem) [command] [options]"
- All help examples now use `cmem` for brevity
- Test suite expanded to cover new CLI flags
- Stats command now supports JSON and YAML output formats
- Search command respects global output format (while maintaining --json override)

## [1.7.0] - 2025-06-06

### Added
- **Multi-File Context System** (Issue #17)
  - New `.claude/context/` directory with full, untruncated content
  - `knowledge.md` - Complete knowledge base with all values
  - `patterns.md` - Full pattern history and descriptions
  - `decisions.md` - Complete decision log with reasoning
  - `tasks.md` - Detailed task information with assignments
  - CLAUDE.md now includes references to context files
  - Preserves all information while keeping main file token-optimized

### Changed
- **Token Efficiency Claims** (Issue #16)
  - Removed unverified percentage claims from README
  - Replaced with accurate qualitative descriptions
  - Added explanation of token optimization benefits
  - Documented the multi-file context system

### Fixed
- Knowledge truncation issue - all values now preserved in context files
- Token optimization no longer loses critical information

## [1.6.0] - 2025-06-05

### Added
- **Enhanced Help System** (Issue #9)
  - Redesigned main help with clean, organized layout and emoji icons
  - Contextual help for all commands (`help <command>`)
  - Command-specific examples, options, and workflows
  - Smart error messages with command suggestions for typos
  - Comprehensive usage patterns and real-world workflows
- **CLAUDE.md Merge Strategy** (Issue #8)  
  - Intelligent merge system with manual section preservation
  - Section markers: `<!-- BEGIN/END MANUAL SECTION: name -->`
  - Automatic backup creation before each update
  - Keeps last 5 CLAUDE.md backups automatically
  - Prevents loss of manual edits during auto-generation

### Changed
- Help command output is now more concise and navigable
- Improved user experience with better command discovery
- Error messages now suggest similar commands when typos occur

### Fixed
- CLAUDE.md overwrites no longer lose manual content
- Help system properly documents all v1.5.0 features

## [1.5.0] - 2025-06-05

### Added
- **Pattern Subcommands** (Issues #1-4)
  - `pattern add` - Learn patterns with effectiveness scores
  - `pattern list` - View patterns with priority filtering
  - `pattern search` - Search patterns by query
  - `pattern resolve` - Mark patterns as resolved
- **Knowledge Management System** (Issue #5)
  - `knowledge add/get/list/delete` commands
  - Category-based organization
  - Persistent storage across sessions
- **Enhanced Search** (Issue #6)
  - Type filtering (`--type decisions|patterns|tasks|knowledge`)
  - Result limiting (`--limit N`)
  - JSON output format (`--json`)
- **Additional Improvements** (Issue #7)
  - Better error handling across all commands
  - Improved command validation
  - Enhanced user feedback

### Changed
- Pattern commands now use subcommand syntax instead of positional args
- Search results include knowledge base entries
- Better organization of memory data structures

### Fixed
- Pattern priority parsing issues
- Search command type validation
- Knowledge retrieval across categories

## [1.4.1] - 2025-06-04

### Fixed
- **Critical Usability Issues** (PRs #9, #10)
  - Pattern command now properly handles priority argument
  - Fixed argument parsing for pattern effectiveness scores
  - Corrected task priority validation
  - Improved error messages for invalid inputs
- Test suite compatibility across Node.js versions
- Enhanced input validation for all commands

### Changed
- More helpful error messages when commands fail
- Better handling of optional arguments

## [Unreleased]

## [1.4.0] - 2025-06-03

### Added
- Comprehensive input sanitization and validation system
- AI handoff command for seamless assistant transitions (`claude-memory handoff`)
- Export data sanitization with `--sanitized` flag
- Security protection against XSS and path traversal attacks
- Automatic version migration for memory files
- Comprehensive security test suite

### Changed
- Enhanced export command with proper flag parsing
- Improved input validation across all commands
- Updated Node.js badge to match package.json requirements (14+)
- Strengthened error handling and user input processing

### Fixed
- Version inconsistencies between README and package.json
- Export --sanitized flag functionality (was treating as filename)
- Memory file version tracking and migration
- Path traversal vulnerability in user inputs
- XSS vulnerability in decision and task descriptions

### Security
- Added input length limits to prevent buffer overflow
- Implemented path validation to prevent directory traversal
- Added HTML/script tag filtering to prevent XSS attacks
- Enhanced data sanitization for export functionality

## [1.3.1] - 2025-06-03

### Added
- Enhanced GitHub release automation with assets and changelog content
- License file (MIT)
- Professional release workflow
- GitHub releases for all versions

### Fixed
- GitHub Actions workflow permissions for automated releases
- Release process now includes downloadable assets

## [1.3.0] - 2025-06-03

### Added
- GitHub workflow templates for professional development
- Enhanced release automation
- Comprehensive development documentation

## [1.2.0] - 2025-06-03

### Added
- Automatic session management - sessions start and rotate every 4 hours
- Automatic backups - triggered by actions, time, and session rotation
- Configuration system with `.claude/config.json`
- Token optimization mode - reduces CLAUDE.md size for efficiency
- `context` command for AI integration (returns JSON)
- `config` command to view and modify settings
- Silent mode for background operation
- Automatic cleanup of old backups (keeps 7 days)
- Integration hooks for claude-code

### Changed
- Sessions now auto-start based on time of day
- Memory class accepts options for silent/automatic operation
- CLAUDE.md content optimized when tokenOptimization enabled
- Backup system now tracks actions and time since last backup
- README completely rewritten to emphasize automatic operation

### Fixed
- Current session now properly loaded on memory initialization
- Session status tracking improved

## [1.1.3] - 2025-06-02

### Added
- GitHub workflow templates for issues and pull requests
- Contributing guidelines and code of conduct
- Automated release workflow

### Fixed
- Default to current directory for stats, search, backup, and export commands
- Improved error messages when memory not initialized
- Updated help text to indicate default behaviors

### Changed
- Commands now gracefully handle missing path arguments

## [1.1.2] - 2025-06-02

### Fixed
- Added support for --help, -h, and help flags with proper exit code
- Fixed Windows compatibility in test suite
- CI/CD pipeline now passes on all platforms

## [1.1.1] - 2025-06-01

### Added
- Real code coverage reporting with c8 (78.79% coverage)
- ESLint integration with JavaScript Standard Style
- Professional CI/CD pipeline with multi-platform testing
- Security policy and badges

### Fixed
- NPM and download badge URLs
- Executable permissions on CLI file

## [1.1.0] - 2025-06-01

### Added
- Task management system with add, complete, and list commands
- Pattern resolution feature to mark patterns as solved
- Enhanced session management with cleanup command
- Session-specific endings with session IDs
- Task priorities and assignees
- Pattern priorities (critical/high/medium/low)

### Changed
- Improved CLAUDE.md structure with task sections
- Enhanced pattern tracking with status field

## [1.0.0] - 2025-06-01

### Added
- Initial release
- Core memory system with sessions, decisions, and patterns
- CLAUDE.md generation for AI context
- Search functionality
- Backup and export features
- Session tracking
- Git integration