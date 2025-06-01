# Security Policy

## Supported Versions

We actively support the following versions of claude-memory:

| Version | Supported          |
| ------- | ------------------ |
| 1.1.x   | :white_check_mark: |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability within claude-memory, please send an email to robwhite4@yahoo.com. All security vulnerabilities will be promptly addressed.

**Please do not report security issues through public GitHub issues.**

## Security Measures

- All user data is stored locally in `.claude/` directory
- No data is transmitted to external servers
- Memory files follow secure file permissions
- Input validation on all CLI commands
- Regular security audits via `npm audit`

## Data Privacy

claude-memory:
- Stores all data locally on your machine
- Never transmits data to external services
- Respects `.gitignore` patterns for privacy
- Allows granular control over what gets committed to git

## Best Practices

1. Keep claude-memory updated to the latest version
2. Review `.gitignore` settings for your privacy needs
3. Use proper file permissions on `.claude/` directory
4. Regularly backup your memory data
5. Avoid storing sensitive information in memory descriptions