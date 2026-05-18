import { Spinner } from 'geist/components'

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center font-mono">
      <div className="mb-4">
        <Spinner size={48} />
      </div>
      <p className="animate-pulse uppercase tracking-[0.2em] text-[10px] text-zinc-500">Loading Dashboard...</p>
    </div>
  )
}
