# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.11.1] - 2025-07-08

### Changed
- Updated README.md for accuracy and clarity
  - Added "Latest Release" section highlighting v1.11.0 features
  - Updated test count badges (40 tests, 85%+ coverage)
  - Consolidated export/import examples for better readability
  - Reduced repetitive documentation
  - Improved conciseness while maintaining completeness

### Documentation
- Fixed outdated test statistics in README badges
- Streamlined command examples to reduce redundancy
- Added prominent v1.11.0 feature highlights at the top of README

## [1.11.0] - 2025-07-05

### Added
- Summary management commands for `.claude/summaries/` directory (Issue #73)
  - `summary generate` - Create summaries with contextual templates
  - `summary list` - List all available summaries
  - `summary view` - View specific summary content
  - Summaries include context from current session (tasks, decisions, patterns)
  - Support for linking summaries to specific sessions

### Changed
- The previously empty `.claude/summaries/` directory now has functionality
- Summaries are tracked in memory.json for better integration

### Fixed
- Fixed `handoff` command overwriting CLAUDE.md (Issue #54)
  - Handoff now saves to HANDOFF.md by default to prevent data loss
  - Added `--stdout` flag to output to console when needed
  - Updated help text and documentation to reflect new behavior
- Fixed stale knowledge counts in CLAUDE.md (Issue #53)
  - Knowledge counts now update immediately after add/remove operations
  - CLAUDE.md stays in sync with actual knowledge base contents

## [1.10.3] - 2025-06-17

### Fixed
- Fixed npm package integrity issue
  - v1.10.2 package on npm registry had corrupted integrity checksum
  - Users upgrading from v1.10.1 to v1.10.2 encountered `EINTEGRITY` errors
  - This release republishes the package with correct integrity hash
  - No code changes from v1.10.2

## [1.10.2] - 2025-06-15

### Fixed
- Fixed report command `--type` flag handling (Issue #48)
  - `report --type progress` now works correctly instead of showing "Unknown report type: --type"
  - Both positional (`report progress`) and flag (`report --type progress`) syntaxes are supported
  - Added test coverage for both syntax variations

## [1.10.1] - 2025-06-14

### Fixed
- Fixed `--help` flag not working on subcommands (Issue #46)
  - `task --help`, `export --help`, `import --help`, etc. now show proper help text
  - All subcommands now recognize both `--help` and `-h` flags
  - Previously showed "Unknown flag" errors instead of help

## [1.10.0] - 2025-06-14

### Added
- Bulk task operations with JSON import/export (Issue #27)
  - `task add-bulk <file.json>` - Import multiple tasks from JSON file
  - `task export [format] [status]` - Export tasks to JSON or GitHub issue format
- Enhanced export command with advanced filtering (Issue #30)
  - Multiple output formats: JSON, YAML, CSV, Markdown
  - Type filtering with `--types` flag
  - Date range filtering with `--from` and `--to` flags
  - Metadata control with `--no-metadata` flag
  - Sanitization option with `--sanitized` flag
- New report generation command (Issue #30)
  - Six report types: summary, tasks, patterns, decisions, progress, sprint
  - JSON and Markdown output formats
  - Date range filtering for focused reports
  - File output support for all report types
- New import command with advanced options (Issue #30)
  - Merge mode (default): Adds new items, skips duplicates
  - Replace mode: Clears existing data before importing
  - Type filtering with `--types` flag
  - Dry-run mode with `--dry-run` flag
  - Support for JSON and YAML formats
  - Comprehensive validation before import
  - Auto-generates IDs for items without them
- Report auto-save feature (Issue #43)
  - `--save` flag automatically saves reports with timestamps
  - Default location: `.claude/reports/` directory
  - `--save-dir` flag for custom save directories
  - Timestamped filenames: `{type}-{YYYYMMDDHHMMSS}.{ext}`
  - Supports all report types and formats
- Shared JSON schemas for standardized data formats
- Comprehensive test coverage for export, import, and report functionality
- Example JSON format in help documentation
- js-yaml dependency for YAML format support
- CLAUDE.md token optimization improvements
  - Increased knowledge truncation from 80 to 120 characters
  - Added Recent Changes section showing last 7 days of activity
  - Updated command examples to include v1.10.0 features

### Changed
- Enhanced task management with import/export capabilities
- Export command now supports multiple formats beyond JSON
- Updated help documentation to include new bulk operations and report generation
- Improved data filtering capabilities across all export types

### Fixed
- Fixed --help and -h flags not showing general help (Issue #41)
  - Previously these flags were incorrectly passed as arguments to the help command
  - Now properly shows the full help message when using --help or -h
- Added --help and -h to the global flags documentation
## [1.9.1] - 2025-06-14

### Fixed
- Fixed --help and -h flags not showing general help (Issue #41)
  - Previously these flags were incorrectly passed as arguments to the help command
  - Now properly shows the full help message when using --help or -h
- Added --help and -h to the global flags documentation

## [1.9.0] - 2025-06-09

### Added
- Global `--dry-run` flag to preview changes without executing them (Issue #22)
- Global `--config` flag to specify custom config file path (Issue #23)
- Global `--force` flag to skip confirmation prompts (Issue #24)
- Global `--debug` flag for troubleshooting with detailed execution info (Issue #25)
- `CLAUDE_MEMORY_CONFIG` environment variable support
- Comprehensive test coverage for all new CLI flags
- Debug output with timestamps and command parsing details
- Force mode infrastructure for future confirmation prompts

### Changed
- Refactored code into modular structure for better maintainability (Issue #32)
- Main file reduced from 2,828 to 1,770 lines
- Core logic moved to lib/ClaudeMemory.js and utility modules
- Improved error handling with debug mode stack traces
- Enhanced dry run mode with verbose "Would" messages

### Fixed
- ESLint errors in test files
- Conflicts between CLI flags and environment variables

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