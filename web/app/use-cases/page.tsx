import { Metadata } from 'next';
import { UseCases, Pillars } from '@/app/components/landing';
import { PageHero } from '@/app/components/PageHero';

export const metadata: Metadata = {
  title: 'Use Cases — Agentbot',
  description:
    'Agentbot works across every industry — music, creative agencies, crypto communities, e-commerce, creator studios, and solo founders. Your 24/7 autonomous agent.',
};

export default function UseCasesPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <PageHero
        label="Use Cases"
        title="Built for Every"
        highlight="Kind of Operator"
        description="From solo creators to label crews — Agentbot adapts to your workflow. Music, crypto, e-commerce, agencies, studios. Your agent handles it."
        gradient="purple"
      />
      <Pillars
        eyebrow="One agent, every vertical"
        pillars={[
          {
            index: '01',
            title: 'One runtime, any vertical',
            body: 'The same agent adapts to music, agencies, crypto and commerce — no rebuild per use case.',
          },
          {
            index: '02',
            title: 'It learns your operation',
            body: 'Memory and skills shape to your workflow, your voice and your rules over time.',
          },
          {
            index: '03',
            title: "Works while you don't",
            body: 'Runs 24/7 on its own server. It wakes before you, handles the routine, and briefs you on what matters.',
          },
        ]}
      />
      <UseCases />
    </main>
  );
}
