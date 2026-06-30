'use client';

interface BottomBarProps {
  focusedAgent?: string | null;
  activeWorkflow?: string | null;
  model?: string | null;
  queueDepth?: number;
  uplinkOk?: boolean;
  advisoryCount?: number;
}

export function BottomBar({
  focusedAgent,
  activeWorkflow,
  model,
  queueDepth = 0,
  uplinkOk = true,
  advisoryCount = 0,
}: BottomBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950 border-t border-zinc-900 px-4 py-1.5 flex items-center gap-4 font-mono text-[10px]">
      <span className="text-zinc-500">agentbot-prod</span>
      <span className="text-zinc-500">·</span>
      <span className="text-zinc-500">region fra-1</span>
      <span className="text-zinc-500">·</span>
      {focusedAgent ? (
        <span className="text-zinc-400">
          focus <span className="text-zinc-200">{focusedAgent}</span>
        </span>
      ) : (
        <span className="text-zinc-500">no focus</span>
      )}
      <span className="text-zinc-500">·</span>
      {activeWorkflow ? (
        <span className="text-zinc-400">
          wf <span className="text-zinc-200">{activeWorkflow}</span>
        </span>
      ) : (
        <span className="text-zinc-500">no workflow</span>
      )}
      <span className="text-zinc-500">·</span>
      {model ? (
        <span className="text-zinc-400">
          model <span className="text-zinc-200">{model}</span>
        </span>
      ) : (
        <span className="text-zinc-500">no model</span>
      )}
      <span className="text-zinc-500">·</span>
      <span className="text-zinc-400">
        queue{' '}
        <span className={queueDepth > 10 ? 'text-yellow-400' : 'text-zinc-200'}>{queueDepth}</span>
      </span>
      <span className="text-zinc-500">·</span>
      <span className={uplinkOk ? 'text-green-400' : 'text-red-400'}>
        uplink {uplinkOk ? 'ok' : 'down'}
      </span>
      {advisoryCount > 0 && (
        <>
          <span className="text-zinc-500">·</span>
          <span className="text-blue-400">{advisoryCount} advisory</span>
        </>
      )}
    </div>
  );
}
