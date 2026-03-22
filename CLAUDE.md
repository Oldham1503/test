# CLAUDE.md

This file provides guidance to AI assistants (Claude and others) working with this repository.

## Repository Status

This is a freshly initialized repository with no committed code yet. This CLAUDE.md was created as the first commit to establish conventions before development begins.

When the codebase grows, update this file to reflect the actual project structure, tooling, and conventions.

---

## Git Workflow

### Branch Naming

- Feature branches: `feature/<short-description>`
- Bug fixes: `fix/<short-description>`
- Chores / maintenance: `chore/<short-description>`
- AI-generated branches: `claude/<task-description>-<session-id>`

### Commit Messages

Use concise, imperative-mood commit messages:

```
Add user authentication flow
Fix null pointer in payment handler
Refactor database connection pool
```

- First line: 50 characters or fewer
- Leave a blank line before the body if extended explanation is needed
- Reference issues with `Closes #123` or `Fixes #456` in the body

### Push Conventions

Always set upstream on first push:

```bash
git push -u origin <branch-name>
```

Never force-push to `main` or `master`. Use `--force-with-lease` only when necessary on feature branches.

---

## Development Principles

### General

- Keep changes minimal and focused — do not refactor surrounding code unless asked.
- Prefer editing existing files over creating new ones.
- Do not add comments, docstrings, or type annotations to code that was not changed.
- Do not add error handling for scenarios that cannot realistically occur.

### Code Style

Follow the conventions already present in any file being edited. If no conventions are established yet, default to the idiomatic style for the language in use:

- **JavaScript / TypeScript**: 2-space indentation, single quotes, semicolons optional (be consistent).
- **Python**: PEP 8, 4-space indentation.
- **Go**: `gofmt` formatting, no exceptions.
- **Rust**: `rustfmt` formatting, no exceptions.

### Security

- Never commit secrets, tokens, API keys, or passwords.
- Validate all user-provided input at system boundaries.
- Avoid command injection, SQL injection, XSS, and other OWASP Top 10 vulnerabilities.
- Use environment variables for configuration; provide a `.env.example` with placeholder values.

### Testing

- Write tests for all new behavior unless the task explicitly says not to.
- Do not delete or weaken existing tests.
- Tests should be deterministic (no flakiness from time, randomness, or network).

---

## AI Assistant Conventions

When an AI assistant (Claude or similar) works in this repository:

1. **Read before editing.** Always read a file before modifying it.
2. **Stay in scope.** Only change what was asked. Do not touch unrelated files.
3. **Ask when blocked.** Do not brute-force or loop on a failing approach. Surface blockers to the user.
4. **Confirm before destructive actions.** Deleting files, dropping data, force-pushing — always confirm first.
5. **Do not guess URLs.** Never fabricate external URLs unless you are certain they are correct.
6. **Commit clearly.** Commit messages should explain *why*, not just *what*.
7. **Push to the right branch.** Verify the target branch before pushing. Never push to `main`/`master` without explicit instruction.

---

## Project Structure (To Be Updated)

Once the project is populated, document the layout here. Example:

```
/
├── src/           # Application source code
├── tests/         # Test suites
├── docs/          # Documentation
├── scripts/       # Build and utility scripts
├── .github/       # GitHub Actions workflows
└── CLAUDE.md      # This file
```

---

## Running Common Tasks (To Be Updated)

Once tooling is in place, document commands here. Example placeholders:

```bash
# Install dependencies
<install command>

# Run tests
<test command>

# Lint / format
<lint command>

# Build
<build command>

# Start dev server
<dev command>
```

---

## Updating This File

Update CLAUDE.md whenever:

- The project structure changes significantly.
- New tooling or CI/CD is added.
- Team conventions are established or revised.
- A new language, framework, or major dependency is introduced.
