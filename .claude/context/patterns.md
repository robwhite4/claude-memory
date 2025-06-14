# Project Patterns
*Generated: 2025-06-14T18:10:48.193Z | 52 total patterns*

## Summary
- Open Patterns: 42
- Resolved Patterns: 10

## Open Patterns
### Critical Priority
#### Fix linting before release (ID: fd74e9b5)
- **Description**: Always run npm run lint before publishing
- **Effectiveness**: 1
- **First Seen**: 2025-06-03T21:47:42.186Z
- **Last Seen**: 2025-06-03T21:47:42.186Z
- **Frequency**: 1

#### Automatic by default (ID: 25b78a8e)
- **Description**: Make tools work without manual intervention - users should get value immediately
- **Effectiveness**: 1
- **First Seen**: 2025-06-03T22:09:31.446Z
- **Last Seen**: 2025-06-03T22:09:31.446Z
- **Frequency**: 1

#### Bug Fix Protocol (ID: 04eaa5e2)
- **Description**: When discovering bugs in released versions, ALWAYS: 1) Create GitHub issue first, 2) Fix on hotfix branch from main, 3) Release as patch version (x.x.1), 4) Cherry-pick to develop if needed. Never fix bugs directly on feature branches.
- **Effectiveness**: null
- **First Seen**: 2025-06-14T16:50:14.550Z
- **Last Seen**: 2025-06-14T16:50:14.550Z
- **Frequency**: 1

### High Priority
#### Dogfooding validates design (ID: 501068e7)
- **Description**: Using your own product reveals real usability issues and missing features
- **Effectiveness**: 0.95
- **First Seen**: 2025-06-01T22:34:28.049Z
- **Last Seen**: 2025-06-01T22:34:28.049Z
- **Frequency**: 1

#### Selective git strategy (ID: ef3b14cb)
- **Description**: Commit curated knowledge (CLAUDE.md) but keep personal memory private (.claude/ folder)
- **Effectiveness**: 0.9
- **First Seen**: 2025-06-01T22:40:26.917Z
- **Last Seen**: 2025-06-01T22:40:26.917Z
- **Frequency**: 1

#### Stay synced with automated releases (ID: 3c4bbfb6)
- **Description**: Always pull after automated releases to stay current with package.json version bumps and changelog updates
- **Effectiveness**: 1
- **First Seen**: 2025-06-03T23:28:06.676Z
- **Last Seen**: 2025-06-03T23:28:06.676Z
- **Frequency**: 1

#### Deep project audits reveal critical improvements (ID: 4f28c98e)
- **Description**: Systematic review of security, features, and documentation uncovers major enhancement opportunities
- **Effectiveness**: 1
- **First Seen**: 2025-06-03T23:47:42.597Z
- **Last Seen**: 2025-06-03T23:47:42.597Z
- **Frequency**: 1

#### Final repository cleanup ensures release readiness (ID: 63abf582)
- **Description**: Systematic removal of test artifacts and verification of all components for production release
- **Effectiveness**: 1
- **First Seen**: 2025-06-04T00:08:06.644Z
- **Last Seen**: 2025-06-04T00:08:06.644Z
- **Frequency**: 1

#### Create GitHub issues before implementing features (ID: b3e7b7e6)
- **Description**: Organization approach that breaks down feedback into logical chunks with clear scope, enables branch-based development, and provides tracking through completion
- **Effectiveness**: 0.95
- **First Seen**: 2025-06-04T22:25:25.803Z
- **Last Seen**: 2025-06-04T22:25:25.803Z
- **Frequency**: 1

#### Dogfood our own tool (ID: 13e9a589)
- **Description**: Use claude-memory to track development of claude-memory itself - store feedback, decisions, and progress in the tool we're building
- **Effectiveness**: 0.95
- **First Seen**: 2025-06-05T00:09:26.902Z
- **Last Seen**: 2025-06-05T00:09:26.902Z
- **Frequency**: 1

#### CLAUDE.md merge strategy success (ID: 8e37a43c)
- **Description**: Section-based merge system preserves manual content while updating auto-generated sections. Backup system protects against data loss. Ready for production deployment.
- **Effectiveness**: 0.95
- **First Seen**: 2025-06-05T01:04:33.665Z
- **Last Seen**: 2025-06-05T01:04:33.665Z
- **Frequency**: 1

#### CLI Flag Implementation (ID: f5b3dbd4)
- **Description**: When implementing CLI flags, ensure comprehensive coverage: version info, output control (format/quiet), color control, and verbosity levels. Follow yargs conventions and add thorough tests for each flag
- **Effectiveness**: 0.95
- **First Seen**: 2025-06-07T00:28:12.902Z
- **Last Seen**: 2025-06-07T00:28:12.902Z
- **Frequency**: 1

#### Rebase after major refactoring (ID: ebc94953)
- **Description**: When refactoring creates structural changes, rebase feature branches instead of merging with conflicts. Steps: 1) Fetch latest develop, 2) Rebase feature branch, 3) Reimplement features cleanly on new structure, 4) Force push updated branch. This maintains cleaner commit history.
- **Effectiveness**: 0.9
- **First Seen**: 2025-06-09T00:31:27.776Z
- **Last Seen**: 2025-06-09T00:31:27.776Z
- **Frequency**: 1

#### Wiki documentation needs (ID: 95f1a1f9)
- **Description**: Always verify wiki commands and configs match actual implementation before publishing
- **Effectiveness**: 1
- **First Seen**: 2025-06-13T02:11:20.601Z
- **Last Seen**: 2025-06-13T02:11:20.601Z
- **Frequency**: 1

### Medium Priority
#### Cost transparency builds trust (ID: 545aa25e)
- **Description**: Being upfront about initial costs vs long-term savings helps users make informed decisions
- **Effectiveness**: 0.85
- **First Seen**: 2025-06-01T22:39:12.048Z
- **Last Seen**: 2025-06-01T22:39:12.048Z
- **Frequency**: 1

#### Automated GitHub releases (ID: 2407f773)
- **Description**: Release workflow automatically creates GitHub releases with changelog content and generates release notes
- **Effectiveness**: 1
- **First Seen**: 2025-06-03T23:03:02.505Z
- **Last Seen**: 2025-06-03T23:03:02.505Z
- **Frequency**: 1

#### Remove unused directories (ID: 1fc60644)
- **Description**: Clean up directories that aren't actually used to avoid confusion
- **Effectiveness**: 1
- **First Seen**: 2025-06-03T23:31:09.151Z
- **Last Seen**: 2025-06-03T23:31:09.151Z
- **Frequency**: 1

#### Direct test (ID: 4018bdf2)
- **Description**: Testing with node
- **Effectiveness**: 0.8
- **First Seen**: 2025-06-04T22:04:52.022Z
- **Last Seen**: 2025-06-04T22:04:52.022Z
- **Frequency**: 1

#### ID test (ID: dba1fa8c)
- **Description**: Testing ID display
- **Effectiveness**: null
- **First Seen**: 2025-06-04T22:13:40.358Z
- **Last Seen**: 2025-06-04T22:13:40.358Z
- **Frequency**: 1

#### Backward compatibility test (ID: 068482a5)
- **Description**: Testing old syntax still works
- **Effectiveness**: 0.8
- **First Seen**: 2025-06-04T22:38:28.179Z
- **Last Seen**: 2025-06-04T22:38:28.179Z
- **Frequency**: 1

#### Bundle related improvements (ID: 106f33ba)
- **Description**: Group related changes into single releases for better coherence and easier adoption
- **Effectiveness**: null
- **First Seen**: 2025-06-06T21:43:16.755Z
- **Last Seen**: 2025-06-06T21:43:16.755Z
- **Frequency**: 1

#### Dogfooding drives quality (ID: 25e3f12f)
- **Description**: Using claude-memory while developing it ensures features work and reveals pain points immediately
- **Effectiveness**: null
- **First Seen**: 2025-06-06T21:47:10.634Z
- **Last Seen**: 2025-06-06T21:47:10.634Z
- **Frequency**: 1

#### Test pattern (ID: c8a38a6c)
- **Description**: Testing multi-file generation
- **Effectiveness**: null
- **First Seen**: 2025-06-06T21:57:39.546Z
- **Last Seen**: 2025-06-06T21:57:39.546Z
- **Frequency**: 1

#### Label GitHub issues (ID: d330b6ba)
- **Description**: Always add appropriate labels when creating issues (bug, enhancement, documentation, etc.) for better organization and tracking
- **Effectiveness**: null
- **First Seen**: 2025-06-06T22:00:41.590Z
- **Last Seen**: 2025-06-06T22:00:41.590Z
- **Frequency**: 1

#### Test before commit (ID: dc7d4364)
- **Description**: Always run 'npm test' and 'npm run lint' before committing code to ensure quality and prevent CI failures
- **Effectiveness**: null
- **First Seen**: 2025-06-06T22:25:12.149Z
- **Last Seen**: 2025-06-06T22:25:12.149Z
- **Frequency**: 1

#### Release checklist (ID: 7b911687)
- **Description**: Follow complete release checklist: □ Issues created with labels, □ Tests passing locally, □ Version bumped, □ CHANGELOG updated, □ PR description complete, □ CI passing, □ Issues will auto-close on merge
- **Effectiveness**: null
- **First Seen**: 2025-06-06T22:30:06.812Z
- **Last Seen**: 2025-06-06T22:30:06.812Z
- **Frequency**: 1

#### Tag releases after merge (ID: 1b670ade)
- **Description**: After merging PR to main, create and push version tag to trigger NPM publish: git tag vX.Y.Z && git push origin vX.Y.Z
- **Effectiveness**: null
- **First Seen**: 2025-06-06T22:36:19.786Z
- **Last Seen**: 2025-06-06T22:36:19.786Z
- **Frequency**: 1

#### Verify GitHub releases (ID: bb71ad06)
- **Description**: After NPM publish, verify GitHub release was created. If not, create manually with 'gh release create' to keep releases in sync
- **Effectiveness**: null
- **First Seen**: 2025-06-06T22:49:05.527Z
- **Last Seen**: 2025-06-06T22:49:05.527Z
- **Frequency**: 1

#### Check labels before issues (ID: 3e6519bf)
- **Description**: Always verify required labels exist before creating issues. Create missing labels with appropriate colors and descriptions. Standard set: enhancement, bug, documentation, priority:high/medium/low, cli, performance, breaking-change, needs-tests
- **Effectiveness**: null
- **First Seen**: 2025-06-06T22:58:52.499Z
- **Last Seen**: 2025-06-06T22:58:52.499Z
- **Frequency**: 1

#### Manage GitHub release order (ID: 908c36b6)
- **Description**: When creating missing GitHub releases retroactively: 1) Create them with --prerelease flag, 2) After all are created, use 'gh release edit vX.Y.Z --latest' on the actual latest version, 3) Remove prerelease flag from old releases. This prevents GitHub from auto-marking old versions as latest.
- **Effectiveness**: null
- **First Seen**: 2025-06-06T23:02:19.862Z
- **Last Seen**: 2025-06-06T23:02:19.862Z
- **Frequency**: 1

#### Version bump first (ID: 9d7fdb7c)
- **Description**: Always update package.json version at the START of feature development, not at the end. This ensures tests and code reflect the correct version throughout development.
- **Effectiveness**: null
- **First Seen**: 2025-06-06T23:23:40.147Z
- **Last Seen**: 2025-06-06T23:23:40.147Z
- **Frequency**: 1

#### Version-first workflow (ID: ac5701ad)
- **Description**: Always bump version at START of feature development, not after. Prevents test failures and ensures consistency.
- **Effectiveness**: null
- **First Seen**: 2025-06-07T02:12:25.780Z
- **Last Seen**: 2025-06-07T02:12:25.780Z
- **Frequency**: 1

#### GitHub workflow automation caveat (ID: 04977c8e)
- **Description**: GitHub Actions create-release fails if release already exists. When manually creating releases, expect workflow failures. Consider using gh release edit instead.
- **Effectiveness**: null
- **First Seen**: 2025-06-07T02:12:41.499Z
- **Last Seen**: 2025-06-07T02:12:41.499Z
- **Frequency**: 1

#### Pre-push memory update workflow (ID: ae7b12db)
- **Description**: Always update local memory (decisions, knowledge, patterns) BEFORE pushing to GitHub. This ensures CLAUDE.md and context files reflect the latest work in the commit.
- **Effectiveness**: null
- **First Seen**: 2025-06-07T02:17:57.755Z
- **Last Seen**: 2025-06-07T02:17:57.755Z
- **Frequency**: 1

#### Practice what we preach (ID: d0e92101)
- **Description**: Always follow established GitHub workflows, even for documentation changes. Create issues, use feature branches, and PRs - no exceptions!
- **Effectiveness**: null
- **First Seen**: 2025-06-07T02:26:47.100Z
- **Last Seen**: 2025-06-07T02:26:47.100Z
- **Frequency**: 1

#### Clean up merged branches (ID: 7201d3d6)
- **Description**: After PR merge, delete the feature branch to keep repository clean. Either enable auto-delete in GitHub settings or manually delete with 'git push origin --delete branch-name'. Prevents accumulation of stale branches.
- **Effectiveness**: null
- **First Seen**: 2025-06-07T22:44:26.594Z
- **Last Seen**: 2025-06-07T22:44:26.594Z
- **Frequency**: 1

#### Develop branch workflow (ID: 91f2f4a7)
- **Description**: Use develop branch to collect all release changes before merging to main. Create feature branches from develop, PR to develop, then final PR from develop to main for release.
- **Effectiveness**: null
- **First Seen**: 2025-06-08T22:14:48.595Z
- **Last Seen**: 2025-06-08T22:14:48.595Z
- **Frequency**: 1

#### Maintain persistent develop branch (ID: fa0420b6)
- **Description**: Always keep a develop branch as the integration branch for features. All work happens on develop or feature branches, never directly on main. Only merge to main for releases.
- **Effectiveness**: null
- **First Seen**: 2025-06-09T03:10:58.271Z
- **Last Seen**: 2025-06-09T03:10:58.271Z
- **Frequency**: 1

#### JSON Schema Foundation (ID: 20aed3e1)
- **Description**: Create shared JSON schemas before implementing import/export features to ensure consistency
- **Effectiveness**: null
- **First Seen**: 2025-06-14T16:11:27.871Z
- **Last Seen**: 2025-06-14T16:11:27.871Z
- **Frequency**: 1

#### Import/Export Symmetry (ID: 31ad9f32)
- **Description**: Always ensure import and export functionality are symmetrical - what can be exported should be importable
- **Effectiveness**: null
- **First Seen**: 2025-06-14T17:37:13.022Z
- **Last Seen**: 2025-06-14T17:37:13.022Z
- **Frequency**: 1

#### Report Archival (ID: de046baf)
- **Description**: Reports should be easily archivable for historical reference. Auto-save option creates timestamped files in dedicated directory for easy access and comparison over time
- **Effectiveness**: null
- **First Seen**: 2025-06-14T17:44:02.936Z
- **Last Seen**: 2025-06-14T17:44:02.936Z
- **Frequency**: 1

## Resolved Patterns
### v1.9.0 feature completion tracking (ID: d4182676)
- **Solution**: v1.9.0 development completed successfully. All CLI flags implemented, tested, and documented. PR #40 created and ready for merge.
- **Resolved**: 2025-06-09T02:28:12.397Z

### Merged functionality test (ID: a64af0aa)
- **Solution**: Test pattern completed - functionality verified
- **Resolved**: 2025-06-06T23:05:51.088Z

### Test install (ID: d8d6d941)
- **Solution**: Test pattern completed - functionality verified
- **Resolved**: 2025-06-06T23:05:50.998Z

### Subcommand structure test (ID: 2509c06a)
- **Solution**: Fully implemented with all subcommands working
- **Resolved**: 2025-06-04T22:41:14.285Z

### Fix test (ID: d651cb51)
- **Solution**: Test pattern completed - functionality verified
- **Resolved**: 2025-06-06T23:05:50.886Z

### Test parsing 3 (ID: 840141d1)
- **Solution**: Tested and working
- **Resolved**: 2025-06-04T22:11:24.159Z

### Test parsing 2 (ID: ddb2dc82)
- **Solution**: Test pattern completed - functionality verified
- **Resolved**: 2025-06-06T23:05:50.798Z

### Test parsing 1 (ID: 8e5f6fab)
- **Solution**: Test pattern completed - functionality verified
- **Resolved**: 2025-06-06T23:05:50.708Z

### Another test pattern (ID: cea020a8)
- **Solution**: Test pattern no longer needed
- **Resolved**: 2025-06-06T23:05:23.193Z

### malicious (ID: 8113232f)
- **Solution**: Test pattern removed - security testing complete
- **Resolved**: 2025-06-05T00:41:38.500Z

