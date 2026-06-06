export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center font-mono">
      <div className="relative">
        <div className="w-12 h-12 border-2 border-zinc-800 border-t-orange-500 rounded-full animate-spin" />
      </div>
      <p className="mt-6 text-[10px] uppercase tracking-[0.3em] text-zinc-600">Initializing</p>
    </div>
  )
}
