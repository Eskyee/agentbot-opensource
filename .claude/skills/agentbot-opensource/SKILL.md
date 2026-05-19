```markdown
# agentbot-opensource Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches you the development patterns and workflows used in the `agentbot-opensource` repository, a TypeScript project built on the Hono framework. You'll learn about the project's coding conventions, how dependencies are managed across a monorepo, and how to write and organize tests.

## Coding Conventions

### File Naming
- Use **camelCase** for file names.
  - Example: `userService.ts`, `messageRouter.ts`

### Import Style
- Use **relative imports** for internal modules.
  - Example:
    ```typescript
    import { getUser } from './userService';
    ```

### Export Style
- Use **named exports**.
  - Example:
    ```typescript
    // userService.ts
    export function getUser(id: string) { ... }
    ```

### Commit Patterns
- Commit messages are **freeform** (no enforced prefixes).
- Typical length: ~46 characters.

## Workflows

### Dependency Update Across Monorepo

**Trigger:** When dependencies need to be updated to newer versions for security, bugfixes, or feature reasons.

**Command:** `/update-dependencies`

1. An automated tool (e.g., Dependabot) detects outdated dependencies.
2. The tool updates version numbers in all relevant `package.json` files:
    - `package.json` (root)
    - `agentbot-backend/package.json`
    - `gateway/package.json`
    - `web/package.json`
3. The tool updates `package-lock.json` to reflect the new dependency tree.
4. A commit is created summarizing all updated packages.

**Example Workflow:**
```bash
# Automated tool runs (or trigger manually with /update-dependencies)
# Updates detected in package.json files
# package-lock.json is regenerated
# Commit message: "chore: update dependencies in backend, gateway, web"
```

## Testing Patterns

- **Test files** use the pattern: `*.test.*`
  - Example: `userService.test.ts`
- **Testing framework** is not specified in the repository.
- Place test files alongside the code they test or in a dedicated test directory.

**Example Test File:**
```typescript
// userService.test.ts
import { getUser } from './userService';

test('should fetch user by id', () => {
  const user = getUser('123');
  expect(user.id).toBe('123');
});
```

## Commands

| Command               | Purpose                                                        |
|-----------------------|----------------------------------------------------------------|
| /update-dependencies  | Updates dependencies across all package.json files in the monorepo |

```