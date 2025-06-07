# Claude Memory .gitignore Templates

Choose the template that matches your workflow:

## Solo Developer (Single Machine)

```gitignore
# Claude Memory - Exclude all generated files
.claude/
```

## Solo Developer (Multiple Machines)

```gitignore
# Claude Memory - Keep context, exclude personal config
.claude/sessions/
.claude/backups/
.claude/memory.json
.claude/config.json
.claude/settings.local.json

# Include context for multi-machine sync
!.claude/context/
```

## Small Team (Shared Memory)

```gitignore
# Claude Memory - Share team knowledge
.claude/sessions/
.claude/backups/
.claude/memory.json
.claude/config.json
.claude/settings.local.json
.claude/personal/

# Include shared context
!.claude/context/
```

## Large Team (Memory Keeper Model)

```gitignore
# Claude Memory - Only memory keeper commits
.claude/

# Individual developers track their own memory locally
# Memory keeper periodically updates project memory
```

## Hybrid Team (Shared + Personal)

```gitignore
# Claude Memory
.claude/sessions/
.claude/backups/
.claude/memory.json
.claude/config.json
.claude/personal/

# Include team context
!.claude/context/team/

# Personal context stays local
.claude/context/personal/
```

## Open Source Project

```gitignore
# Claude Memory - Only maintain CLAUDE.md
.claude/

# Contributors use their own local memory
# Maintainers update CLAUDE.md for releases
```

## Notes

- Always commit `CLAUDE.md` - it's the primary AI context file
- The `.claude/memory.json` contains raw data and should never be committed
- Config files (`.claude/config.json`) contain personal preferences
- Backup directories can grow large and should stay local
- Consider your team's workflow when choosing a strategy