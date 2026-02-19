export default function TermsPage() {
  return (
    <main className="min-h-screen px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-2xl border border-gray-800 bg-gray-900 p-8">
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8">Effective date: February 19, 2026</p>

        <div className="space-y-6 text-gray-300">
          <section>
            <h2 className="text-xl font-semibold mb-2">1. Service scope</h2>
            <p>
              OpenClaw Deploy provides hosted infrastructure to deploy and run AI assistants. You are responsible for your prompts,
              integrations, and API usage.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">2. Accounts and billing</h2>
            <p>
              Paid plans are billed in advance via Stripe. Subscriptions renew automatically unless canceled before the next billing cycle.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">3. Acceptable use</h2>
            <p>
              You must not use the service for unlawful activity, abuse, spam, malware distribution, or attempts to compromise systems.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">4. Data and availability</h2>
            <p>
              We aim for high availability but do not guarantee uninterrupted service. You remain responsible for backing up critical data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">5. Contact</h2>
            <p>For legal or billing inquiries, contact support through your dashboard channel.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
