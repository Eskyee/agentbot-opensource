/**
 * Agents Module — Agent Definitions & CRUD
 *
 * Exports:
 * - parseAgentDefinition: Parse .md file with YAML frontmatter
 * - loadAgentDefinitions: Load all agents from a directory
 * - loadAllAgents: Load from system + user + project dirs
 * - toMeta: Convert definition to lightweight metadata
 * - AgentDefinition: Full agent definition type
 * - AgentDefinitionMeta: Lightweight listing type
 */

export {
  parseAgentDefinition,
  loadAgentDefinitions,
  loadAllAgents,
  toMeta,
  type AgentDefinition,
  type AgentDefinitionMeta,
} from './agent-definition'
