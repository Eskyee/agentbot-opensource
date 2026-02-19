import Link from 'next/link';

export default function BlogPage() {
  return (
    <main className="min-h-screen px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Blog</h1>
        <p className="text-gray-400 mb-10">
          Product updates, deployment tips, and guides for running OpenClaw agents in production.
        </p>

        <div className="space-y-4">
          <article className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
            <p className="text-xs text-gray-500 mb-2">February 2026</p>
            <h2 className="text-2xl font-semibold mb-2">Welcome to OpenClaw Deploy</h2>
            <p className="text-gray-300 mb-4">
              We built this platform to remove server setup friction and help builders launch AI agents in under a minute.
            </p>
            <Link href="/signup" className="text-lobster-400 hover:underline">
              Create your first agent →
            </Link>
          </article>
        </div>
      </div>
    </main>
  );
}
