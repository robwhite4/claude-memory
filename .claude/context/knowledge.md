# Project Knowledge Base
*Generated: 2025-06-08T21:40:58.704Z | 42 items across 10 categories*

## Navigation
- [architecture](#architecture) (3 items)
- [design](#design) (1 items)
- [features](#features) (2 items)
- [feedback](#feedback) (2 items)
- [implementation](#implementation) (1 items)
- [progress](#progress) (3 items)
- [releases](#releases) (3 items)
- [status](#status) (9 items)
- [testing](#testing) (7 items)
- [workflow](#workflow) (11 items)

## architecture
### Session_Architecture
**Value**: Sessions stored in memory.json, not individual files. Sessions folder exists but unused in current design. Session management uses in-memory storage with auto-session rotation every 4 hours. Auto-backup creates snapshots including sessions.
**Updated**: 2025-06-05T00:41:29.579Z

### code_structure_v1.9
**Value**: Refactored main file into modular structure: bin/claude-memory.js (1,770 lines), lib/ClaudeMemory.js (1,016 lines), lib/utils/ (134 lines total). No breaking changes, all tests passing.
**Updated**: 2025-06-08T21:40:58.681Z

### unified_design_v1.10.0
**Value**: Created unified design proposal addressing user feedback. Phase 1 (v1.10.0) focuses on export/import commands and bulk operations as foundation. Phase 2 (v1.11.0) adds knowledge editing and task dependencies. Phase 3 (v1.12.0) implements GitHub integration. All features build on shared JSON schemas to avoid duplication.
**Updated**: 2025-06-08T02:23:59.156Z

## design
### CLAUDE_Merge_Strategy
**Value**: Section-based merge system: !-- BEGIN MANUAL SECTION -- for user content, !-- BEGIN AUTO SECTION -- for generated content. Backup before writes, detect dirty state, preserve manual edits while updating auto content. Parse existing file to extract manual sections before regeneration.
**Updated**: 2025-06-05T01:02:14.772Z

## features
### v1.5.0_Features
**Value**: Pattern subcommands (add/list/search/resolve), Knowledge management system with categories, Enhanced search with --type filtering (decisions/patterns/tasks/knowledge), JSON output with --json flag, Result limiting with --limit N, All backward compatible
**Updated**: 2025-06-05T00:41:10.713Z

### v1.8.0_CLI_Flags
**Value**: Successfully implemented Issue #19 CLI flags feature. Added 5 flags: --version (show version), --quiet (suppress output), --output format (json/table/markdown), --no-color (disable colors), --verbose (detailed output). All 17 tests passing. PR #20 created for review.
**Updated**: 2025-06-07T00:27:29.759Z

## feedback
### Original_User_Feedback
**Value**: Claude-Memory v1.4.0 usability feedback covering 5 main areas: 1) Pattern management confusion with syntax issues, missing list command, no pattern IDs shown 2) Missing knowledge management system for storing implementation details 3) File sync issues with CLAUDE.md auto-updates overwriting manual edits 4) Limited search with no type filtering, sorting, or result formatting 5) Command discovery problems with long help text and limited examples. User requested subcommands, better pattern syntax, knowledge management, CLAUDE.md merge strategy, and enhanced search with type filtering and JSON output.
**Updated**: 2025-06-05T00:09:03.995Z

### v1.8.2_user_feedback
**Value**: Comprehensive feedback on v1.8.2 received 2025-06-07. WHAT WORKED WELL: 1) Documentation updates were helpful and clear, 2) Branch cleanup improved repo organization, 3) Multi-machine sync guidance was practical, 4) Team collaboration section addressed real needs. AREAS FOR IMPROVEMENT: 1) Installation - npm install warnings about funding and vulnerabilities need addressing, 2) First-time setup - unclear error messages when no .claude directory exists, 3) Performance - noticeable lag with large memory.json files (1MB), 4) Error handling - cryptic errors for permission issues and file conflicts. SUGGESTED IMPROVEMENTS: 1) Setup wizard - interactive first-time setup to create directories and initial config, 2) Performance optimization - implement pagination or chunking for large memory files, 3) Better error messages - user-friendly explanations with suggested fixes, 4) Health check command - verify installation and diagnose common issues. OVERALL RATING: 7/10 - Good foundation with soli
**Updated**: 2025-06-08T00:53:30.993Z

## implementation
### Issue_8_Implementation
**Value**: Successfully implemented CLAUDE.md merge strategy with section markers (!-- BEGIN MANUAL SECTION: Name --), automatic backups to .claude/backups/CLAUDE-*.md, and intelligent merging that preserves manual content while updating auto-generated sections. System tested and operational - manual sections survive multiple auto-updates. All acceptance criteria met.
**Updated**: 2025-06-05T01:06:14.267Z

## progress
### Current_Status_v1.5.0
**Value**: ✅ COMPLETED (7/9 issues): Issues #1-7 covering pattern management fixes, knowledge management system, enhanced search functionality. 🔄 REMAINING (2/9 issues): Issue #8 CLAUDE.md merge strategy, Issue #9 help/UX improvements. Original user feedback 78% addressed with v1.5.0 release. Next focus: Complete remaining UX issues for comprehensive user experience improvements.
**Updated**: 2025-06-05T00:38:47.227Z

### Progress_Status_89_Percent
**Value**: 89% user feedback addressed (8/9 issues complete). Issue #8 CLAUDE.md merge strategy just completed successfully. Only Issue #9 (help/UX improvements) remains for 100% coverage. Ready for final sprint to complete all original v1.4.0 user feedback requirements.
**Updated**: 2025-06-05T01:06:16.513Z

### v1.5.0_Completion_Status
**Value**: 100% complete - All 9 issues from user feedback addressed. PR #13 (Issue #9: Enhanced help) and PR #14 (Issue #8: CLAUDE.md merge) ready for review
**Updated**: 2025-06-05T01:25:15.560Z

## releases
### v1.8.0_release_status
**Value**: Successfully released v1.8.0 with CLI flags enhancement. Fixed version issue by committing package.json update after merge. NPM publish successful, GitHub release created.
**Updated**: 2025-06-07T00:48:18.059Z

### v1.8.0_v1.8.1_releases
**Value**: Successfully released v1.8.0 (CLI flags) and v1.8.1 (housekeeping). Key learnings: 1) Version-first workflow critical, 2) Squash merges may lose version bumps, 3) Need .npmignore for clean packages, 4) Context files optional for teams, 5) Package.json main field must point to actual file.
**Updated**: 2025-06-07T01:43:19.300Z

### v1.8.2_release
**Value**: Documentation release for multi-machine and team workflows. Hotfix pattern used for already-merged changes. Created retroactive Issue #21, proper release with CHANGELOG and release notes.
**Updated**: 2025-06-07T02:46:18.980Z

## status
### Branch_Cleanup_Complete
**Value**: Cleaned up 4 obsolete branches that contained work already merged through other PRs: feature/issue-19-cli-flags (PR #20), feature/v1.7.0-multi-file-context (PR #18), feature/pattern-subcommands, and fix/v1.4.1-hotfixes (PR #10). Repository now only has main branch. Auto-delete enabled for future merges.
**Updated**: 2025-06-07T23:05:05.605Z

### Current_Version
**Value**: v1.8.1 - Latest release includes CLI flags (v1.8.0) and repository housekeeping fixes (v1.8.1)
**Updated**: 2025-06-07T02:13:05.143Z

### Parity_Status_v1.5.0
**Value**: GitHub: main branch up-to-date with v1.5.0 release and project knowledge documentation. NPM: v1.5.0 published and available. Local: repository at v1.5.0, global claude-memory v1.5.0 installed, all systems synchronized. Ready for Issues #8-9 development.
**Updated**: 2025-06-05T00:46:46.757Z

### v1.6.0_NPM_Published
**Value**: v1.6.0 successfully published to npm. Users can now install with 'npm install -g claude-memory' to get all improvements.
**Updated**: 2025-06-06T19:29:37.594Z

### v1.6.0_Released
**Value**: Successfully released v1.6.0 with 100% user feedback addressed. PRs #13 (Issue #9: Enhanced help) and #14 (Issue #8: CLAUDE.md merge) merged. All tests passing.
**Updated**: 2025-06-05T01:43:49.123Z

### v1.7.0_development
**Value**: Starting v1.7.0 development: Issue #16 (README token claims), Issue #17 (multi-file context system). Feature branch: feature/v1.7.0-multi-file-context. Goal: Preserve full context without truncation while maintaining token efficiency.
**Updated**: 2025-06-06T21:46:58.921Z

### v1.7.0_implementation
**Value**: Implemented multi-file context system (Issue #17) and fixed README token claims (Issue #16). Context files now generated in .claude/context/ with full untruncated information. CLAUDE.md remains token-optimized with references to detailed files.
**Updated**: 2025-06-06T21:57:03.698Z

### v1.7.0_released
**Value**: Successfully released v1.7.0 with multi-file context system and README fixes. PR #18 merged, Issues #16 and #17 auto-closed. NPM will auto-publish. Complete release process documented for future releases.
**Updated**: 2025-06-06T22:31:25.699Z

### v1.8.0_Status
**Value**: PR #20 created for Issue #19 CLI flags implementation. All 17 tests passing. Version-first workflow established - already at v1.8.0 in package.json. Ready for review and merge.
**Updated**: 2025-06-07T00:27:58.805Z

## testing
### CLI_Flag_Testing
**Value**: Comprehensive test suite created for CLI flags: test-cli-flags.js with 17 test cases covering all 5 flags. Tests verify flag functionality, interaction between flags, help text inclusion, and edge cases. All tests passing in CI/CD pipeline.
**Updated**: 2025-06-07T00:28:25.815Z

### Merge_Test
**Value**: Testing the CLAUDE.md merge strategy to ensure manual sections are preserved during auto-updates
**Updated**: 2025-06-05T01:03:18.780Z

### Merge_Test_2
**Value**: Second test to verify manual sections are preserved during updates
**Updated**: 2025-06-05T01:04:22.525Z

### Test_Merge_System
**Value**: Testing the new merge implementation with local code
**Updated**: 2025-06-05T01:03:37.904Z

### debug_test
**Value**: Debug multi-file
**Updated**: 2025-06-06T21:55:10.073Z

### test3
**Value**: Testing context files
**Updated**: 2025-06-06T21:55:40.840Z

### test_multi_file
**Value**: Testing the new multi-file context system
**Updated**: 2025-06-06T21:54:45.757Z

## workflow
### Documentation_Release_Pattern
**Value**: Documentation improvements warrant patch releases to ensure NPM users get updated docs. Even without code changes, docs are part of the package and should be versioned.
**Updated**: 2025-06-07T02:28:56.064Z

### GitHub_Planning_Established
**Value**: Set up comprehensive GitHub planning: 1) v1.9.0 milestone for Priority 2 CLI flags (Issues #22-25), 2) v2.0.0 milestone for future major features, 3) Claude Memory Development project board for tracking, 4) All development now starts with GitHub planning before code.
**Updated**: 2025-06-07T23:33:50.902Z

### Multi_Dev_Strategy
**Value**: For teams: 1) Designate a 'memory keeper' who updates project memory, 2) Use PR descriptions for individual decisions, 3) Regular memory review meetings, 4) Consider team-specific vs personal memory separation, 5) Establish naming conventions for knowledge keys
**Updated**: 2025-06-07T02:20:21.266Z

### Recommended_Git_Workflow
**Value**: 1) Make code changes, 2) Test locally, 3) Update memory (cmem decision/knowledge/pattern), 4) Commit all files including CLAUDE.md and context/, 5) Push to GitHub. This ensures memory travels with code across machines.
**Updated**: 2025-06-07T02:18:16.686Z

### Updated_GitHub_Workflow
**Value**: Complete GitHub workflow with branch cleanup: 1) Create issue, 2) Create feature branch, 3) Make changes, 4) Test locally, 5) Update memory, 6) Push branch, 7) Create PR, 8) Wait for CI, 9) Merge PR (branch auto-deleted), 10) Tag/release if needed. Auto-delete is now enabled for the repository.
**Updated**: 2025-06-07T22:52:14.171Z

### Version_First_Workflow
**Value**: New development workflow: Bump version in package.json FIRST before implementing features. This ensures --version flag and all version references are correct from the start. Successfully tested with v1.8.0 development.
**Updated**: 2025-06-07T00:28:41.067Z

### git_co_author
**Value**: Always include Rob White as co-author in commits: Co-Authored-By: Rob White robwhite4@yahoo.com
**Updated**: 2025-06-06T22:05:13.747Z

### github_labels
**Value**: Standard GitHub labels: enhancement (new features), bug (something broken), documentation (docs changes), priority:high/medium/low (urgency), cli (CLI-related), performance (speed/efficiency), breaking-change (requires major version), needs-tests (tests required), good first issue (beginner-friendly), help wanted (community contributions welcome). Colors: priority:high=#FF0000, priority:medium=#FFB000, priority:low=#FFFF00
**Updated**: 2025-06-06T22:59:59.359Z

### github_workflow
**Value**: Professional GitHub workflow: 1) Ensure required labels exist (enhancement, bug, documentation, priority:*, cli, etc.), 2) Create issue with appropriate labels, 3) Create feature branch 'feature/issue-X-description', 4) Make changes on branch, 5) Run 'npm test' and 'npm run lint' before ANY commit, 6) Update version/CHANGELOG, 7) Commit with 'Fixes #X' references, 8) Push branch and create PR, 9) Verify all CI checks pass, 10) Merge PR to main, 11) Create and push version tag, 12) Verify NPM publish and GitHub release. Always: check/create labels, test before commit, reference issues, tag releases.
**Updated**: 2025-06-06T22:58:36.850Z

### release_process
**Value**: Complete release process: 1) Create issues with labels, 2) Create feature branch, 3) Implement changes, 4) Run tests/lint before EVERY commit, 5) Update version in package.json, 6) Update CHANGELOG.md, 7) Commit with 'Fixes #X', 8) Push branch and create PR, 9) Verify CI passes, 10) Merge PR, 11) Create and push version tag, 12) NPM auto-publishes, 13) Create GitHub release with 'gh release create vX.Y.Z --latest', 14) Verify release order. Always: test before commit, create GitHub release immediately, use --latest flag.
**Updated**: 2025-06-06T23:03:25.267Z

### version_strategy
**Value**: Version bumping strategy: MAJOR (2.0.0) for breaking changes, MINOR (1.8.0) for new features, PATCH (1.7.1) for bug fixes. Always bump version in package.json FIRST when starting feature work. Test version flag to verify. Update CHANGELOG.md before committing.
**Updated**: 2025-06-06T23:24:02.346Z

