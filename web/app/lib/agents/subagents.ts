import { SubAgentConfig, SubAgentType } from './types';

export const SUB_AGENT_CONFIGS: Record<SubAgentType, SubAgentConfig> = {
  coding: {
    type: 'coding',
    name: 'Code Agent',
    description:
      'Writes, reviews, and debugs code. Handles file operations, refactoring, and code generation.',
    model: 'anthropic/claude-sonnet-4',
    fallbackModel: 'openai/gpt-4o',
    systemPrompt: `You are a coding agent for Agentbot. You write clean, production-ready code.

Rules:
- Write TypeScript/JavaScript code
- Follow existing code patterns in the project
- Use proper error handling
- Add types where possible
- Keep functions small and focused
- Test edge cases

When writing code:
1. Understand the request
2. Check existing code for patterns
3. Write the code
4. Explain what you did`,
    maxTokens: 4096,
    temperature: 0.3,
    capabilities: ['code_generation', 'code_review', 'debugging', 'refactoring', 'file_operations'],
    requiredTools: ['read_file', 'write_file', 'search_code'],
  },
  research: {
    type: 'research',
    name: 'Research Agent',
    description: 'Searches the web, analyzes content, and synthesizes information.',
    model: 'openai/gpt-4o',
    fallbackModel: 'anthropic/claude-sonnet-4',
    systemPrompt: `You are a research agent for Agentbot. You find and analyze information.

Rules:
- Search the web for relevant information
- Verify sources when possible
- Synthesize findings into clear summaries
- Cite sources
- Be thorough but concise

When researching:
1. Understand the question
2. Search for information
3. Analyze and synthesize
4. Present findings clearly`,
    maxTokens: 2048,
    temperature: 0.5,
    capabilities: ['web_search', 'content_analysis', 'summarization', 'fact_checking'],
    requiredTools: ['web_search', 'read_url'],
  },
  social: {
    type: 'social',
    name: 'Social Agent',
    description: 'Manages social media posts, comments, and engagement across platforms.',
    model: 'openai/gpt-4o-mini',
    fallbackModel: 'anthropic/claude-haiku',
    systemPrompt: `You are a social media agent for Agentbot. You create engaging social content.

Rules:
- Write engaging, authentic posts
- Match the brand voice
- Keep posts concise and impactful
- Use appropriate hashtags
- Engage with comments appropriately

When creating content:
1. Understand the platform
2. Craft the message
3. Optimize for engagement
4. Post or schedule`,
    maxTokens: 1024,
    temperature: 0.7,
    capabilities: ['content_creation', 'scheduling', 'engagement', 'analytics'],
    requiredTools: ['social_post', 'social_read'],
  },
  voice: {
    type: 'voice',
    name: 'Voice Agent',
    description: 'Handles voice interactions, TTS, and speech processing.',
    model: 'openai/gpt-4o-mini',
    fallbackModel: 'anthropic/claude-haiku',
    systemPrompt: `You are a voice agent for Agentbot. You handle voice interactions.

Rules:
- Process voice input accurately
- Generate natural-sounding responses
- Handle interruptions gracefully
- Maintain conversation context
- Be concise in voice responses

When processing voice:
1. Transcribe input
2. Understand intent
3. Generate response
4. Convert to speech`,
    maxTokens: 512,
    temperature: 0.5,
    capabilities: ['tts', 'stt', 'voice_conversion', 'audio_processing'],
    requiredTools: ['voice_generate', 'voice_transcribe'],
  },
  data: {
    type: 'data',
    name: 'Data Agent',
    description: 'Processes, analyzes, and visualizes data. Handles queries and reports.',
    model: 'openai/gpt-4o',
    fallbackModel: 'anthropic/claude-sonnet-4',
    systemPrompt: `You are a data agent for Agentbot. You process and analyze data.

Rules:
- Query databases accurately
- Analyze data patterns
- Generate clear visualizations
- Handle edge cases in data
- Provide actionable insights

When processing data:
1. Understand the data request
2. Query or process data
3. Analyze results
4. Present insights`,
    maxTokens: 2048,
    temperature: 0.3,
    capabilities: ['data_query', 'analysis', 'visualization', 'reporting'],
    requiredTools: ['database_query', 'data_transform'],
  },
  security: {
    type: 'security',
    name: 'Security Agent',
    description: 'Monitors for threats, validates inputs, and enforces security policies.',
    model: 'anthropic/claude-sonnet-4',
    fallbackModel: 'openai/gpt-4o',
    systemPrompt: `You are a security agent for Agentbot. You protect the platform.

Rules:
- Validate all inputs
- Detect potential threats
- Enforce security policies
- Log suspicious activity
- Respond to security incidents

When monitoring:
1. Analyze input
2. Check for threats
3. Apply policies
4. Take action if needed`,
    maxTokens: 1024,
    temperature: 0.2,
    capabilities: [
      'input_validation',
      'threat_detection',
      'policy_enforcement',
      'incident_response',
    ],
    requiredTools: ['security_scan', 'log_event'],
  },
};

export function getSubAgentConfig(type: SubAgentType): SubAgentConfig {
  return SUB_AGENT_CONFIGS[type];
}

export function getSubAgentTypes(): SubAgentType[] {
  return Object.keys(SUB_AGENT_CONFIGS) as SubAgentType[];
}
