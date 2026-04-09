/**
 * Model Selection Guide — PAI Delegation Pattern
 *
 * PAI Principle: "If it's grunt work or verification → haiku. If it's
 * implementation or research → sonnet. If it requires deep strategic
 * thinking → opus."
 *
 * Agentbot's tiered routing (reasoning/coding/fast/creative) maps to this.
 * This guide documents when to use each tier for agent tasks.
 */

/**
 * Task classification → model tier mapping.
 * Used by agents when selecting which model to invoke for a subtask.
 */
export const TASK_MODEL_MATRIX = {
  // Fast / cheap — grunt work, verification, simple lookups
  fast: {
    tier: 'fast' as const,
    tasks: [
      'verify_output',
      'parse_json',
      'extract_field',
      'format_response',
      'classify_input',
      'simple_lookup',
      'health_check',
      'status_report',
    ],
    latency: '~1s',
    cost: 'low',
  },

  // Balanced — implementation, analysis, standard coding
  standard: {
    tier: 'coding' as const,
    tasks: [
      'implement_feature',
      'write_tests',
      'refactor_code',
      'analyze_data',
      'debug_issue',
      'write_docs',
      'code_review',
      'research_topic',
    ],
    latency: '~5s',
    cost: 'medium',
  },

  // Smart — strategic decisions, architecture, complex reasoning
  smart: {
    tier: 'reasoning' as const,
    tasks: [
      'design_architecture',
      'strategic_planning',
      'security_audit',
      'complex_debugging',
      'tradeoff_analysis',
      'algorithm_design',
      'system_design',
    ],
    latency: '~15s',
    cost: 'high',
  },
} as const;

/**
 * Get the recommended model tier for a task type.
 * Falls back to 'standard' if task type is unrecognized.
 */
export function getRecommendedTier(taskType: string): 'fast' | 'coding' | 'reasoning' | 'creative' {
  for (const [key, config] of Object.entries(TASK_MODEL_MATRIX)) {
    if ((config.tasks as readonly string[]).includes(taskType)) {
      return config.tier;
    }
  }
  return 'coding'; // safe default
}

/**
 * Parallel delegation rule: when to spawn multiple agents.
 * PAI: "WHENEVER A TASK CAN BE PARALLELIZED, USE MULTIPLE AGENTS"
 *
 * Use fast tier for parallel workers — 5 haiku agents is faster AND cheaper
 * than 1 opus agent doing sequential work.
 */
export const PARALLEL_DELEGATION_RULES = {
  // Use fast tier for these parallel tasks
  fast_parallel: [
    'verify_multiple_outputs',
    'check_multiple_endpoints',
    'parse_multiple_files',
    'classify_multiple_inputs',
    'health_check_multiple_services',
  ],

  // Use standard tier for these parallel tasks
  standard_parallel: [
    'research_multiple_topics',
    'review_multiple_files',
    'test_multiple_scenarios',
  ],

  // Always sequential (never parallelize)
  sequential_only: [
    'strategic_planning',
    'architecture_design',
    'security_audit',
  ],
} as const;
