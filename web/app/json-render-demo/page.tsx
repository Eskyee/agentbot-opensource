'use client';

import { useState, useMemo, useRef } from 'react';
import { Renderer, StateProvider, VisibilityProvider, ActionProvider } from '@json-render/react';
import { agentbotRegistry, agentbotHandlers } from '@/app/lib/json-render/registry';
import type { Spec } from '@json-render/core';

const DEMO_SPECS: Record<string, Spec> = {
  metrics: {
    root: 'card-1',
    elements: {
      'card-1': {
        type: 'Card',
        props: { title: 'Agent Metrics', description: 'Live performance data' },
        children: ['stack-1'],
      },
      'stack-1': {
        type: 'Stack',
        props: { direction: 'horizontal', gap: 'md' },
        children: ['metric-1', 'metric-2', 'metric-3'],
      },
      'metric-1': {
        type: 'Metric',
        props: { label: 'Uptime', value: '99.97%', change: 0.02 },
      },
      'metric-2': {
        type: 'Metric',
        props: { label: 'Requests', value: '12,847', change: 12.5 },
      },
      'metric-3': {
        type: 'Metric',
        props: { label: 'Errors', value: '3', change: -2.1 },
      },
    },
  },
  status: {
    root: 'card-1',
    elements: {
      'card-1': {
        type: 'Card',
        props: { title: 'Agent Status', description: 'Current state of your agents' },
        children: ['stack-1'],
      },
      'stack-1': {
        type: 'Stack',
        props: { direction: 'vertical', gap: 'sm' },
        children: ['agent-1', 'agent-2', 'agent-3'],
      },
      'agent-1': {
        type: 'Stack',
        props: { direction: 'horizontal', gap: 'md', align: 'center' },
        children: ['status-1', 'heading-1'],
      },
      'status-1': {
        type: 'StatusBadge',
        props: { status: 'active', label: 'Running' },
      },
      'heading-1': {
        type: 'Heading',
        props: { level: 4, content: 'Atlas — Main Agent' },
      },
      'agent-2': {
        type: 'Stack',
        props: { direction: 'horizontal', gap: 'md', align: 'center' },
        children: ['status-2', 'heading-2'],
      },
      'status-2': {
        type: 'StatusBadge',
        props: { status: 'pending', label: 'Provisioning' },
      },
      'heading-2': {
        type: 'Heading',
        props: { level: 4, content: 'Scout — Research Agent' },
      },
      'agent-3': {
        type: 'Stack',
        props: { direction: 'horizontal', gap: 'md', align: 'center' },
        children: ['status-3', 'heading-3'],
      },
      'status-3': {
        type: 'StatusBadge',
        props: { status: 'error', label: 'Offline' },
      },
      'heading-3': {
        type: 'Heading',
        props: { level: 4, content: 'Sentinel — Security Agent' },
      },
    },
  },
  code: {
    root: 'card-1',
    elements: {
      'card-1': {
        type: 'Card',
        props: { title: 'Generated Code', description: 'AI-generated configuration' },
        children: ['code-1'],
      },
      'code-1': {
        type: 'CodeBlock',
        props: {
          language: 'typescript',
          code: `import { defineAgent } from '@agentbot/core';

const atlas = defineAgent({
  name: 'Atlas',
  model: 'claude-3-opus',
  skills: ['research', 'coding', 'analysis'],
});`,
        },
      },
    },
  },
};

const PRESETS = [
  'Dashboard with 4 metric cards showing revenue, users, orders, and growth',
  'Pricing table with Free, Pro, and Enterprise tiers',
  'Activity feed with 3 recent events',
  'Settings form with name input and email input',
  'Status board with 5 agents showing their current state',
];

export default function JsonRenderDemo() {
  const [activePreset, setActivePreset] = useState('metrics');
  const [state, setState] = useState<Record<string, unknown>>({});
  const [spec, setSpec] = useState<Spec>(DEMO_SPECS.metrics);
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [showSource, setShowSource] = useState(false);
  const stateRef = useRef(state);
  const setStateRef = useRef(setState);
  stateRef.current = state;
  setStateRef.current = setState;

  const actionHandlers = useMemo(
    () =>
      agentbotHandlers(
        () => setStateRef.current,
        () => stateRef.current
      ),
    []
  );

  const loadPreset = (key: string) => {
    setActivePreset(key);
    setSpec(DEMO_SPECS[key] || DEMO_SPECS.metrics);
    setPrompt('');
    setError('');
  };

  const generate = async (promptText: string) => {
    if (!promptText.trim() || generating) return;

    setGenerating(true);
    setError('');
    setActivePreset('');

    try {
      const res = await fetch('/api/json-render/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Generation failed');
      }

      if (data.spec && data.spec.root && data.spec.elements) {
        setSpec(data.spec);
      } else {
        throw new Error('Invalid spec structure returned');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">json-render</h1>
        <p className="text-zinc-400 mb-8">
          Generative UI for Agentbot — AI generates interfaces from JSON specs
        </p>

        {/* Preset buttons */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {Object.keys(DEMO_SPECS).map((key) => (
            <button
              key={key}
              onClick={() => loadPreset(key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activePreset === key
                  ? 'bg-white text-black'
                  : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </button>
          ))}
        </div>

        {/* Prompt input */}
        <div className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && generate(prompt)}
              placeholder="Describe the UI you want to generate..."
              disabled={generating}
              className="flex-1 bg-zinc-900 border border-zinc-800 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-mono disabled:opacity-50"
            />
            <button
              onClick={() => generate(prompt)}
              disabled={generating || !prompt.trim()}
              className="bg-white text-black px-5 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? 'Generating...' : 'Generate'}
            </button>
          </div>

          {/* Quick prompts */}
          <div className="flex gap-2 mt-3 flex-wrap">
            {PRESETS.map((preset) => (
              <button
                key={preset}
                onClick={() => {
                  setPrompt(preset);
                  generate(preset);
                }}
                disabled={generating}
                className="text-[10px] px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-zinc-500 hover:text-white hover:border-zinc-600 transition-colors disabled:opacity-50"
              >
                {preset.length > 40 ? preset.slice(0, 40) + '...' : preset}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded">
            {error}
          </div>
        )}

        {/* Rendered spec */}
        <div className="border border-zinc-800 rounded-xl p-6 bg-zinc-950 min-h-[200px]">
          {generating ? (
            <div className="flex items-center justify-center h-32">
              <div className="flex gap-1">
                <div
                  className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce"
                  style={{ animationDelay: '0ms' }}
                />
                <div
                  className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce"
                  style={{ animationDelay: '150ms' }}
                />
                <div
                  className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce"
                  style={{ animationDelay: '300ms' }}
                />
              </div>
            </div>
          ) : spec.root ? (
            <StateProvider initialState={state}>
              <VisibilityProvider>
                <ActionProvider handlers={actionHandlers}>
                  <Renderer spec={spec} registry={agentbotRegistry} />
                </ActionProvider>
              </VisibilityProvider>
            </StateProvider>
          ) : (
            <div className="text-center py-12 text-zinc-600">
              <p className="text-sm">Select a preset or describe what you want to generate</p>
            </div>
          )}
        </div>

        {/* Source toggle */}
        <button
          onClick={() => setShowSource(!showSource)}
          className="mt-4 text-xs text-zinc-500 hover:text-white transition-colors"
        >
          {showSource ? 'Hide source' : 'Show source'}
        </button>

        {showSource && (
          <pre className="mt-2 p-4 bg-zinc-900 rounded-lg overflow-x-auto text-xs text-zinc-400 max-h-96 overflow-y-auto">
            {JSON.stringify(spec, null, 2)}
          </pre>
        )}
      </div>
    </main>
  );
}
