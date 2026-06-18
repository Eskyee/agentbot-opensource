```markdown
# agentbot-opensource Development Patterns

> Auto-generated skill from repository analysis

## Overview

This skill teaches you the core development patterns and workflows of the `agentbot-opensource` repository, a TypeScript project built with Next.js. You'll learn about the project's coding conventions, commit practices, dependency update workflow, and testing patterns, enabling you to contribute effectively and maintain consistency across the codebase.

## Coding Conventions

### File Naming

- Use **camelCase** for file names.

  **Example:**
  ```
  userProfile.ts
  chatHandler.test.ts
  ```

### Import Style

- Use **relative imports** for referencing modules within the project.

  **Example:**
  ```typescript
  import { getUser } from './userService';
  import { sendMessage } from '../utils/messageUtils';
  ```

### Export Style

- Prefer **named exports** over default exports.

  **Example:**
  ```typescript
  // Good
  export function startAgent() { ... }
  export const AGENT_VERSION = '1.0.0';

  // Avoid
  // export default function startAgent() { ... }
  ```

### Commit Patterns

- Use **conventional commits**.
- Prefix commits with the type (e.g., `chore:`).
- Keep commit messages concise (average ~59 characters).

  **Example:**
  ```
  chore: update dependencies in web and backend packages
  ```

## Workflows

### Dependency Update Batch

**Trigger:** When dependencies are outdated and need to be updated to newer versions (often detected by bots like Dependabot).

**Command:** `/update-dependencies`

1. **Detect outdated dependencies**  
   Use an automated tool (e.g., Dependabot) or run `npm outdated` to identify packages that need updating.

2. **Update version numbers**  
   Update the relevant `package.json` files in the root and sub-packages:
   - `package.json`
   - `agentbot-backend/package.json`
   - `gateway/package.json`
   - `web/package.json`

3. **Update the lockfile**  
   Run `npm install` or `npm update` to regenerate `package-lock.json` with the new versions.

4. **Commit the changes**  
   Commit all updated files with a summary message listing updated packages.

   **Example commit:**
   ```
   chore: update react and next.js in web and backend
   ```

## Testing Patterns

- **Test file pattern:** Files follow the `*.test.*` naming convention.

  **Example:**
  ```
  userService.test.ts
  chatHandler.test.ts
  ```

- **Testing framework:** Not explicitly detected; check for common frameworks like Jest or Vitest in `devDependencies`.

- **Test example:**
  ```typescript
  // userService.test.ts
  import { getUser } from './userService';

  describe('getUser', () => {
    it('returns user data for a valid ID', () => {
      // test implementation
    });
  });
  ```

## Commands

| Command              | Purpose                                             |
|----------------------|-----------------------------------------------------|
| /update-dependencies | Batch update all outdated dependencies across packages |
```
