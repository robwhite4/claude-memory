# Development Workflow

## 🚀 Automated Release Process

This project uses GitHub Actions for fully automated releases to prevent version sync issues.

### Release Workflow

1. **Development Phase**
   ```bash
   # Create feature branch
   git checkout -b feature/your-feature
   
   # Make changes and test locally
   npm test
   npm run lint
   
   # Commit and push
   git add .
   git commit -m "feat: your feature"
   git push origin feature/your-feature
   ```

2. **Create Pull Request**
   - Open PR to main branch
   - Pre-release checks run automatically
   - Wait for all checks to pass

3. **Trigger Release** (Maintainers only)
   - Go to Actions → Release Process
   - Click "Run workflow"
   - Select version type (patch/minor/major)
   - Workflow will:
     - Run all tests
     - Bump version
     - Update CHANGELOG
     - Create git tag
     - Publish to NPM
     - Create GitHub release

### Monitoring Release Progress

For AI assistants helping with releases:

```bash
# Check workflow status
gh run list --workflow=release-process.yml --limit 1

# Watch workflow progress
gh run watch <run-id>

# Check if NPM publish succeeded
npm view claude-memory version

# Verify GitHub release
gh release list --limit 1
```

### Pre-Release Checklist

Before triggering a release:

- [ ] All tests pass locally: `npm test && npm run test:enhanced`
- [ ] Linting passes: `npm run lint`
- [ ] CHANGELOG.md has unreleased changes documented
- [ ] No security vulnerabilities: `npm audit`
- [ ] Version bump makes sense (patch/minor/major)

### Version Guidelines

- **Patch** (x.x.X): Bug fixes, documentation
- **Minor** (x.X.0): New features, backwards compatible
- **Major** (X.0.0): Breaking changes

### Troubleshooting

**If release fails:**

1. Check workflow logs: `gh run view <run-id> --log-failed`
2. Fix issues and push to main
3. Re-run workflow from Actions tab

**If NPM publish fails but tag exists:**

1. Delete the tag: `git push --delete origin v<version>`
2. Fix the issue
3. Re-run the release workflow

### Environment Setup

Required secrets in GitHub:
- `NPM_TOKEN`: NPM automation token with publish rights
- `GITHUB_TOKEN`: Automatically provided by GitHub

### Manual Release (Emergency Only)

If automation fails completely:

```bash
# Ensure everything passes
npm test && npm run lint

# Bump version
npm version patch -m "Release v%s"

# Publish
npm publish

# Push changes
git push origin main --follow-tags
```

## Development Commands

```bash
# Run tests
npm test                  # Basic tests
npm run test:enhanced     # Enhanced feature tests
npm run test:all         # All tests
npm run test:coverage    # With coverage report

# Code quality
npm run lint             # Check linting
npm run lint:fix         # Auto-fix issues

# Local testing
npm link                 # Install locally for testing
npm unlink              # Remove local install
```

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Open PR with description
5. Wait for automated checks
6. Maintainer triggers release

## Release Notes Format

In CHANGELOG.md:

```markdown
## [Unreleased]

### Added
- New feature description

### Changed
- What was modified

### Fixed
- Bug fixes

### Deprecated
- Features being phased out

### Removed
- Deleted features

### Security
- Security fixes
```