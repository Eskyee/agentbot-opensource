
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3001'

// SSRF validation helper
const getAllowedAgentDomains = () => {
  // Comma-separated list of allowed domains, e.g. "mydomain.com,another.com"
  const env = process.env.ALLOWED_AGENT_DOMAINS;
  if (!env && process.env.NODE_ENV === 'production') {
    throw new Error('ALLOWED_AGENT_DOMAINS must be set in production');
  }
  return env ? env.split(',').map(d => d.trim()).filter(Boolean) : [];
};

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildAllowedHostPatterns() {
  const domains = getAllowedAgentDomains();
  const patterns = [
    /^([a-zA-Z0-9-]+\.)?localhost$/
  ];
  for (const domain of domains) {
    // Allow subdomains and root
    patterns.push(new RegExp(`^([a-zA-Z0-9-]+\.)?${escapeRegex(domain)}$`));
  }
  return patterns;
}

function isIPv6LinkLocal(ip: string) {
  // fe80::/10 covers fe80:0000:0000:0000:... to febf:ffff:ffff:ffff:...
  return /^fe8[0-9a-f]:|^fe9[0-9a-f]:|^fea[0-9a-f]:|^feb[0-9a-f]:/i.test(ip);
}

function isPrivateIp(ip: string) {
  // IPv4
  if (/^(10\.|127\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(ip)) return true;
  // IPv4 link-local 169.254.0.0/16
  if (ip.startsWith('169.254.')) return true;
  // IPv6 loopback
  if (ip === '::1') return true;
  // IPv6 link-local
  if (isIPv6LinkLocal(ip)) return true;
  return false;
}

async function validateAgentUrl(url: string): Promise<{ valid: boolean; error?: string }> {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return { valid: false, error: 'Invalid agent URL' };
  }
  const allowedHostPatterns = buildAllowedHostPatterns();
  const isAllowedHost = allowedHostPatterns.some((re) => re.test(parsedUrl.hostname));
  if (isAllowedHost) {
    // Allow all localhost and explicitly allowed domains, skip IP check
    return { valid: true };
  }
  // For other hosts, resolve and check IP
  try {
    const dns = await import('node:dns/promises');
    const addresses = await dns.lookup(parsedUrl.hostname, { all: true });
    const isPrivate = addresses.some(addr => isPrivateIp(addr.address));
    if (isPrivate) {
      return { valid: false, error: 'Agent host resolves to private/internal IP' };
    }
  } catch {
    return { valid: false, error: 'Could not resolve agent host' };
  }
  return { valid: true };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, message, conversationHistory = [] } = body

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Get the user's instance to find their OpenClaw agent
    const instanceRes = await fetch(`${BACKEND_API_URL}/api/instance/${userId || session.user.id}`)
    if (!instanceRes.ok) {
      return NextResponse.json({ error: 'Instance not found' }, { status: 404 })
    }

    const instanceData = await instanceRes.json()

    // Forward the message to the OpenClaw agent
    // The agent should have an HTTP endpoint for chat
    let agentUrl = instanceData.url || `http://${instanceData.subdomain}.localhost:3000`;
    // SSRF protection: validate agentUrl
    const validation = await validateAgentUrl(agentUrl);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error || 'Invalid agent URL' }, { status: 400 });
    }
    try {
      const chatRes = await fetch(`${agentUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversationHistory,
          userId: session.user.id,
          source: 'web',
        }),
      })

      if (!chatRes.ok) {
        // If the agent doesn't have a chat endpoint, return a placeholder response with a 502 error status
        return NextResponse.json({
          response: "I'm your OpenClaw agent. I'm currently running but the web chat interface is still being connected. Please chat with me via Telegram for now!",
          status: 'partial',
        }, { status: 502 })
      }

      const chatData = await chatRes.json()
      return NextResponse.json({
        response: chatData.response || chatData.message || 'No response from agent',
        status: 'success',
      })
    } catch (agentError) {
      // Agent might not be reachable via HTTP, return helpful message
      console.error('Agent chat error:', agentError)
      return NextResponse.json({
        response: `I'm your OpenClaw agent (${instanceData.botUsername || 'agent'}). I'm running but the direct web chat is being set up. You can chat with me on Telegram!`,
        status: 'partial',
        telegramLink: instanceData.botUsername ? `https://t.me/${instanceData.botUsername}` : null,
      })
    }
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || session.user.id

    // Get conversation history from the agent
    const instanceRes = await fetch(`${BACKEND_API_URL}/api/instance/${userId}`)
    if (!instanceRes.ok) {
      return NextResponse.json({ conversations: [] })
    }

    const instanceData = await instanceRes.json()
    let agentUrl = instanceData.url || `http://${instanceData.subdomain}.localhost:3000`;
    // SSRF protection: validate agentUrl
    const validation = await validateAgentUrl(agentUrl);
    if (!validation.valid) {
      return NextResponse.json({ conversations: [] });
    }
    try {
      const historyRes = await fetch(`${agentUrl}/api/chat/history?userId=${session.user.id}`)
      if (historyRes.ok) {
        const historyData = await historyRes.json()
        return NextResponse.json({ conversations: historyData.conversations || [] })
      }
    } catch (err) {
      // Agent doesn't support history endpoint or failed to fetch history
      console.error("Agent doesn't support history endpoint or failed to fetch history:", err);
    }

    return NextResponse.json({ conversations: [] })
  } catch (error) {
    console.error('Chat history error:', error)
    return NextResponse.json({ conversations: [] })
  }
}
