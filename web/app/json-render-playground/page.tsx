'use client';

import { useState, useMemo, useRef } from 'react';
import { Renderer, StateProvider, VisibilityProvider, ActionProvider } from '@json-render/react';
import { agentbotRegistry, agentbotHandlers } from '@/app/lib/json-render/registry';

const PRESETS = [
  'Create a login form',
  'Build a pricing page',
  'Design a user profile card',
  'Make a contact form',
];

const EXAMPLES: Record<string, object> = {
  login: {
    root: 'e1',
    elements: {
      e1: {
        type: 'Card',
        props: { title: 'Sign In', description: 'Welcome back' },
        children: ['e2', 'e3', 'e4'],
      },
      e2: { type: 'Input', props: { placeholder: 'Email address', type: 'email' } },
      e3: { type: 'Input', props: { placeholder: 'Password', type: 'password' } },
      e4: { type: 'Button', props: { label: 'Sign In' } },
    },
  },
  pricing: {
    root: 'e1',
    elements: {
      e1: {
        type: 'Stack',
        props: { direction: 'horizontal', gap: 'md' },
        children: ['e2', 'e3', 'e4'],
      },
      e2: { type: 'Card', props: { title: 'Free', description: '$0/mo' }, children: ['e5'] },
      e5: { type: 'Button', props: { label: 'Get Started', variant: 'outline' } },
      e3: { type: 'Card', props: { title: 'Pro', description: '$29/mo' }, children: ['e6'] },
      e6: { type: 'Button', props: { label: 'Upgrade' } },
      e4: { type: 'Card', props: { title: 'Enterprise', description: '$99/mo' }, children: ['e7'] },
      e7: { type: 'Button', props: { label: 'Contact', variant: 'ghost' } },
    },
  },
  profile: {
    root: 'e1',
    elements: {
      e1: { type: 'Card', props: { title: 'User Profile' }, children: ['e2'] },
      e2: {
        type: 'Stack',
        props: { direction: 'horizontal', gap: 'md', align: 'center' },
        children: ['e3', 'e4'],
      },
      e3: { type: 'StatusBadge', props: { status: 'active', label: 'Online' } },
      e4: { type: 'Stack', props: { direction: 'vertical', gap: 'sm' }, children: ['e5', 'e6'] },
      e5: { type: 'Heading', props: { level: 4, content: 'Alex Johnson' } },
      e6: { type: 'Badge', props: { label: 'alex@example.com', variant: 'secondary' } },
    },
  },
  contact: {
    root: 'e1',
    elements: {
      e1: {
        type: 'Card',
        props: { title: 'Contact Us', description: 'Send us a message' },
        children: ['e2', 'e3', 'e4', 'e5'],
      },
      e2: { type: 'Input', props: { placeholder: 'Your name' } },
      e3: { type: 'Input', props: { placeholder: 'Email address', type: 'email' } },
      e4: { type: 'Input', props: { placeholder: 'Your message' } },
      e5: { type: 'Button', props: { label: 'Send Message' } },
    },
  },
  dashboard: {
    root: 'e1',
    elements: {
      e1: {
        type: 'Card',
        props: { title: 'Dashboard', description: 'Agent performance' },
        children: ['e2'],
      },
      e2: {
        type: 'Stack',
        props: { direction: 'horizontal', gap: 'md' },
        children: ['e3', 'e4', 'e5', 'e6'],
      },
      e3: { type: 'Metric', props: { label: 'Uptime', value: '99.97%', change: 0.02 } },
      e4: { type: 'Metric', props: { label: 'Requests', value: '12,847', change: 12.5 } },
      e5: { type: 'Metric', props: { label: 'Revenue', value: '$4,820', change: 8.3 } },
      e6: { type: 'Metric', props: { label: 'Errors', value: '3', change: -2.1 } },
    },
  },
  agents: {
    root: 'e1',
    elements: {
      e1: { type: 'Card', props: { title: 'Agent Fleet' }, children: ['e2'] },
      e2: {
        type: 'Stack',
        props: { direction: 'vertical', gap: 'sm' },
        children: ['e3', 'e4', 'e5'],
      },
      e3: {
        type: 'Stack',
        props: { direction: 'horizontal', gap: 'md', align: 'center' },
        children: ['e6', 'e7'],
      },
      e6: { type: 'StatusBadge', props: { status: 'active', label: 'Running' } },
      e7: { type: 'Heading', props: { level: 4, content: 'Atlas — Main' } },
      e4: {
        type: 'Stack',
        props: { direction: 'horizontal', gap: 'md', align: 'center' },
        children: ['e8', 'e9'],
      },
      e8: { type: 'StatusBadge', props: { status: 'pending', label: 'Pending' } },
      e9: { type: 'Heading', props: { level: 4, content: 'Scout — Research' } },
      e5: {
        type: 'Stack',
        props: { direction: 'horizontal', gap: 'md', align: 'center' },
        children: ['e10', 'e11'],
      },
      e10: { type: 'StatusBadge', props: { status: 'error', label: 'Offline' } },
      e11: { type: 'Heading', props: { level: 4, content: 'Sentinel — Security' } },
    },
  },
  code: {
    root: 'e1',
    elements: {
      e1: { type: 'Card', props: { title: 'Agent Config' }, children: ['e2'] },
      e2: {
        type: 'CodeBlock',
        props: {
          language: 'typescript',
          code: "const agent = defineAgent({\n  name: 'Atlas',\n  model: 'claude-3-opus',\n});",
        },
      },
    },
  },
};

export default function PlaygroundPage() {
  const [spec, setSpec] = useState<object>(EXAMPLES.dashboard);
  const [editorValue, setEditorValue] = useState(JSON.stringify(EXAMPLES.dashboard, null, 2));
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<'json' | 'visual'>('visual');
  const [rightTab, setRightTab] = useState<'preview' | 'code'>('preview');
  const [jsonError, setJsonError] = useState('');
  const [state, setState] = useState<Record<string, unknown>>({});
  const [mobileTab, setMobileTab] = useState<'editor' | 'preview'>('preview');
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

  const updateSpec = (s: object) => {
    setSpec(s);
    setEditorValue(JSON.stringify(s, null, 2));
    setJsonError('');
  };

  const loadExample = (key: string) => {
    updateSpec(EXAMPLES[key]);
    setPrompt('');
  };

  const handleEditorChange = (val: string) => {
    setEditorValue(val);
    try {
      const parsed = JSON.parse(val);
      setJsonError('');
      setSpec(parsed);
    } catch {
      setJsonError('Invalid JSON');
    }
  };

  const generate = async () => {
    if (!prompt.trim() || generating) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/json-render/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (res.ok && data.spec) {
        updateSpec(data.spec);
      } else {
        setJsonError(data.error || 'Failed');
      }
    } catch {
      setJsonError('Network error');
    } finally {
      setGenerating(false);
    }
  };

  const loadPreset = (p: string) => {
    const key = p.toLowerCase().includes('login')
      ? 'login'
      : p.toLowerCase().includes('pricing')
        ? 'pricing'
        : p.toLowerCase().includes('profile')
          ? 'profile'
          : 'contact';
    updateSpec(EXAMPLES[key]);
    setPrompt(p);
  };

  const copyJson = () => navigator.clipboard.writeText(editorValue);

  return (
    <div
      className="flex flex-col bg-black text-white overflow-hidden"
      style={{ height: 'calc(100vh - 120px)' }}
    >
      {/* Header */}
      <header className="h-10 sm:h-12 border-b border-zinc-800 px-3 sm:px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="font-bold text-xs sm:text-sm tracking-tight">json-render</span>
          <span className="text-zinc-600 hidden sm:inline">|</span>
          <span className="text-xs text-zinc-500 hidden sm:inline">Playground</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <a
            href="/documentation/products"
            className="text-xs text-zinc-500 hover:text-white transition-colors hidden sm:inline"
          >
            Docs
          </a>
          <a
            href="https://github.com/vercel-labs/json-render"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-zinc-500 hover:text-white transition-colors hidden sm:inline"
          >
            GitHub
          </a>
        </div>
      </header>

      {/* Mobile tab switcher */}
      <div className="flex sm:hidden border-b border-zinc-800 shrink-0">
        <button
          onClick={() => setMobileTab('editor')}
          className={`flex-1 py-2 text-xs font-mono text-center ${
            mobileTab === 'editor' ? 'text-white border-b-2 border-white' : 'text-zinc-500'
          }`}
        >
          editor
        </button>
        <button
          onClick={() => setMobileTab('preview')}
          className={`flex-1 py-2 text-xs font-mono text-center ${
            mobileTab === 'preview' ? 'text-white border-b-2 border-white' : 'text-zinc-500'
          }`}
        >
          preview
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col sm:flex-row min-h-0">
        {/* Left panel - Prompt (hidden on mobile when editing) */}
        <div
          className={`${
            mobileTab === 'editor' ? 'flex' : 'hidden'
          } sm:flex w-full sm:w-72 lg:w-80 border-r border-zinc-800 flex-col shrink-0`}
        >
          <div className="px-3 h-8 border-b border-zinc-800 flex items-center">
            <span className="text-[10px] font-mono text-zinc-500">versions</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center px-3 text-center">
            <p className="text-xs text-zinc-500 mb-3">
              Describe what you want to build, then iterate on it.
            </p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => loadPreset(p)}
                  className="text-[10px] px-2 py-1 rounded border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5 justify-center">
              {Object.keys(EXAMPLES).map((key) => (
                <button
                  key={key}
                  onClick={() => loadExample(key)}
                  className="text-[10px] px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-zinc-500 hover:text-white hover:border-zinc-600 transition-colors"
                >
                  {key}
                </button>
              ))}
            </div>
          </div>
          <div className="border-t border-zinc-900 p-2">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) =>
                e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), generate())
              }
              placeholder="Describe changes..."
              rows={2}
              className="w-full bg-transparent text-xs resize-none outline-none placeholder:text-zinc-600"
            />
            <div className="flex justify-between items-center mt-1.5">
              <div className="flex items-center gap-1.5">
                <div className="flex items-center rounded border border-zinc-700 text-[9px] font-mono overflow-hidden">
                  <button className="px-1.5 py-0.5 bg-zinc-800 text-white">json</button>
                  <button className="px-1.5 py-0.5 text-zinc-500 hover:text-white">yaml</button>
                </div>
                <div className="flex items-center rounded border border-zinc-700 text-[9px] font-mono overflow-hidden">
                  <button className="px-1.5 py-0.5 bg-zinc-800 text-white">patch</button>
                  <button className="px-1.5 py-0.5 text-zinc-500 hover:text-white">merge</button>
                  <button className="px-1.5 py-0.5 text-zinc-500 hover:text-white">diff</button>
                </div>
              </div>
              <button
                onClick={generate}
                disabled={generating || !prompt.trim()}
                className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center hover:bg-zinc-200 transition-colors disabled:opacity-30"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Middle panel - JSON editor / visual */}
        <div
          className={`${
            mobileTab === 'editor' ? 'flex' : 'hidden'
          } sm:flex flex-1 flex-col min-w-0`}
        >
          <div className="h-8 border-b border-zinc-800 px-3 flex items-center gap-3">
            <button
              onClick={() => setViewMode('json')}
              className={`text-xs font-mono transition-colors ${
                viewMode === 'json' ? 'text-white' : 'text-zinc-500 hover:text-white'
              }`}
            >
              json
            </button>
            <button
              onClick={() => setViewMode('visual')}
              className={`text-xs font-mono transition-colors ${
                viewMode === 'visual' ? 'text-white' : 'text-zinc-500 hover:text-white'
              }`}
            >
              visual
            </button>
            <div className="flex-1" />
            <button
              onClick={copyJson}
              className="p-1 rounded hover:bg-zinc-800 transition-colors text-zinc-500"
              aria-label="Copy"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-auto">
            {viewMode === 'json' ? (
              <div className="relative h-full">
                {jsonError && (
                  <div className="absolute top-2 right-2 text-[10px] text-red-400 bg-red-500/10 px-2 py-1 rounded">
                    {jsonError}
                  </div>
                )}
                <textarea
                  value={editorValue}
                  onChange={(e) => handleEditorChange(e.target.value)}
                  className="w-full h-full bg-zinc-950 text-zinc-300 font-mono text-[11px] p-3 resize-none focus:outline-none leading-relaxed"
                  spellCheck={false}
                />
              </div>
            ) : (
              <div className="p-3">
                {spec && (spec as any).root ? (
                  <StateProvider initialState={state}>
                    <VisibilityProvider>
                      <ActionProvider handlers={actionHandlers}>
                        <Renderer spec={spec as any} registry={agentbotRegistry} />
                      </ActionProvider>
                    </VisibilityProvider>
                  </StateProvider>
                ) : (
                  <div className="text-zinc-600 text-xs text-center py-12">No spec to render</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right panel - Preview / Code (hidden on mobile when editing) */}
        <div
          className={`${
            mobileTab === 'preview' ? 'flex' : 'hidden'
          } sm:flex w-full sm:w-80 lg:w-96 border-l border-zinc-800 flex-col shrink-0`}
        >
          <div className="h-8 border-b border-zinc-800 px-3 flex items-center gap-3">
            <button
              onClick={() => setRightTab('preview')}
              className={`text-xs font-mono transition-colors ${
                rightTab === 'preview' ? 'text-white' : 'text-zinc-500 hover:text-white'
              }`}
            >
              preview
            </button>
            <button
              onClick={() => setRightTab('code')}
              className={`text-xs font-mono transition-colors ${
                rightTab === 'code' ? 'text-white' : 'text-zinc-500 hover:text-white'
              }`}
            >
              code
            </button>
          </div>
          <div className="flex-1 overflow-auto">
            {rightTab === 'preview' ? (
              <div className="p-3">
                {spec && (spec as any).root ? (
                  <StateProvider initialState={state}>
                    <VisibilityProvider>
                      <ActionProvider handlers={actionHandlers}>
                        <Renderer spec={spec as any} registry={agentbotRegistry} />
                      </ActionProvider>
                    </VisibilityProvider>
                  </StateProvider>
                ) : (
                  <div className="text-zinc-600 text-xs text-center py-12">
                    // enter a prompt to generate UI
                  </div>
                )}
              </div>
            ) : (
              <pre className="p-3 text-[11px] text-zinc-400 font-mono overflow-auto whitespace-pre-wrap">
                {editorValue}
              </pre>
            )}
          </div>
        </div>
      </div>

      {/* Generating indicator */}
      {generating && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-zinc-900 border border-zinc-700 px-3 py-1.5 rounded-lg text-[10px] text-zinc-400 flex items-center gap-2 z-50">
          <div className="flex gap-0.5">
            <div
              className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"
              style={{ animationDelay: '0ms' }}
            />
            <div
              className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"
              style={{ animationDelay: '150ms' }}
            />
            <div
              className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"
              style={{ animationDelay: '300ms' }}
            />
          </div>
          Generating...
        </div>
      )}
    </div>
  );
}
