## [Unreleased]

## [1.3.1] - 2025-06-03

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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