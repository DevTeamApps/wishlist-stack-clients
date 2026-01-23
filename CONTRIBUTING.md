# Contributing to wjs-client

Thank you for your interest in contributing to wjs-client! This document outlines the development workflow, release process, and code standards for this monorepo.

## Table of Contents

- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Changesets Workflow](#changesets-workflow)
- [Release Process](#release-process)
- [Code Standards](#code-standards)

## Development Setup

### Prerequisites

- Node.js 18+
- npm 8.5+ (for workspace protocol support)

### Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/YOUR_ORG/wjs-client.git
   cd wjs-client
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Build all packages:

   ```bash
   npm run build
   ```

4. Run tests:

   ```bash
   npm test
   ```

### Package Structure

This is a monorepo containing two packages:

| Package | Path | Description |
|---------|------|-------------|
| `@devteam-sdg/wjs-client` | `packages/client` | Core TypeScript SDK for the Wishlist JS API |
| `@devteam-sdg/wjs-hydrogen` | `packages/hydrogen` | Hydrogen/React Router integration |

## Making Changes

### Branch Naming

Use descriptive branch names:

- `feat/add-bulk-operations` - New features
- `fix/query-edge-case` - Bug fixes
- `docs/update-readme` - Documentation changes
- `refactor/simplify-client` - Code refactoring

### Development Workflow

1. Create a feature branch from `main`:

   ```bash
   git checkout main
   git pull origin main
   git checkout -b feat/your-feature
   ```

2. Make your changes and ensure quality:

   ```bash
   npm run typecheck    # Check TypeScript types
   npm test             # Run tests
   npm run build        # Verify build works
   ```

3. Commit your changes with a descriptive message.

4. **Add a changeset** (see [Changesets Workflow](#changesets-workflow) below).

5. Push and open a pull request to `main`.

## Changesets Workflow

We use [Changesets](https://github.com/changesets/changesets) to manage versions and changelogs. This ensures every change is documented and releases are controlled.

### What is a Changeset?

A changeset is a small markdown file that describes:

- Which packages are affected
- What type of version bump is needed (patch/minor/major)
- A summary of the change (appears in the changelog)

### Adding a Changeset

After making your code changes, run:

```bash
npx changeset
```

You'll be prompted to:

1. **Select affected packages** - Choose which packages your change impacts
2. **Choose bump type** - Select patch, minor, or major for each package
3. **Write a summary** - Describe what changed (this goes in the changelog)

This creates a file in `.changeset/` like `warm-pandas-dance.md`:

```markdown
---
"@devteam-sdg/wjs-client": patch
---

Fixed edge case in query builder when filters are empty
```

**Commit this file with your PR.**

### When to Use Each Bump Type

| Type | When to Use | Example |
|------|-------------|---------|
| `patch` | Bug fixes, small improvements | Fix typo, handle edge case |
| `minor` | New features (backwards compatible) | Add new method, new option |
| `major` | Breaking changes | Remove method, change API signature |

### What If I Forget to Add a Changeset?

CI will remind you if your PR changes code but has no changeset. Simply run `npx changeset` and push the new file.

### Changes That Don't Need Changesets

Some changes don't need changesets:

- Documentation-only changes (README, comments)
- Test-only changes
- CI/tooling changes
- Changes to files outside `packages/`

For these, you can create an empty changeset:

```bash
npx changeset --empty
```

## Release Process

Releases are managed through a bot-created "Version Packages" PR.

### How It Works

```
┌─────────────────────────────────────────────────────────────────────┐
│  1. Your PRs merge to main (with changeset files)                   │
│                                                                     │
│  2. Changeset files accumulate in .changeset/ folder                │
│                                                                     │
│  3. Bot automatically creates/updates a "Version Packages" PR       │
│     - Bumps package versions                                        │
│     - Updates CHANGELOG.md files                                    │
│     - Removes consumed changeset files                              │
│                                                                     │
│  4. When ready to release, merge the "Version Packages" PR          │
│                                                                     │
│  5. Packages are automatically published to npm                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Versioning Strategy

This repo uses **fixed versioning** - all packages share the same version number. When any package changes, all packages are bumped to the same version.

### The "Version Packages" PR

After your PR merges, if it contained changesets, a bot will create (or update) a PR titled "Version Packages". This PR:

- Shows exactly what will be released
- Contains the updated changelogs
- Lets you review before publishing

**You don't need to merge this immediately.** You can let changes accumulate over days or weeks. The bot keeps updating the PR with each new changeset that lands on `main`.

### Triggering a Release

When you're ready to release:

1. Review the "Version Packages" PR
2. Ensure CI passes
3. Merge the PR
4. The release workflow automatically publishes to npm

## Code Standards

### TypeScript

- All code must pass `npm run typecheck`
- Use explicit types for function parameters and return values
- Prefer interfaces over type aliases for object shapes

### Testing

- Write tests for new features and bug fixes
- Run `npm test` before pushing
- Tests use Vitest - see existing tests for patterns

### Linting & Formatting

- Keep imports organized
- Use consistent naming conventions
- Follow existing code patterns in the codebase

### Commit Messages

Use clear, descriptive commit messages:

```
feat: add bulk delete operation to lists API
fix: handle empty response in query builder
docs: update installation instructions
refactor: simplify error handling in client
```

## Questions?

If you have questions about the contribution process, feel free to open an issue for discussion.
