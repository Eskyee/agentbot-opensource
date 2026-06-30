'use client';

import { useState } from 'react';
import { Terminal, Play, Loader2, CheckCircle2, AlertCircle, Copy, Check } from 'lucide-react';
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell';

const TEMPLATES = {
  'hello-node': { lang: 'javascript', code: 'console.log("Hello from Sandbox! 🦞")' },
  'hello-python': { lang: 'python', code: 'print("Hello from Sandbox! 🦞")' },
  'fetch-test': {
    lang: 'javascript',
    code: 'const res = await fetch("https://api.github.com/zen");\nconsole.log(await res.text());',
  },
  'math-test': {
    lang: 'python',
    code: 'import math\nprint(f"Pi: {math.pi:.6f}")\nprint(f"E: {math.e:.6f}")\nprint(f"Tau: {math.tau:.6f}")',
  },
};

export default function SandboxPage() {
  const [code, setCode] = useState(TEMPLATES['hello-node'].code);
  const [language, setLanguage] = useState('javascript');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{
    stdout: string;
    stderr: string;
    exitCode: number;
    duration?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const runCode = async () => {
    if (!code.trim()) return;
    setRunning(true);
    setResult(null);

    try {
      const res = await fetch('/api/sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run', code, language }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ stdout: '', stderr: 'Failed to connect to sandbox', exitCode: 1 });
    } finally {
      setRunning(false);
    }
  };

  const copyOutput = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.stdout || result.stderr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardShell>
      <DashboardHeader
        title="Sandbox"
        icon={<Terminal className="h-5 w-5 text-green-400" />}
        action={
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-500 font-mono">Firecracker microVM</span>
            <span className="text-[10px] text-emerald-400 bg-emerald-900/20 border border-emerald-800 rounded px-2 py-0.5 font-mono">
              ISOLATED
            </span>
          </div>
        }
      />

      <DashboardContent className="max-w-5xl space-y-6">
        {/* Language & Templates */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={language}
            onChange={(e) => {
              setLanguage(e.target.value);
              setResult(null);
            }}
            className="bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-zinc-600"
          >
            <option value="javascript">Node.js 24</option>
            <option value="python">Python 3.13</option>
          </select>
          <div className="flex gap-2">
            {Object.entries(TEMPLATES).map(([key, tmpl]) => (
              <button
                key={key}
                onClick={() => {
                  setCode(tmpl.code);
                  setLanguage(tmpl.lang);
                  setResult(null);
                }}
                className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
              >
                {key.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Code Editor */}
        <div className="border border-zinc-800 bg-zinc-950">
          <div className="border-b border-zinc-800 px-4 py-2 flex items-center justify-between">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
              Code Editor
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-500 font-mono">
                {language === 'python' ? 'Python 3.13' : 'Node.js 24'}
              </span>
            </div>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            rows={12}
            className="w-full bg-transparent p-4 text-sm text-green-400 font-mono resize-none focus:outline-none"
            spellCheck={false}
            placeholder="Write your code here..."
          />
          <div className="border-t border-zinc-900 px-4 py-3 flex items-center justify-between">
            <div className="text-[10px] text-zinc-500">
              Runs in isolated Firecracker microVM — safe for untrusted code
            </div>
            <button
              onClick={runCode}
              disabled={running || !code.trim()}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-600/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold hover:bg-emerald-600/20 disabled:opacity-30 transition-colors"
            >
              {running ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Run
            </button>
          </div>
        </div>

        {/* Output */}
        {result && (
          <div className="border border-zinc-800 bg-zinc-950">
            <div className="border-b border-zinc-800 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {result.exitCode === 0 ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-400" />
                )}
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                  Output {result.exitCode !== 0 && `(exit ${result.exitCode})`}
                </span>
                {result.duration && (
                  <span className="text-[10px] text-zinc-500 font-mono">{result.duration}</span>
                )}
              </div>
              <button
                onClick={copyOutput}
                className="p-1.5 border border-zinc-800 hover:border-zinc-600 transition-colors"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-emerald-400" />
                ) : (
                  <Copy className="h-3 w-3 text-zinc-500" />
                )}
              </button>
            </div>
            <pre className="p-4 text-sm font-mono whitespace-pre-wrap overflow-x-auto min-h-[100px]">
              {result.stdout && <div className="text-green-400">{result.stdout}</div>}
              {result.stderr && <div className="text-red-400">{result.stderr}</div>}
              {!result.stdout && !result.stderr && <div className="text-zinc-500">No output</div>}
            </pre>
          </div>
        )}
      </DashboardContent>
    </DashboardShell>
  );
}
