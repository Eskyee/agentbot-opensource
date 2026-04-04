---
name: hashline
description: >
  Use this skill when editing files programmatically to prevent stale-line errors.
  ALWAYS use hashline when modifying existing code files via the API or when
  writing code that edits other code. This prevents corruption when files change
  between read and edit operations.
  
  Key triggers:
  - "edit this file"
  - "modify the code"
  - "update line X"
  - Any file editing operation
---

# Hashline — Content-Addressed File Editing

The hashline system prevents stale-line errors by using content hashes instead of fragile line numbers. When a file changes between when you read it and when you edit it, the hash won't match and the edit is rejected before corruption occurs.

## Why Use Hashline?

**Without hashline (fragile):**
```
1. Read file → see "const x = 5" on line 15
2. File changes (someone adds a line)
3. Edit line 15 → overwrites wrong content!
```

**With hashline (safe):**
```
1. Read file with hashes → see "15#B7| const x = 5"
2. File changes (hash at line 15 is now different)
3. Try edit with hash "B7" → ERROR: Hash not found!
4. Re-read file, get new hash, apply edit safely
```

## Quick Start

### Reading a File with Hashes

```bash
# Via API
curl "/api/hashline?path=web/app/lib/example.ts"

# Response:
{
  "path": "web/app/lib/example.ts",
  "stats": {
    "totalLines": 42,
    "blankLines": 5,
    "uniqueHashes": 38,
    "hashCollisions": 0
  },
  "lines": [
    { "lineNumber": 1, "hash": "A1", "content": "import { x } from 'y'", "isBlank": false },
    { "lineNumber": 2, "hash": "B2", "content": "", "isBlank": true },
    { "lineNumber": 3, "hash": "C3", "content": "export function foo() {", "isBlank": false }
  ],
  "formatted": "   1#A1| import { x } from 'y'\n   2#B2| \n   3#C3| export function foo() {"
}
```

**Display Format:** `lineNumber#hash| content`
- Line 1: `1#A1| import { x } from 'y'`
- Line 2: `2#B2|` (blank line)
- Line 3: `3#C3| export function foo() {`

### Applying an Edit

```bash
# Single edit
curl -X POST /api/hashline \
  -H "Content-Type: application/json" \
  -d '{
    "path": "web/app/lib/example.ts",
    "hashRef": "3#C3",
    "newContent": "export function bar() {",
    "backup": true
  }'

# Batch edits (applied atomically)
curl -X POST /api/hashline \
  -H "Content-Type: application/json" \
  -d '{
    "path": "web/app/lib/example.ts",
    "edits": [
      { "hashRef": "1#A1", "newContent": "import { z } from 'y'" },
      { "hashRef": "3#C3", "newContent": "export function bar() {" }
    ],
    "backup": true
  }'
```

## TypeScript API

### Basic Usage

```typescript
import {
  readWithHashes,
  formatWithHashes,
  applyEdit,
  applyEdits,
  getFileStats
} from '@/app/lib/hashline'

// Read file
const lines = readWithHashes('/path/to/file.ts')

// Display to AI
console.log(formatWithHashes(lines))
// Output:
//    1#A1| import { x } from 'y'
//    2#B2|
//    3#C3| export function foo() {

// Apply edit by hash
const result = applyEdit('/path/to/file.ts', '3#C3', 'export function bar() {')
if (result.success) {
  console.log(`Edited line ${result.lineNumber}`)
} else {
  console.error(`Failed: ${result.error}`)
}
```

### Handling Stale Line Errors

```typescript
import { applyEdit, readWithHashes, StaleLineError } from '@/app/lib/hashline'

function safeEdit(filePath: string, targetHash: string, newContent: string) {
  try {
    return applyEdit(filePath, targetHash, newContent)
  } catch (error) {
    if (error instanceof StaleLineError) {
      // File changed - re-read and retry with new hash
      const lines = readWithHashes(filePath)
      // Find the line by content similarity
      const targetContent = 'export function foo()'
      const similar = findSimilarLines(lines, targetContent)
      
      if (similar.length > 0) {
        // Retry with new hash
        const newHash = `${similar[0].lineNumber}#${similar[0].hash}`
        return applyEdit(filePath, newHash, newContent)
      }
    }
    throw error
  }
}
```

### Batch Edits

```typescript
import { applyEdits } from '@/app/lib/hashline'

const results = applyEdits(
  '/path/to/file.ts',
  [
    { hashRef: '1#A1', newContent: "import { z } from 'y'" },
    { hashRef: '3#C3', newContent: 'export function bar() {' },
    { hashRef: '5#E5', newContent: '  return 42' }
  ],
  { backup: true }
)

// All edits are validated first, then applied atomically
// If any edit fails validation, none are applied
```

## Hash Reference Formats

You can reference lines in multiple ways:

| Format | Example | Use Case |
|--------|---------|----------|
| Line + Hash | `3#C3` | **Recommended** - Disambiguates collisions |
| Hash only | `#C3` | Simple cases, no collisions |
| Line only | (not supported) | Too fragile, not allowed |

**Always use `lineNumber#hash` format when possible** — it's the most robust.

## Error Handling

### StaleLineError

Occurs when the file has changed since you read it:

```typescript
{
  "error": "Hash C3 not found in /path/to/file.ts. File may have changed.",
  "suggestion": "Similar lines found:",
  "similarLines": [
    { "lineNumber": 3, "hash": "D4", "content": "export function foo() {" },
    { "lineNumber": 5, "hash": "E5", "content": "export function bar() {" }
  ]
}
```

**Resolution:** Re-read the file and use the new hash.

### HashCollisionError

Occurs when multiple lines have the same hash (rare with short hash length):

```typescript
{
  "error": "Hash collision detected: A1 matches 2 lines"
}
```

**Resolution:** Use `lineNumber#hash` format to disambiguate.

## Best Practices

### 1. Always Read Before Editing

```typescript
// ❌ Bad: Using hardcoded line numbers
editFile('example.ts', 15, 'new content')

// ✅ Good: Read, get hash, edit
const lines = readWithHashes('example.ts')
const target = lines.find(l => l.content.includes('function foo'))
applyEdit('example.ts', `${target.lineNumber}#${target.hash}`, 'new content')
```

### 2. Handle Stale Line Errors Gracefully

```typescript
// ✅ Good: Retry with updated hash
try {
  applyEdit(file, hashRef, content)
} catch (e) {
  if (e instanceof StaleLineError) {
    // Re-read and find by content similarity
    const lines = readWithHashes(file)
    const similar = findSimilarLines(lines, oldContent)
    if (similar[0]) {
      applyEdit(file, `${similar[0].lineNumber}#${similar[0].hash}`, content)
    }
  }
}
```

### 3. Use Batch Edits for Multiple Changes

```typescript
// ✅ Good: Atomic batch edit
applyEdits(file, [
  { hashRef: '1#A1', newContent: '...' },
  { hashRef: '2#B2', newContent: '...' },
  { hashRef: '3#C3', newContent: '...' }
])

// ❌ Bad: Sequential individual edits
applyEdit(file, '1#A1', '...')  // Changes line numbers!
applyEdit(file, '2#B2', '...')  // Wrong line now!
applyEdit(file, '3#C3', '...')  // Wrong line now!
```

### 4. Enable Backups for Safety

```typescript
// ✅ Good: Backup created automatically
applyEdit(file, hashRef, content, { backup: true })
// Creates: file.ts.backup.1699123456789

// Cleanup when done
fs.unlinkSync('file.ts.backup.1699123456789')
```

## CLI Usage

```bash
# Read file with hashes (formatted for terminal)
curl "/api/hashline?path=web/app/lib/example.ts&format=cli"

# Output:
// web/app/lib/example.ts (42 lines, 38 unique hashes)
   1#A1| import { x } from 'y'
   2#B2|
   3#C3| export function foo() {
```

## Integration with Skills

When creating skills that edit files, import and use hashline:

```typescript
// skills/my-skill/SKILL.md
## Editing Files

When modifying code files, use the hashline system:

```typescript
import { readWithHashes, applyEdit } from '@/app/lib/hashline'

export async function modifyFile(filePath: string) {
  // 1. Read with hashes
  const lines = readWithHashes(filePath)
  
  // 2. Find the line to edit
  const target = lines.find(l => l.content.includes('TODO: implement'))
  if (!target) throw new Error('Target not found')
  
  // 3. Apply edit with hash reference
  const result = applyEdit(
    filePath,
    `${target.lineNumber}#${target.hash}`,
    '// Implementation complete'
  )
  
  return result
}
```
```

## Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| "Hash not found" | File changed between read and edit | Re-read file, get new hash |
| "Hash collision" | Two lines have same content | Use `lineNumber#hash` format |
| Edit applied to wrong line | Used hash only, collision occurred | Always include line number |
| Backup files accumulating | Backups not cleaned up | Periodically delete `.backup.*` files |

## See Also

- `/api/hashline` — REST API endpoint
- `/web/app/lib/hashline/index.ts` — Implementation
- `/web/app/api/hashline/route.ts` — API route handler
