import { parseAgentDefinition, toMeta } from './agent-definition'
import { writeFileSync, mkdirSync, rmSync } from 'fs'
import { join } from 'path'

const TEST_DIR = join(__dirname, '__test_agents__')

beforeAll(() => {
  mkdirSync(TEST_DIR, { recursive: true })
})

afterAll(() => {
  rmSync(TEST_DIR, { recursive: true, force: true })
})

describe('agent-definition', () => {
  it('should parse a valid agent definition with frontmatter', () => {
    const filePath = join(TEST_DIR, 'test-agent.md')
    writeFileSync(filePath, `---
name: test-agent
description: A test agent
model: openrouter/anthropic/claude-3.5-sonnet
tools: [bash, read, write]
permissions:
  bash: dangerous
  read: safe
---
# Test Agent

You are a test agent.
`)

    const def = parseAgentDefinition(filePath)
    expect(def).not.toBeNull()
    expect(def!.name).toBe('test-agent')
    expect(def!.description).toBe('A test agent')
    expect(def!.model).toBe('openrouter/anthropic/claude-3.5-sonnet')
    expect(def!.tools).toEqual(['bash', 'read', 'write'])
    expect(def!.permissions.bash).toBe('dangerous')
    expect(def!.permissions.read).toBe('safe')
    expect(def!.instruction).toContain('You are a test agent.')
  })

  it('should parse agent without frontmatter (defaults)', () => {
    const filePath = join(TEST_DIR, 'simple.md')
    writeFileSync(filePath, `# Simple Agent

This is a simple agent with no frontmatter.
`)

    const def = parseAgentDefinition(filePath)
    expect(def).not.toBeNull()
    expect(def!.name).toBe('simple')
    expect(def!.description).toBe('Simple Agent')
    expect(def!.model).toBe('openrouter/auto')
    expect(def!.tools).toEqual(['bash', 'read', 'write', 'think'])
  })

  it('should return null for non-existent files', () => {
    const def = parseAgentDefinition('/nonexistent/file.md')
    expect(def).toBeNull()
  })

  it('should convert definition to metadata', () => {
    const filePath = join(TEST_DIR, 'meta-test.md')
    writeFileSync(filePath, `---
name: meta-agent
description: Test metadata conversion
tools: [bash, read]
---
# Meta Agent
`)

    const def = parseAgentDefinition(filePath)!
    const meta = toMeta(def)

    expect(meta.name).toBe('meta-agent')
    expect(meta.description).toBe('Test metadata conversion')
    expect(meta.tools).toEqual(['bash', 'read'])
    expect(meta).not.toHaveProperty('instruction')
    expect(meta).not.toHaveProperty('permissions')
  })

  it('should apply default permissions for unspecified tools', () => {
    const filePath = join(TEST_DIR, 'defaults.md')
    writeFileSync(filePath, `---
name: defaults-agent
tools: [bash, read, write, memory]
---
# Defaults Agent
`)

    const def = parseAgentDefinition(filePath)!
    // bash defaults to dangerous
    expect(def.permissions.bash).toBe('dangerous')
    // read defaults to safe
    expect(def.permissions.read).toBe('safe')
    // memory defaults to safe
    expect(def.permissions.memory).toBe('safe')
  })
})
