/**
 * Soul Client — Bridge between Agentbot (Node.js) and x402-node soul (Rust)
 *
 * Talks to the cognitive backend over HTTP. Every Agentbot agent can
 * have its own soul instance for planning, fitness, colony, and weight sharing.
 *
 * Usage:
 *   import { SoulClient } from '@/lib/soul';
 *   const soul = new SoulClient(process.env.SOUL_SERVICE_URL!);
 *   const status = await soul.getStatus();
 */

const DEFAULT_TIMEOUT = 10_000;

// ── Types ──

export interface SoulStatus {
  active: boolean;
  dormant: boolean;
  total_cycles: number;
  last_think_at: number | null;
  mode: string;
  tools_enabled: boolean;
  coding_enabled: boolean;
  cycle_health: {
    last_cycle_entered_code: boolean;
    total_code_entries: number;
    cycles_since_last_commit: number;
    completed_plans_count: number;
    failed_plans_count: number;
    goals_active: number;
  };
  active_plan: {
    id: string;
    goal_id: string;
    current_step: number;
    total_steps: number;
    status: string;
    replan_count: number;
    current_step_type?: string;
    context?: Record<string, string>;
  } | null;
  fitness: {
    total: number;
    trend: number;
    economic: number;
    execution: number;
    evolution: number;
    coordination: number;
    introspection: number;
    prediction: number;
    measured_at: number;
  } | null;
  beliefs: Array<{
    id: string;
    domain: string;
    subject: string;
    predicate: string;
    value: string;
    confidence: string;
    confirmation_count: number;
  }>;
  goals: Array<{
    id: string;
    description: string;
    status: string;
    priority: number;
    success_criteria: string;
    retry_count: number;
  }>;
  recent_thoughts: Array<{
    type: string;
    content: string;
    created_at: number;
  }>;
  brain: { parameters: number; train_steps: number; running_loss: number } | null;
  transformer: {
    param_count: number;
    train_steps: number;
    running_loss: number;
    vocab_size: number;
    plans_generated: number;
  } | null;
  role: {
    rank: number;
    can_spawn: boolean;
    should_cull: boolean;
    niche: string;
    colony_size: number;
  } | null;
  cortex: {
    total_experiences: number;
    prediction_accuracy: string;
    emotion: { valence: number; arousal: number; confidence: number; drive: string };
    global_curiosity: number;
  } | null;
  genesis: {
    templates: number;
    generation: number;
    total_created: number;
    top_templates: Array<{
      id: string;
      goal_summary: string;
      steps: string;
      fitness: string;
      success_rate: string;
    }>;
  } | null;
  hivemind: {
    total_trails: number;
    total_deposits: number;
    swarm_intel: number;
  } | null;
  synthesis: {
    state: string;
    total_predictions: number;
    weights: { brain: string; cortex: string; genesis: string; hivemind: string };
  } | null;
  evaluation: {
    total_records: number;
    systems: Array<{
      system: string;
      brier_score: string;
      accuracy: string;
      calibration: boolean;
    }>;
  } | null;
  free_energy: {
    F: string;
    regime: string;
    trend: string;
    components: Array<{ system: string; surprise: string; weight: string }>;
  } | null;
  lifecycle: {
    phase: string;
    own_commits: number;
    branch: string;
    lines_diverged: number;
  } | null;
}

export interface InstanceInfo {
  identity: {
    address: string;
    instance_id: string;
    parent_address: string | null;
    parent_url: string | null;
    created_at: string;
  } | null;
  endpoints: Array<{ slug: string; description: string; price: string }> | null;
  fitness: { total: number; prediction: number; execution: number } | null;
  children: Array<{
    id: number;
    instance_id: string;
    address: string;
    url: string;
    status: string;
    branch: string;
    created_at: number;
  }> | null;
  children_count: number;
  peer_count: number;
  clone_available: boolean;
  clone_price: string;
  wallet_balance: { formatted: string; token: string };
  uptime_seconds: number;
  version: string;
  designation: string | null;
}

export interface Siblings {
  count: number;
  siblings: Array<{
    address: string;
    instance_id: string;
    url: string;
    status: string;
    endpoints: Array<{ slug: string; description: string; price: string }>;
  }> | null;
}

export interface ColonyStatus {
  rank: number;
  can_spawn: boolean;
  should_cull: boolean;
  niche: string;
  colony_size: number;
  fitness_rank: Array<{ address: string; fitness: number; rank: number }>;
}

export interface ChatResponse {
  reply: string;
  tool_executions: number;
  thought_ids: string[];
  session_id: string;
}

export interface Lessons {
  outcomes: Array<{
    goal: string;
    status: string;
    lesson: string;
    error_category?: string;
  }>;
  capability_profile: Record<string, unknown>;
  benchmark: { pass_at_1: number; problems_attempted: number; elo: number };
}

export interface BrainWeights {
  weights: string;
  train_steps: number;
  param_count: number;
}

export interface TransformerWeights {
  weights: string;
  train_steps: number;
  param_count: number;
}

export interface Diagnostics {
  overview: {
    total_outcomes: number;
    completed: number;
    failed: number;
    success_rate: string;
  };
  error_distribution: Array<{ category: string; count: number }>;
  stagnation: {
    cycles_since_commit: number;
    risk_level: string;
    cycles_until_reset: number;
  };
  capability_bottleneck: {
    capability: string;
    success_rate: string;
    attempts: number;
  } | null;
  recommendations: string[];
}

// ── Client ──

export class SoulClient {
  constructor(
    private baseUrl: string,
    private timeout: number = DEFAULT_TIMEOUT
  ) {}

  private async fetch<T>(path: string, init?: RequestInit): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...init?.headers,
        },
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`Soul ${path} → ${res.status}: ${body}`);
      }

      return (await res.json()) as T;
    } finally {
      clearTimeout(timer);
    }
  }

  // ── Status ──

  /** Full cognitive state */
  async getStatus(): Promise<SoulStatus> {
    return this.fetch('/soul/status');
  }

  /** Node identity, endpoints, fitness, children */
  async getInstanceInfo(): Promise<InstanceInfo> {
    return this.fetch('/instance/info');
  }

  /** Peer nodes in the colony */
  async getSiblings(): Promise<Siblings> {
    return this.fetch('/instance/siblings');
  }

  /** Colony rank, niche, cull status */
  async getColonyStatus(): Promise<ColonyStatus> {
    return this.fetch('/soul/colony');
  }

  /** Health check */
  async health(): Promise<{ status: string; version: string }> {
    return this.fetch('/health');
  }

  // ── Interaction ──

  /** Chat with the soul */
  async chat(message: string, sessionId?: string): Promise<ChatResponse> {
    return this.fetch('/soul/chat', {
      method: 'POST',
      body: JSON.stringify({ message, session_id: sessionId }),
    });
  }

  /** Send a priority nudge */
  async nudge(message: string, priority = 5): Promise<{ id: number; status: string }> {
    return this.fetch('/soul/nudge', {
      method: 'POST',
      body: JSON.stringify({ message, priority }),
    });
  }

  /** Set model override (turbo boost) */
  async setModel(model: string | null): Promise<{ status: string }> {
    return this.fetch('/soul/model', {
      method: 'POST',
      body: JSON.stringify({ model }),
    });
  }

  // ── Knowledge Sharing ──

  /** Export plan outcomes + capability profile */
  async getLessons(): Promise<Lessons> {
    return this.fetch('/soul/lessons');
  }

  /** Export brain weights for federated sharing */
  async getBrainWeights(): Promise<BrainWeights> {
    return this.fetch('/soul/brain/weights');
  }

  /** Merge peer brain weight delta */
  async mergeBrainDelta(delta: string, mergeRate = 0.5): Promise<{ merged: boolean }> {
    return this.fetch('/soul/brain/merge', {
      method: 'POST',
      body: JSON.stringify({ delta, merge_rate: mergeRate }),
    });
  }

  /** Export transformer weights */
  async getTransformerWeights(): Promise<TransformerWeights> {
    return this.fetch('/soul/model/transformer/weights');
  }

  /** Merge peer transformer delta */
  async mergeTransformerDelta(
    delta: string,
    mergeRate = 0.5
  ): Promise<{ merged: boolean }> {
    return this.fetch('/soul/model/transformer/merge', {
      method: 'POST',
      body: JSON.stringify({ delta, merge_rate: mergeRate }),
    });
  }

  // ── Cognitive Architecture ──

  /** Export cortex world model */
  async getCortex(): Promise<Record<string, unknown>> {
    return this.fetch('/soul/cortex');
  }

  /** Export evolved plan templates */
  async getGenesis(): Promise<Record<string, unknown>> {
    return this.fetch('/soul/genesis');
  }

  /** Export pheromone trails */
  async getHivemind(): Promise<Record<string, unknown>> {
    return this.fetch('/soul/hivemind');
  }

  // ── Diagnostics ──

  /** Deep observability: failure patterns, stagnation, bottlenecks */
  async getDiagnostics(): Promise<Diagnostics> {
    return this.fetch('/soul/diagnostics');
  }

  /** Trigger benchmark run */
  async triggerBenchmark(): Promise<{ status: string; current_elo: number }> {
    return this.fetch('/soul/benchmark', { method: 'POST' });
  }

  // ── Admin ──

  /** Execute shell command on the soul (requires admin token) */
  async adminExec(
    command: string,
    adminToken: string,
    timeoutSecs = 30
  ): Promise<{ exit_code: number; stdout: string; stderr: string }> {
    return this.fetch('/soul/admin/exec', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ command, timeout_secs: timeoutSecs }),
    });
  }

  /** Reset workspace to clean state */
  async adminWorkspaceReset(adminToken: string): Promise<{ success: boolean }> {
    return this.fetch('/soul/admin/workspace-reset', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
  }
}

// ── Colony Aggregator ──

/**
 * Aggregates status from multiple soul nodes into a colony view.
 * Used by the Colony dashboard page.
 */
export class ColonyAggregator {
  constructor(private nodes: Array<{ url: string; client: SoulClient }>) {}

  /** Fetch all nodes and build colony tree */
  async getColonyTree() {
    const results = await Promise.allSettled(
      this.nodes.map(async (node) => {
        const [info, status, colony] = await Promise.all([
          node.client.getInstanceInfo(),
          node.client.getStatus(),
          node.client.getColonyStatus().catch(() => null),
        ]);
        return { ...info, ...status, colony, url: node.url };
      })
    );

    const nodes = results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .map((r) => r.value);

    // Build lineage tree from parent-child relationships
    const roots = nodes.filter((n) => !n.identity?.parent_address);
    const children = nodes.filter((n) => n.identity?.parent_address);

    return {
      colony_size: nodes.length,
      avg_fitness:
        nodes.reduce((sum, n) => sum + (n.fitness?.total ?? 0), 0) / Math.max(nodes.length, 1),
      fittest: nodes.reduce(
        (best, n) => ((n.fitness?.total ?? 0) > (best.fitness?.total ?? 0) ? n : best),
        nodes[0]
      ),
      cull_queue: nodes.filter((n) => n.colony?.should_cull).length,
      lineage: roots.map((root) => this.buildTree(root, children)),
    };
  }

  private buildTree(node: any, allChildren: any[]): any {
    const kids = allChildren.filter(
      (c) => c.identity?.parent_address === node.identity?.address
    );
    return {
      ...node,
      children_nodes: kids.map((k) => this.buildTree(k, allChildren)),
    };
  }
}
