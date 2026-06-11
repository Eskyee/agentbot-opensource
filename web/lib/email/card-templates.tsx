import { buildAppUrl } from '@/app/lib/app-url'
import {
  Container,
  Heading,
  Text,
  Button,
  Hr,
  Row,
  Column,
  Section,
} from 'react-email'

const BRAND = {
  name: 'Agentbot',
  from: 'Agentbot <noreply@agentbot.sh>',
  logo: '🦞',
  url: 'https://agentbot.sh',
  support: 'rbasefm@icloud.com',
  discord: 'https://discord.gg/n5zvYRnCDF',
}

// ─── Card Email Wrapper ─────────────────────────────────────────────────────
function CardEmail({ children }: { children: React.ReactNode }) {
  return (
    <Container style={{ backgroundColor: '#0a0a0a', border: '1px solid #1a1a1a', padding: '0', maxWidth: '600px', margin: '0 auto' }}>
      <Section style={{ padding: '32px 40px 0', borderBottom: '1px solid #1a1a1a' }}>
        <Text style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#ffffff', margin: 0, paddingBottom: '24px' }}>
          {BRAND.logo} AGENTBOT
        </Text>
      </Section>
      <Section style={{ padding: '40px' }}>
        {children}
      </Section>
      <Section style={{ padding: '24px 40px', borderTop: '1px solid #1a1a1a' }}>
        <Text style={{ margin: 0, fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          <a href={BRAND.url} style={{ color: '#555', textDecoration: 'none' }}>agentbot.sh</a>
          {' · '}
          <a href={BRAND.discord} style={{ color: '#555', textDecoration: 'none' }}>Discord</a>
          {' · '}
          <a href={buildAppUrl('/blog')} style={{ color: '#555', textDecoration: 'none' }}>Blog</a>
        </Text>
      </Section>
    </Container>
  )
}

// ─── Welcome Card ───────────────────────────────────────────────────────────
export function WelcomeCard({ name }: { name: string }) {
  return (
    <CardEmail>
      <Heading style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff', margin: '0 0 16px' }}>
        Welcome to Agentbot
      </Heading>
      <Text style={{ fontSize: '15px', lineHeight: 1.7, color: '#cccccc', margin: '0 0 24px' }}>
        Hey {name}, your agent is live and ready to work. While you're reading this, it's already running 24/7.
      </Text>
      <Section style={{ backgroundColor: '#111111', border: '1px solid #222222', padding: '20px', marginBottom: '24px' }}>
        <Row>
          <Column>
            <Text style={{ fontSize: '11px', color: '#666666', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>Status</Text>
            <Text style={{ fontSize: '14px', color: '#22c55e', fontWeight: 700, margin: 0 }}>Running</Text>
          </Column>
          <Column>
            <Text style={{ fontSize: '11px', color: '#666666', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>Plan</Text>
            <Text style={{ fontSize: '14px', color: '#ffffff', fontWeight: 700, margin: 0 }}>Active</Text>
          </Column>
          <Column>
            <Text style={{ fontSize: '11px', color: '#666666', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>Uptime</Text>
            <Text style={{ fontSize: '14px', color: '#22c55e', fontWeight: 700, margin: 0 }}>24/7</Text>
          </Column>
        </Row>
      </Section>
      <Text style={{ fontSize: '15px', lineHeight: 1.7, color: '#cccccc', margin: '0 0 8px' }}>
        <strong style={{ color: '#ffffff' }}>Give your agent one real task</strong> — something you do manually today.
      </Text>
      <Button href={buildAppUrl('/dashboard')} style={{ backgroundColor: '#ffffff', color: '#000000', padding: '14px 28px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', textDecoration: 'none', display: 'inline-block' }}>
        Open Dashboard
      </Button>
    </CardEmail>
  )
}

// ─── Agent Deployed Card ────────────────────────────────────────────────────
export function AgentDeployedCard({ name, plan, agentUrl }: { name: string; plan: string; agentUrl: string }) {
  return (
    <CardEmail>
      <Heading style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff', margin: '0 0 16px' }}>
        Your {plan} agent is live
      </Heading>
      <Text style={{ fontSize: '15px', lineHeight: 1.7, color: '#cccccc', margin: '0 0 24px' }}>
        Hey {name}, your <strong style={{ color: '#ffffff' }}>{plan}</strong> agent just finished deploying.
      </Text>
      <Section style={{ backgroundColor: '#111111', border: '1px solid #222222', padding: '20px', marginBottom: '24px' }}>
        <Row>
          <Column>
            <Text style={{ fontSize: '11px', color: '#666666', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>Status</Text>
            <Text style={{ fontSize: '14px', color: '#22c55e', fontWeight: 700, margin: 0 }}>Running</Text>
          </Column>
          <Column>
            <Text style={{ fontSize: '11px', color: '#666666', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>Plan</Text>
            <Text style={{ fontSize: '14px', color: '#ffffff', textTransform: 'capitalize', fontWeight: 700, margin: 0 }}>{plan}</Text>
          </Column>
        </Row>
        <Text style={{ fontSize: '11px', color: '#666666', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '16px 0 4px' }}>URL</Text>
        <a href={agentUrl} style={{ color: '#8b5cf6', textDecoration: 'none', fontSize: '13px', wordBreak: 'break-all' }}>{agentUrl}</a>
      </Section>
      <Button href={buildAppUrl('/dashboard')} style={{ backgroundColor: '#ffffff', color: '#000000', padding: '14px 28px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', textDecoration: 'none', display: 'inline-block' }}>
        Open Dashboard
      </Button>
    </CardEmail>
  )
}

// ─── Plan Upgraded Card ─────────────────────────────────────────────────────
export function PlanUpgradedCard({ name, oldPlan, newPlan }: { name: string; oldPlan: string; newPlan: string }) {
  return (
    <CardEmail>
      <Heading style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff', margin: '0 0 16px' }}>
        Upgraded to {newPlan}
      </Heading>
      <Text style={{ fontSize: '15px', lineHeight: 1.7, color: '#cccccc', margin: '0 0 24px' }}>
        Hey {name}, your plan has been upgraded. Your agent container is being resized now.
      </Text>
      <Section style={{ backgroundColor: '#111111', border: '1px solid #222222', padding: '20px', marginBottom: '24px', textAlign: 'center' }}>
        <Text style={{ fontSize: '14px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
          {oldPlan}
          <span style={{ fontSize: '18px', color: '#ffffff', margin: '0 16px' }}>→</span>
          <span style={{ color: '#22c55e', fontWeight: 700 }}>{newPlan}</span>
        </Text>
      </Section>
      <Button href={buildAppUrl('/dashboard')} style={{ backgroundColor: '#ffffff', color: '#000000', padding: '14px 28px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', textDecoration: 'none', display: 'inline-block' }}>
        View Dashboard
      </Button>
    </CardEmail>
  )
}

// ─── Weekly Digest Card ─────────────────────────────────────────────────────
export function WeeklyDigestCard({ name, stats }: { name: string; stats: { messagesProcessed: number; tasksCompleted: number; uptime: string } }) {
  return (
    <CardEmail>
      <Heading style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff', margin: '0 0 16px' }}>
        Your agent this week
      </Heading>
      <Text style={{ fontSize: '15px', lineHeight: 1.7, color: '#cccccc', margin: '0 0 24px' }}>
        Hey {name}, here's what your agent did this week:
      </Text>
      <Section style={{ backgroundColor: '#111111', border: '1px solid #222222', padding: '20px', marginBottom: '24px' }}>
        <Row>
          <Column style={{ textAlign: 'center', paddingRight: '12px', borderRight: '1px solid #222222' }}>
            <Text style={{ fontSize: '28px', fontWeight: 700, color: '#ffffff', margin: 0 }}>{stats.messagesProcessed}</Text>
            <Text style={{ fontSize: '11px', color: '#666666', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '4px 0 0' }}>Messages</Text>
          </Column>
          <Column style={{ textAlign: 'center', padding: '0 12px', borderRight: '1px solid #222222' }}>
            <Text style={{ fontSize: '28px', fontWeight: 700, color: '#ffffff', margin: 0 }}>{stats.tasksCompleted}</Text>
            <Text style={{ fontSize: '11px', color: '#666666', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '4px 0 0' }}>Tasks Done</Text>
          </Column>
          <Column style={{ textAlign: 'center', paddingLeft: '12px' }}>
            <Text style={{ fontSize: '28px', fontWeight: 700, color: '#22c55e', margin: 0 }}>{stats.uptime}</Text>
            <Text style={{ fontSize: '11px', color: '#666666', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '4px 0 0' }}>Uptime</Text>
          </Column>
        </Row>
      </Section>
      <Button href={buildAppUrl('/dashboard')} style={{ backgroundColor: '#ffffff', color: '#000000', padding: '14px 28px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', textDecoration: 'none', display: 'inline-block' }}>
        View Full Dashboard
      </Button>
    </CardEmail>
  )
}

// ─── Payment Receipt Card ───────────────────────────────────────────────────
export function PaymentReceiptCard({ amount, plan }: { amount: number; plan: string }) {
  return (
    <CardEmail>
      <Heading style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff', margin: '0 0 16px' }}>
        Payment Confirmed
      </Heading>
      <Text style={{ fontSize: '15px', lineHeight: 1.7, color: '#cccccc', margin: '0 0 24px' }}>
        Payment received for your {plan} plan.
      </Text>
      <Section style={{ backgroundColor: '#111111', border: '1px solid #222222', padding: '20px', marginBottom: '24px' }}>
        <Row>
          <Column>
            <Text style={{ fontSize: '11px', color: '#666666', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>Amount</Text>
            <Text style={{ fontSize: '14px', color: '#ffffff', fontWeight: 700, margin: 0 }}>£{(amount / 100).toFixed(2)}</Text>
          </Column>
          <Column>
            <Text style={{ fontSize: '11px', color: '#666666', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>Plan</Text>
            <Text style={{ fontSize: '14px', color: '#ffffff', textTransform: 'capitalize', fontWeight: 700, margin: 0 }}>{plan}</Text>
          </Column>
          <Column>
            <Text style={{ fontSize: '11px', color: '#666666', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>Status</Text>
            <Text style={{ fontSize: '14px', color: '#22c55e', fontWeight: 700, margin: 0 }}>Active</Text>
          </Column>
        </Row>
      </Section>
    </CardEmail>
  )
}

export { BRAND, CardEmail }
