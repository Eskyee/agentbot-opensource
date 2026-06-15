// Pure black during route transitions — no spinner, no text, no flash.
// Content appears only when it's ready.
export default function DashboardLoading() {
  return <div className="min-h-screen bg-black" aria-busy="true" />
}
