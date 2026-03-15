/**
 * Mock API Server for Test Suite
 * Provides stubbed responses for provision, Mux, and stream endpoints
 * Usage: node test-mock-server.js
 */

const http = require('http');
const url = require('url');

const PORT = 3000;
let requestCount = 0;

// Store test agents created during test run
const agents = new Map();
const streams = new Map();

function generateId() {
  // Generate string like 'abc123def456' (12+ chars)
  return (Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2)).substring(0, 12);
}

function generateStreamKey() {
  // Format: sk-XXXX-XXXX-XXXX (alphanumeric + hyphens only)
  const part1 = Math.random().toString(36).substring(2, 6);
  const part2 = Math.random().toString(36).substring(2, 6);
  const part3 = Math.random().toString(36).substring(2, 6);
  return `sk-${part1}-${part2}-${part3}`;
}

function generateSubdomain() {
  return `dj-${generateId().substring(0, 8)}.agentbot.raveculture.xyz`;
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;
  
  requestCount++;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check
  if (pathname === '/health' || pathname === '/api/health') {
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    return;
  }

  // GET /api/agents/:id - Fetch agent
  if (pathname.startsWith('/api/agents/') && method === 'GET') {
    const agentId = pathname.split('/').pop();
    const agent = agents.get(agentId);
    if (agent) {
      res.writeHead(200);
      res.end(JSON.stringify(agent));
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Agent not found' }));
    }
    return;
  }

  // POST /api/provision - Create new agent
  if (pathname === '/api/provision' && method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        console.log(`[${requestCount}] POST /api/provision:`, JSON.stringify(payload));

        // Validation - accepts both snake_case and camelCase
        const hasChannel = payload.telegram_token || payload.telegramToken || 
                          payload.discord_token || payload.discordToken ||
                          payload.discord_bot_token || payload.discordBotToken ||
                          payload.whatsapp_token || payload.whatsappToken;

        if (!hasChannel) {
          console.log(`  ❌ No channel token found`);
          res.writeHead(400);
          res.end(JSON.stringify({ 
            success: false,
            error: 'At least one channel token required (telegramToken, discordBotToken, or whatsappToken)' 
          }));
          return;
        }

        const userId = generateId();
        const streamId = generateId();
        const streamKey = generateStreamKey();
        const playbackId = generateId();
        const subdomain = generateSubdomain();

        // Response format expected by tests
        const response = {
          success: true,
          userId: userId,
          agentId: userId,
          id: userId,
          telegram_token: payload.telegram_token || payload.telegramToken,
          discord_token: payload.discord_token || payload.discordToken || payload.discordBotToken,
          whatsapp_token: payload.whatsapp_token || payload.whatsappToken,
          ai_provider: payload.ai_provider || payload.aiProvider || 'ollama',
          aiProvider: payload.ai_provider || payload.aiProvider || 'ollama',
          plan: payload.plan || 'free',
          stream_id: streamId,
          stream_key: streamKey,
          streamKey: streamKey,
          liveStreamId: playbackId,
          rtmp_server: 'rtmps://live.mux.com/app',
          hls_playback_id: playbackId,
          subdomain: subdomain,
          url: `https://${subdomain}`,
          created_at: new Date().toISOString(),
          status: 'active'
        };

        agents.set(userId, response);
        streams.set(streamId, { userId, streamKey, playbackId, status: 'ready' });

        console.log(`  ✅ Created agent: ${userId}`);
        res.writeHead(200);
        res.end(JSON.stringify(response));
      } catch (err) {
        console.error(`[${requestCount}] Parse error:`, err.message);
        res.writeHead(400);
        res.end(JSON.stringify({ 
          success: false,
          error: 'Invalid JSON: ' + err.message
        }));
      }
    });
    return;
  }

  // GET /api/streams/:id/health - Stream health check
  if (pathname.startsWith('/api/streams/') && pathname.endsWith('/health') && method === 'GET') {
    const streamId = pathname.split('/')[3];
    const stream = streams.get(streamId);
    if (stream) {
      res.writeHead(200);
      res.end(JSON.stringify({
        stream_id: streamId,
        status: 'healthy',
        uptime: 3600,
        bitrate: 5000,
        fps: 30,
        resolution: '1920x1080'
      }));
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Stream not found' }));
    }
    return;
  }

  // 404
  console.log(`[${requestCount}] 404: ${method} ${pathname}`);
  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`\n🎬 Test Mock Server running on http://localhost:${PORT}`);
  console.log('   Endpoints:');
  console.log('   - POST   /api/provision      (create agent)');
  console.log('   - GET    /api/agents/:id     (fetch agent)');
  console.log('   - GET    /api/streams/:id/health (stream status)');
  console.log('   - GET    /health             (health check)');
  console.log('\nPress Ctrl+C to stop\n');
});

process.on('SIGINT', () => {
  console.log('\n\n🛑 Mock server stopped');
  process.exit(0);
});
