```markdown
# agentbot-opensource Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches the core development conventions and workflows for contributing to the `agentbot-opensource` repository. The project is written in TypeScript and uses the Hono framework for building web applications. It follows consistent coding standards, commit patterns, and test file organization to ensure code quality and maintainability.

## Coding Conventions

### File Naming
- Use **camelCase** for file names.
  - Example: `userSession.ts`, `messageHandler.ts`

### Import Style
- Use **relative imports** for internal modules.
  - Example:
    ```typescript
    import { getUser } from './userService';
    ```

### Export Style
- Use **named exports** for all modules.
  - Example:
    ```typescript
    // userService.ts
    export function getUser(id: string) { ... }
    export function createUser(data: UserData) { ... }
    ```

### Commit Patterns
- Follow **conventional commits** with a `build` prefix for build-related changes.
  - Example:
    ```
    build: update dependencies to latest versions
    ```
- Commit messages are concise, averaging around 78 characters.

## Workflows

### Code Contribution
**Trigger:** When adding new features, fixing bugs, or updating code.
**Command:** `/contribute`

1. Create a new branch from `main`.
2. Write code following the coding conventions above.
3. Add or update tests as needed (see Testing Patterns).
4. Commit changes using the conventional commit format.
5. Push your branch and open a pull request.

### Dependency Management
**Trigger:** When dependencies need to be updated or added.
**Command:** `/update-deps`

1. Run the package manager to install or update dependencies.
   ```bash
   npm install [package-name]
   ```
2. Commit the changes with a `build` prefix.
   ```
   build: add [package-name] for [purpose]
   ```
3. Push and create a pull request if necessary.

## Testing Patterns

- Test files use the pattern `*.test.*` (e.g., `userService.test.ts`).
- The testing framework is **unknown**; check existing test files for framework-specific syntax.
- Place tests alongside the modules they test or in a dedicated `tests` directory.
- Example test file name:
  ```
  messageHandler.test.ts
  ```

## Commands
| Command         | Purpose                                           |
|-----------------|---------------------------------------------------|
| /contribute     | Start the code contribution workflow              |
| /update-deps    | Update or add dependencies                        |
```
