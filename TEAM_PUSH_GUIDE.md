# Team Push Guide

This guide outlines the Git workflow for the Appointly project.

## Branch Naming Convention

- `main` - Production-ready code
- `feature/[name]-[task]` - Feature branches
- `fix/[name]-[issue]` - Bug fixes
- `docs/[name]-[topic]` - Documentation updates

## Workflow Steps

### 1. Create Feature Branch
```bash
git checkout -b feature/your-name-task
```

### 2. Make Changes
- Work on your assigned files
- Test your changes locally
- Run linting: `bun run lint`

### 3. Commit Changes
```bash
git add .
git commit -m "feat: [description of changes]"
```

### 4. Push Branch
```bash
git push -u origin feature/your-name-task
```

### 5. Create Pull Request
- Go to GitHub repository
- Click "New Pull Request"
- Select your branch as source
- Add description and reviewers
- Create PR

### 6. Code Review
- Address review comments
- Make additional commits if needed
- Get approval from teammates

### 7. Merge
- Use "Squash and merge" for clean history
- Delete branch after merge

## Commit Message Format

```
type: description

[optional body]
```

Types:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Testing
- `chore:` - Maintenance

## File Ownership

- **Atharv:** Frontend files (`src/components/`, `src/routes/`, `src/lib/`)
- **Vedant:** Configuration files (`package.json`, `*.config.*`, `wrangler.jsonc`, docs)
- **[Teammate 3]:** Backend files (`src/server/`)

## Pull Request Checklist

- [ ] Code follows project conventions
- [ ] Linting passes
- [ ] TypeScript compiles
- [ ] Tests pass (if applicable)
- [ ] Documentation updated
- [ ] No sensitive data committed
- [ ] Branch is up to date with main

## Conflict Resolution

If you encounter merge conflicts:

1. Pull latest changes: `git pull origin main`
2. Resolve conflicts in your editor
3. Test the resolution
4. Commit: `git commit -m "fix: resolve merge conflicts"`

## Getting Help

- Check existing issues/PRs
- Ask in team chat
- Review project documentation