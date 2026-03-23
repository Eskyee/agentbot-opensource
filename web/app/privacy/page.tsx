import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Agentbot',
  description: 'Agentbot privacy policy — how we collect, use, and protect your data.',
};

export default function PrivacyPage() {
  return (
    <section className="min-h-screen px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-zinc-500 mb-8">Effective date: February 19, 2026</p>

        <div className="space-y-6 text-zinc-300">
          <section>
            <h2 className="text-xl font-semibold mb-2">1. Data we process</h2>
            <p>
              We process account, billing, deployment metadata, and operational logs required to run your hosted OpenClaw instances.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">2. Google user data</h2>
            <p>
              When you sign in with Google or connect Google services to Agentbot, we may access the following Google user data:
            </p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Your Google account profile information (name, email address, profile picture) for authentication and account creation.</li>
              <li>Google API tokens and refresh tokens to maintain persistent access to connected services on your behalf.</li>
              <li>Data from Google services you explicitly connect (e.g. Gmail, Calendar, Drive) as required for the agent features you activate.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">3. How we use Google user data</h2>
            <p>
              Google user data is used exclusively to:
            </p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Authenticate your account and maintain your session.</li>
              <li>Provide, maintain, and improve the Agentbot features you have enabled.</li>
              <li>Operate AI agent workflows that you configure to interact with your Google services.</li>
            </ul>
            <p className="mt-2">
              We do not use Google user data for advertising, marketing, or any purpose unrelated to providing or improving Agentbot functionality.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">4. Sharing and disclosure of Google user data</h2>
            <p>
              We do not sell Google user data. We do not share, transfer, or disclose Google user data to third parties except:
            </p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>With your explicit consent, such as when you configure an agent to send data to an external service.</li>
              <li>With AI model providers (e.g. OpenRouter, Anthropic, OpenAI) when you enable AI features that process your Google data — only the minimum data required for the requested operation.</li>
              <li>As required by law or to protect the security of our services.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">5. Data protection</h2>
            <p>
              We protect Google user data with the following mechanisms:
            </p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>All data is encrypted in transit (TLS 1.2+) and at rest.</li>
              <li>Google API tokens are stored encrypted and never exposed in logs or UI.</li>
              <li>Each user&apos;s agent instance runs in an isolated environment with scoped access.</li>
              <li>We follow the principle of least privilege — agents only access Google data you explicitly authorize.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">6. AI provider credentials</h2>
            <p>
              Your model provider keys are used to configure your instance and power your requests. Handle and rotate keys as needed.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">7. Payments</h2>
            <p>
              Payment information is handled by Stripe. We do not store full card details on our servers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">8. Retention and deletion</h2>
            <p>
              Google user data is retained only as long as your account is active or as needed to provide our services. You may request deletion of your data at any time through your dashboard or by contacting support. Upon account deletion, all associated Google tokens and data are permanently removed within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">9. Contact</h2>
            <p>For privacy requests, contact support through your dashboard channel.</p>
          </section>
        </div>
      </div>
    </section>
  );
}
