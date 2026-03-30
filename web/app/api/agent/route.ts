import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/app/lib/getAuthSession'
import crypto from 'crypto';
import { getBackendApiUrl } from '@/app/api/lib/api-keys';

const API_VERSION = '1.0.0';
const AGENTBOT_VERSION = '2026.3.1';

// Force dynamic — uses getServerSession at runtime
export const dynamic = 'force-dynamic';

// NOTE: In-memory session storage — state is lost on Vercel cold starts.
// For production, persist session metadata to the database via Prisma.
// This is acceptable for ephemeral chat sessions but should not be relied upon
// for long-lived state. Consider migrating to Redis or Prisma-backed sessions
// if persistence across cold starts is required.
const sessions = new Map<string, {
  id: string;
  userId: string;
  status: 'active' | 'idle' | 'completed';
  messages: { role: 'user' | 'assistant'; content: string; timestamp: number }[];
  createdAt: number;
  lastActivity: number;
}>();

const agentInstances = new Map<string, {
  userId: string;
  status: 'running' | 'stopped' | 'error';
  model: string;
  memory: number;
  lastSeen: number;
  channels: string[];
  skills: string[];
  credentials: { [key: string]: boolean };
}>();

export async function GET(request: NextRequest) {
  const authSession = await getAuthSession();
  if (!authSession?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  // Always use authenticated user id — never trust caller-supplied userId
  const userId = authSession.user.id;
  const sessionId = searchParams.get('sessionId');

  if (action === 'health') {
    const instance = agentInstances.get(userId || '');
    return NextResponse.json({
      status: instance?.status || 'unknown',
      version: AGENTBOT_VERSION,
      apiVersion: API_VERSION,
      uptime: Math.floor(Date.now() / 1000) - 1700000000,
      model: instance?.model || 'claude-sonnet-4-20250514',
      channels: instance?.channels || ['telegram'],
      skills: instance?.skills || [],
      lastSeen: instance?.lastSeen || null
    });
  }

  if (action === 'sessions' && userId) {
    const userSessions = Array.from(sessions.values())
      .filter(s => s.userId === userId)
      .map(s => ({
        id: s.id,
        status: s.status,
        messageCount: s.messages.length,
        createdAt: s.createdAt,
        lastActivity: s.lastActivity
      }));
    return NextResponse.json({ sessions: userSessions });
  }

  if (action === 'session' && sessionId) {
    const session = sessions.get(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    return NextResponse.json({ session });
  }

  if (action === 'memory' && userId) {
    const session = Array.from(sessions.values()).find(s => s.userId === userId && s.status === 'active');
    if (!session) {
      return NextResponse.json({ memory: [] });
    }
    return NextResponse.json({
      memory: session.messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content.substring(0, 100)
      }))
    });
  }

  if (action === 'skills') {
    return NextResponse.json({
      skills: [
        { id: 'browser', name: 'Browser', description: 'Browse websites, fill forms', enabled: true },
        { id: 'exec', name: 'Terminal', description: 'Run shell commands', enabled: true },
        { id: 'memory', name: 'Memory', description: 'Remember conversations', enabled: true },
        { id: 'calendar', name: 'Calendar', description: 'Schedule events', enabled: true },
        { id: 'email', name: 'Email', description: 'Send and receive emails', enabled: true },
        { id: 'webhook', name: 'Webhooks', description: 'HTTP requests', enabled: true },
        { id: 'dj-streaming', name: 'DJ Streaming', description: 'Live stream DJ sets', enabled: true },
        { id: 'guestlist', name: 'Guestlist', description: 'Event management', enabled: true },
        { id: 'usdc-payments', name: 'USDC Payments', description: 'Accept crypto payments', enabled: true },
        { id: 'treasury', name: 'Treasury', description: 'Manage community funds', enabled: true },
      ]
    });
  }

  if (action === 'credentials') {
    const instance = agentInstances.get(userId || '');
    return NextResponse.json({
      credentials: instance?.credentials || {
        anthropic: false,
        openai: false,
        openrouter: true,
        google: false,
        telegram: true,
        discord: false,
        whatsapp: false
      }
    });
  }

  return NextResponse.json({
    apiVersion: API_VERSION,
    agentbotVersion: AGENTBOT_VERSION,
    endpoints: {
      'GET /api/agent': 'List endpoints',
      'GET /api/agent?action=health': 'Health status',
      'GET /api/agent?action=sessions': 'List sessions',
      'GET /api/agent?action=session&id=xxx': 'Get session details',
      'GET /api/agent?action=memory': 'Get agent memory',
      'GET /api/agent?action=skills': 'List available skills',
      'GET /api/agent?action=credentials': 'List configured credentials',
      'POST /api/agent': 'Send message to agent',
      'POST /api/agent?action=create-session': 'Create new session',
      'POST /api/agent?action=update-skill': 'Enable/disable skill',
    }
  });
}

export async function POST(request: NextRequest) {
  const authSession = await getAuthSession();
  if (!authSession?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, message, sessionId, skillId, enabled, key, value } = body;
    // Always bind userId to verified session — never from request body
    const userId = authSession.user.id;

    if (action === 'chat' || !action) {
      if (!userId || !message) {
        return NextResponse.json({ error: 'userId and message required' }, { status: 400 });
      }

      let session = sessionId ? sessions.get(sessionId) : 
        Array.from(sessions.values()).find(s => s.userId === userId && s.status === 'active');

      if (!session) {
        const newSessionId = 'sess_' + crypto.randomUUID().replace(/-/g, '').substring(0, 16);
        session = {
          id: newSessionId,
          userId,
          status: 'active',
          messages: [],
          createdAt: Date.now(),
          lastActivity: Date.now()
        };
        sessions.set(newSessionId, session);
      }

      session.messages.push({
        role: 'user',
        content: message,
        timestamp: Date.now()
      });

      const response = await fetch(`${getBackendApiUrl()}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, userId, sessionId: session.id })
      });

      const data = await response.json();
      
      session.messages.push({
        role: 'assistant',
        content: data.reply || 'Agent response',
        timestamp: Date.now()
      });
      session.lastActivity = Date.now();

      return NextResponse.json({
        sessionId: session.id,
        reply: data.reply || 'Agent is processing your request...',
        timestamp: Date.now()
      });
    }

    if (action === 'create-session') {
      if (!userId) {
        return NextResponse.json({ error: 'userId required' }, { status: 400 });
      }

      const newSessionId = 'sess_' + crypto.randomUUID().replace(/-/g, '').substring(0, 16);
      const session = {
        id: newSessionId,
        userId,
        status: 'active' as const,
        messages: [],
        createdAt: Date.now(),
        lastActivity: Date.now()
      };
      sessions.set(newSessionId, session);

      return NextResponse.json({
        sessionId: newSessionId,
        status: 'active'
      });
    }

    if (action === 'update-skill') {
      if (!userId || !skillId) {
        return NextResponse.json({ error: 'userId and skillId required' }, { status: 400 });
      }

      let instance = agentInstances.get(userId);
      if (!instance) {
        instance = {
          userId,
          status: 'running',
          model: 'claude-sonnet-4-20250514',
          memory: 0,
          lastSeen: Date.now(),
          channels: ['telegram'],
          skills: [],
          credentials: {}
        };
        agentInstances.set(userId, instance);
      }

      if (enabled && !instance.skills.includes(skillId)) {
        instance.skills.push(skillId);
      } else if (!enabled) {
        instance.skills = instance.skills.filter(s => s !== skillId);
      }

      return NextResponse.json({
        success: true,
        skillId,
        enabled
      });
    }

    if (action === 'set-credential') {
      if (!userId || !key) {
        return NextResponse.json({ error: 'userId and key required' }, { status: 400 });
      }

      let instance = agentInstances.get(userId);
      if (!instance) {
        instance = {
          userId,
          status: 'running',
          model: 'claude-sonnet-4-20250514',
          memory: 0,
          lastSeen: Date.now(),
          channels: ['telegram'],
          skills: [],
          credentials: {}
        };
        agentInstances.set(userId, instance);
      }

      instance.credentials[key] = !!value;

      return NextResponse.json({
        success: true,
        key,
        configured: !!value
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Agent API error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
