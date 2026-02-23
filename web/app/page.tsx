import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col justify-center items-center">
      <section className="py-32 text-center">
        <div className="mb-8 text-7xl">🦞</div>
        <h1 className="text-5xl font-bold mb-6">Deploy OpenClaw in 60 Seconds</h1>
        <p className="text-lg text-gray-400 mb-10">Start building your agent instantly.</p>
        <Link
          href="/signup"
          className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:from-blue-700 hover:to-purple-700 transition-colors mb-6"
        >
          Get Early Access
        </Link>
        <div className="mt-2">
          <span className="text-gray-400">Already have an invite code? </span>
          <Link href="/signup" className="text-blue-400 underline hover:text-blue-600">Sign up here</Link>
        </div>
      </section>
    </main>
  )
}
