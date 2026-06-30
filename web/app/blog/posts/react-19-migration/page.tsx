import Link from 'next/link';

export const metadata = {
  title: 'React 19 Migration — Agentbot',
  description: 'How we migrated Agentbot from React 18 to React 19 in one session.',
};

export default function React19MigrationPost() {
  return (
    <main className="min-h-screen bg-black text-white">
      <article className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-8">
          <Link href="/blog" className="text-xs text-zinc-500 hover:text-white transition-colors">
            ← Back to Blog
          </Link>
        </div>

        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs px-2 py-1 bg-orange-500/10 text-orange-500 rounded">Engineering</span>
            <span className="text-xs text-zinc-500">June 16, 2026</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">
            React 19 Migration
          </h1>
          <p className="text-lg text-zinc-400">
            How we migrated Agentbot from React 18 to React 19 in one session.
          </p>
        </header>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-bold mb-4">Why React 19?</h2>
            <p className="text-zinc-300 leading-relaxed">
              React 19 brings performance improvements, better TypeScript support, and is required for json-render integration.
              The migration was straightforward — only 6 TypeScript errors to fix.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">What Changed</h2>
            <ul className="text-zinc-300 space-y-2 list-disc list-inside">
              <li><code className="text-orange-500">useRef()</code> now requires an argument</li>
              <li><code className="text-orange-500">RefObject&lt;T&gt;</code> includes <code className="text-orange-500">| null</code></li>
              <li>Some third-party APIs changed signatures</li>
              <li>ESLint 9 needs flat config format</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">The Result</h2>
            <p className="text-zinc-300 leading-relaxed">
              Migration completed in one session. Zero deprecated APIs in codebase. All tests pass. Performance improved.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
