export default function PrivacyPage() {
  return (
    <main className="min-h-screen px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-2xl border border-gray-800 bg-gray-900 p-8">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Effective date: February 19, 2026</p>

        <div className="space-y-6 text-gray-300">
          <section>
            <h2 className="text-xl font-semibold mb-2">1. Data we process</h2>
            <p>
              We process account, billing, deployment metadata, and operational logs required to run your hosted OpenClaw instances.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">2. AI provider credentials</h2>
            <p>
              Your model provider keys are used to configure your instance and power your requests. Handle and rotate keys as needed.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">3. Payments</h2>
            <p>
              Payment information is handled by Stripe. We do not store full card details on our servers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">4. Retention and deletion</h2>
            <p>
              Operational data is retained only as needed for service reliability, troubleshooting, and compliance obligations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">5. Contact</h2>
            <p>For privacy requests, contact support through your dashboard channel.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
