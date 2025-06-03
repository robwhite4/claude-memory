# Release Process

This document outlines the release process for claude-memory.

## Prerequisites

1. Ensure you have publish rights to the NPM package
2. Set up NPM_TOKEN as a GitHub secret (for automated releases)
3. All tests must pass
4. Update CHANGELOG.md with release notes

## Manual Release Process

1. **Update version and changelog:**
   ```bash
   # Update CHANGELOG.md with release notes
   # Move items from [Unreleased] to new version section
   ```

2. **Bump version:**
   ```bash
   # For patch release (bug fixes)
   npm version patch
   
   # For minor release (new features)
   npm version minor
   
   # For major release (breaking changes)
   npm version major
   ```

3. **Push with tags:**
   ```bash
   git push origin main
   git push origin --tags
   ```

4. **The automated workflow will:**
   - Run all tests
   - Run linting
   - Publish to NPM
   - Create GitHub release

## Automated Release (Recommended)

Simply push a tag and the GitHub Action will handle everything:

```bash
# After merging PR to main
git checkout main
git pull

# Update CHANGELOG.md first!
git add CHANGELOG.md
git commit -m "Update changelog for v1.1.3"

# Create version tag
npm version patch -m "Release v%s"

# Push to trigger release
git push origin main --follow-tags
```

## Version Guidelines

### Patch Release (x.x.X)
- Bug fixes
- Documentation updates
- Performance improvements
- Small non-breaking improvements

### Minor Release (x.X.0)
- New features
- New commands
- Significant non-breaking improvements

### Major Release (X.0.0)
- Breaking API changes
- Removal of features
- Major architectural changes

## Pre-release Checklist

- [ ] All tests pass locally (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Coverage is acceptable (`npm run test:coverage`)
- [ ] CHANGELOG.md is updated
- [ ] Documentation is updated if needed
- [ ] No console.log statements in code
- [ ] Version number is correct in package.json

## Post-release Checklist

- [ ] GitHub release is created
- [ ] NPM package is published
- [ ] Verify installation works: `npm install -g claude-memory@latest`
- [ ] Test basic functionality
- [ ] Announce in relevant channels if major release