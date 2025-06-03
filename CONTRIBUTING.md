# Contributing to Claude Memory

First off, thank you for considering contributing to Claude Memory! It's people like you that make Claude Memory such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible using our bug report template.

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please use our feature request template and include as many details as possible.

### Pull Requests

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes (`npm test`).
5. Make sure your code lints (`npm run lint`).
6. Issue that pull request!

## Development Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/my-new-feature
   # or
   git checkout -b fix/issue-123
   ```

2. **Make your changes**
   - Write clear, concise commit messages
   - Follow the existing code style
   - Add tests for new functionality

3. **Test your changes**
   ```bash
   npm test
   npm run lint
   npm run test:coverage
   ```

4. **Update documentation**
   - Update README.md if needed
   - Update help text in CLI
   - Add JSDoc comments for new functions

5. **Submit a Pull Request**
   - Use the PR template
   - Reference any related issues
   - Ensure CI passes

## Coding Style

- Use 2 spaces for indentation
- Use async/await over promises
- Add JSDoc comments for public methods
- Keep functions focused and small
- Use descriptive variable names

## Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

## Versioning

We use [Semantic Versioning](http://semver.org/):
- MAJOR version for incompatible API changes
- MINOR version for backwards-compatible functionality additions
- PATCH version for backwards-compatible bug fixes

## Questions?

Feel free to open an issue with your question or reach out to the maintainers.

Thank you for contributing! 🎉