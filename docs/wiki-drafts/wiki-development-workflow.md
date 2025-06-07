# Development Workflow

This page documents the complete development workflow for contributing to Claude Memory.

## 📋 Overview

All development follows a structured GitHub-based workflow that ensures quality, traceability, and professional standards.

## 🔄 Complete Development Cycle

### 1. Planning Phase
**Every feature starts with planning:**

```mermaid
graph LR
    A[Idea] --> B[Create Issue]
    B --> C[Assign to Milestone]
    C --> D[Add to Project Board]
    D --> E[Create Feature Branch]
```

1. **Create an Issue**
   - Use appropriate labels (enhancement, bug, documentation)
   - Add priority label (priority:high, priority:medium, priority:low)
   - Provide clear description and acceptance criteria

2. **Assign to Milestone**
   - Current: v1.9.0 for minor features
   - Future: v2.0.0 for major changes
   - Patch releases for urgent fixes

3. **Project Board**
   - Add issue to "Claude Memory Development" project
   - Move through columns: Todo → In Progress → Review → Done

### 2. Development Phase

#### Branch Naming Convention
```bash
feature/issue-XX-brief-description  # For features
fix/issue-XX-brief-description      # For bug fixes
docs/issue-XX-brief-description     # For documentation
chore/issue-XX-brief-description    # For maintenance
```

#### Development Steps
```bash
# 1. Create feature branch
git checkout -b feature/issue-22-dry-run-flag

# 2. Make changes (version-first approach)
# ALWAYS bump version in package.json first!
npm version minor  # or patch

# 3. Test thoroughly
npm test
npm run lint
npm run test:all

# 4. Update memory
cmem decision "Implement dry-run flag" "Safe testing capability" "alternatives"
cmem pattern "Test before commit" "Always run full test suite" 1.0

# 5. Commit with issue reference
git add .
git commit -m "feat: implement --dry-run flag for safe testing

- Add global --dry-run flag
- Prevent file system changes when enabled
- Show clear DRY RUN indicator
- Add comprehensive tests

Fixes #22

Co-Authored-By: Rob White <robwhite4@yahoo.com>"
```

### 3. Pull Request Phase

#### PR Checklist
- [ ] Tests pass locally
- [ ] Linting passes
- [ ] Version bumped appropriately
- [ ] CHANGELOG.md updated
- [ ] Memory updated (decisions, patterns)
- [ ] Issue referenced in commit
- [ ] Documentation updated

#### Creating the PR
```bash
git push origin feature/issue-22-dry-run-flag
gh pr create --title "feat: implement --dry-run flag" \
  --body "Fixes #22" \
  --milestone "v1.9.0"
```

### 4. Review and Merge

1. **Automated Checks**
   - CI/CD runs tests
   - Linting verification
   - Build validation

2. **Code Review**
   - Implementation quality
   - Test coverage
   - Documentation completeness

3. **Merge**
   - Squash and merge for clean history
   - Branch automatically deleted
   - Issue automatically closed

### 5. Release Phase

#### For Features (Minor/Major)
```bash
# After merging to main
git checkout main
git pull origin main

# Tag for release
git tag -a v1.9.0 -m "Version 1.9.0: Priority 2 CLI Flags"
git push origin v1.9.0

# Automated release process handles:
# - NPM publishing
# - GitHub release creation
# - Changelog generation
```

#### For Patches
```bash
# Quick fixes can be released immediately
npm version patch
git push origin main
git push origin --tags
```

## 🛠️ Key Patterns

### Version-First Development
ALWAYS bump the version in package.json BEFORE implementing features. This ensures:
- Tests reflect correct version
- --version flag shows accurate info
- No post-merge version fixes needed

### Memory-First Documentation
Update Claude Memory (decisions, patterns, knowledge) BEFORE pushing:
```bash
cmem decision "why" "reasoning" "alternatives"
cmem knowledge add "key" "value" --category category
cmem pattern "pattern" "description" effectiveness
```

### Commit Message Format
```
type: brief description

- Detailed change 1
- Detailed change 2
- Impact or reasoning

Fixes #XX

Co-Authored-By: Rob White <robwhite4@yahoo.com>
```

Types: feat, fix, docs, style, refactor, test, chore

## 🚫 What NOT to Do

1. **Never commit directly to main** (except hotfixes)
2. **Never merge without tests passing**
3. **Never skip version bumping**
4. **Never forget co-author attribution**
5. **Never merge with failing CI**

## 📝 Example Workflow

Here's a complete example for implementing a new feature:

```bash
# 1. Start with an issue (#30: Add --json flag)
gh issue create --title "Add --json flag for JSON output"

# 2. Create branch
git checkout -b feature/issue-30-json-flag

# 3. Bump version first
npm version minor  # 1.9.0 -> 1.10.0

# 4. Implement feature
# ... code changes ...

# 5. Test everything
npm test && npm run lint

# 6. Update memory
cmem decision "Add JSON output" "Machine-readable output needed" "XML,CSV"

# 7. Commit
git add .
git commit -m "feat: add --json flag for structured output

- Global --json flag forces JSON output
- Works with stats, search, and export commands  
- Includes comprehensive tests
- Updates documentation

Fixes #30

Co-Authored-By: Rob White <robwhite4@yahoo.com>"

# 8. Push and create PR
git push origin feature/issue-30-json-flag
gh pr create

# 9. After approval and CI passes, merge
# 10. Create release if needed
```

## 🔗 Related Pages

- [[Release Process]]
- [[Testing Guidelines]]
- [[Contributing Guidelines]]
- [[Architecture Overview]]

---

*Last updated: June 2025*