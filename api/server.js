/**
 * 2OpenClaw Provisioning API
 * Handles creating, managing, and monitoring OpenClaw containers
 * 
 * IMPORTANT: This API creates OpenClaw instances with the correct config format.
 * See /docs/LESSONS_LEARNED.md for details on the config schema.
 */

const express = require('express');
const { exec, spawn } = require('child_process');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

const app = express();
app.use(express.json());

// Config
const PORT = process.env.PORT || 3000;
const API_SECRET = process.env.API_SECRET || 'change-me-in-production';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const DATA_DIR = '/opt/agentbot/data';
const CADDY_FILE = '/etc/caddy/Caddyfile';
const BASE_PORT = 18001;

// Get external IP
let EXTERNAL_IP = '';
exec('curl -s ifconfig.me', (err, stdout) => {
    EXTERNAL_IP = stdout.trim();
    console.log(`External IP: ${EXTERNAL_IP}`);
});

// Middleware: Auth check
const authMiddleware = (req, res, next) => {
    const token = req.headers['x-api-key'];
    if (token !== API_SECRET) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

// Helper: Run shell command
const runCommand = (cmd) => {
    return new Promise((resolve, reject) => {
        exec(cmd, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
            if (error) {
                reject({ error: error.message, stderr });
            } else {
                resolve({ stdout, stderr });
            }
        });
    });
};

// Helper: Get next available port
const getNextPort = async () => {
    try {
        const data = await fs.readFile(path.join(DATA_DIR, 'ports.json'), 'utf8');
        const ports = JSON.parse(data);
        const maxPort = Math.max(...Object.values(ports), BASE_PORT - 1);
        return maxPort + 1;
    } catch {
        await fs.mkdir(DATA_DIR, { recursive: true });
        await fs.writeFile(path.join(DATA_DIR, 'ports.json'), '{}');
        return BASE_PORT;
    }
};

// Helper: Save port mapping
const savePort = async (userId, port) => {
    const portsFile = path.join(DATA_DIR, 'ports.json');
    let ports = {};
    try {
        const data = await fs.readFile(portsFile, 'utf8');
        ports = JSON.parse(data);
    } catch {}
    ports[userId] = port;
    await fs.writeFile(portsFile, JSON.stringify(ports, null, 2));
};

// Helper: Get user's port
const getUserPort = async (userId) => {
    try {
        const data = await fs.readFile(path.join(DATA_DIR, 'ports.json'), 'utf8');
        const ports = JSON.parse(data);
        return ports[userId];
    } catch {
        return null;
    }
};

// Helper: Add Caddy route
const addCaddyRoute = async (userId, port) => {
    const subdomain = `${userId}.${EXTERNAL_IP}.nip.io`;
    const routeBlock = `
${subdomain} {
    reverse_proxy localhost:${port}
}
`;
    
    // Append to Caddyfile
    await fs.appendFile(CADDY_FILE, routeBlock);
    
    // Reload Caddy (not restart - requires admin endpoint enabled)
    await runCommand('systemctl reload caddy');
    
    return subdomain;
};

/**
 * Create OpenClaw config with CORRECT schema
 * 
 * CRITICAL LESSONS LEARNED:
 * 1. API keys go under env.vars, NOT providers
 * 2. Telegram uses botToken, NOT token
 * 3. channels.telegram.enabled AND plugins.entries.telegram.enabled must BOTH be true
 * 4. gateway.mode must be "local"
 * 5. gateway.auth needs mode + token (object format)
 * 6. agents.defaults.model.primary (object with primary key, not string)
 * 7. Config file goes at /home/node/.openclaw/openclaw.json (root, not config subfolder)
 */
const createConfig = (telegramToken, aiProvider, apiKey, ownerIds, gatewayToken) => {
    const config = {
        env: {
            vars: {}
        },
        agents: {
            defaults: {
                model: {
                    primary: 'anthropic/claude-sonnet-4-5'  // Default to Claude
                }
            }
        },
        channels: {
            telegram: {
                enabled: true,
                botToken: telegramToken
            }
        },
        gateway: {
            mode: 'local',
            port: 18789,
            auth: {
                mode: 'token',
                token: gatewayToken || crypto.randomBytes(16).toString('hex')
            }
        },
        plugins: {
            entries: {
                telegram: {
                    enabled: true
                }
            }
        }
    };
    
    // Set AI provider API key and model
    if (aiProvider === 'gemini' || aiProvider === 'google') {
        const geminiKey = apiKey || GEMINI_API_KEY;
        if (geminiKey) {
            config.env.vars.GEMINI_API_KEY = geminiKey;
            // Gemini 2.0 Flash - fast and has 1M TPM free tier!
            config.agents.defaults.model.primary = 'google/gemini-2.0-flash';
        }
    } else if (aiProvider === 'groq') {
        const groqKey = apiKey || GROQ_API_KEY;
        if (groqKey) {
            config.env.vars.GROQ_API_KEY = groqKey;
            config.agents.defaults.model.primary = 'groq/gemma2-9b-it';
        }
    } else if (aiProvider === 'anthropic' && apiKey) {
        config.env.vars.ANTHROPIC_API_KEY = apiKey;
        config.agents.defaults.model.primary = 'anthropic/claude-sonnet-4-5';
    } else if (aiProvider === 'openai' && apiKey) {
        config.env.vars.OPENAI_API_KEY = apiKey;
        config.agents.defaults.model.primary = 'openai/gpt-4o';
    } else if (aiProvider === 'openrouter' && apiKey) {
        config.env.vars.OPENROUTER_API_KEY = apiKey;
        // Use free model - Gemini 2.0 Flash (free via OpenRouter)
        config.agents.defaults.model.primary = 'openrouter/google/gemini-2.0-flash-exp:free';
    } else if (GEMINI_API_KEY) {
        // Default: Gemini free tier (1M TPM - much better than Groq's 12K!)
        config.env.vars.GEMINI_API_KEY = GEMINI_API_KEY;
        config.agents.defaults.model.primary = 'google/gemini-2.0-flash';
    } else if (GROQ_API_KEY) {
        // Fallback to Groq
        config.env.vars.GROQ_API_KEY = GROQ_API_KEY;
        config.agents.defaults.model.primary = 'groq/gemma2-9b-it';
    }
    
    // Set owner IDs for DM allowlist
    if (ownerIds && ownerIds.length > 0) {
        config.channels.telegram.allowFrom = ownerIds.map(String);
        config.channels.telegram.dmPolicy = 'allowlist';
    }
    
    return config;
};

// ==================== ROUTES ====================

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// List all instances
app.get('/instances', authMiddleware, async (req, res) => {
    try {
        const { stdout } = await runCommand('docker ps -a --filter "name=openclaw-" --format "{{.Names}},{{.Status}},{{.Ports}}"');
        const instances = stdout.trim().split('\n').filter(Boolean).map(line => {
            const [name, status, ports] = line.split(',');
            const userId = name.replace('openclaw-', '');
            return { userId, name, status, ports };
        });
        res.json({ instances });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get instance status
app.get('/instances/:userId', authMiddleware, async (req, res) => {
    const { userId } = req.params;
    const containerName = `openclaw-${userId}`;
    
    try {
        const { stdout } = await runCommand(`docker inspect ${containerName} --format '{{.State.Status}},{{.State.StartedAt}}'`);
        const [status, startedAt] = stdout.trim().split(',');
        const port = await getUserPort(userId);
        const subdomain = port ? `${userId}.${EXTERNAL_IP}.nip.io` : null;
        
        // Try to read user data for plan info
        let plan = 'free';
        try {
            const userData = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'users', `${userId}.json`), 'utf8'));
            plan = userData.plan || 'free';
        } catch {}
        
        res.json({ userId, status, startedAt, port, subdomain, url: subdomain ? `https://${subdomain}` : null, plan });
    } catch (error) {
        res.status(404).json({ error: 'Instance not found' });
    }
});

// Provision new instance
app.post('/provision', authMiddleware, async (req, res) => {
    const { userId, telegramToken, aiProvider, apiKey, ownerIds, plan } = req.body;
    
    if (!userId || !telegramToken) {
        return res.status(400).json({ error: 'userId and telegramToken are required' });
    }
    
    const containerName = `openclaw-${userId}`;
    const dataDir = path.join(DATA_DIR, 'instances', userId);
    
    try {
        // Check if already exists
        try {
            await runCommand(`docker inspect ${containerName}`);
            return res.status(409).json({ error: 'Instance already exists' });
        } catch {}
        
        // Get next port
        const port = await getNextPort();
        
        // Set resource limits based on plan
        // Free tier needs 1280m/768MB heap minimum - OpenClaw uses ~500MB at startup
        let memory = '1280m';
        let cpus = '0.5';
        let heapSize = '768';
        if (plan === 'starter') {
            memory = '1280m';
            cpus = '0.5';
            heapSize = '768';
        } else if (plan === 'pro') {
            memory = '1536m';
            cpus = '1.0';
            heapSize = '1024';
        } else if (plan === 'power') {
            memory = '2g';
            cpus = '2.0';
            heapSize = '1536';
        }
        
        // Generate gateway token for this instance
        const gatewayToken = crypto.randomBytes(16).toString('hex');
        
        // Create config with CORRECT format
        const config = createConfig(telegramToken, aiProvider, apiKey, ownerIds, gatewayToken);
        
        // Create data directory with correct permissions
        await fs.mkdir(dataDir, { recursive: true });
        
        // Write config to the data directory
        // IMPORTANT: Config goes at openclaw.json (root level), NOT config/openclaw.json
        await fs.writeFile(
            path.join(dataDir, 'openclaw.json'), 
            JSON.stringify(config, null, 2)
        );
        
        // Set ownership to uid 1000 (node user in container)
        await runCommand(`chown -R 1000:1000 ${dataDir}`);
        await runCommand(`chmod 700 ${dataDir}`);
        
        // Start container with bind mount (NOT named volume)
        // This allows the config to be read/written properly
        await runCommand(`docker run -d \
            --name ${containerName} \
            --restart unless-stopped \
            -v ${dataDir}:/home/node/.openclaw \
            -p ${port}:18789 \
            --memory="${memory}" \
            --cpus="${cpus}" \
            -e NODE_OPTIONS="--max-old-space-size=${heapSize}" \
            ghcr.io/openclaw/openclaw:latest`);
        
        // Save port mapping
        await savePort(userId, port);
        
        // Add Caddy route
        const subdomain = await addCaddyRoute(userId, port);
        
        // Save user data
        const userData = {
            userId,
            port,
            subdomain,
            gatewayToken,
            plan: plan || 'free',
            aiProvider: aiProvider || 'groq',
            createdAt: new Date().toISOString(),
            expiresAt: plan === 'free' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : null
        };
        await fs.mkdir(path.join(DATA_DIR, 'users'), { recursive: true });
        await fs.writeFile(path.join(DATA_DIR, 'users', `${userId}.json`), JSON.stringify(userData, null, 2));
        
        res.json({
            success: true,
            userId,
            subdomain,
            url: `https://${subdomain}`,
            port,
            gatewayToken,
            plan: plan || 'free'
        });
        
    } catch (error) {
        // Cleanup on failure
        try {
            await runCommand(`docker rm -f ${containerName}`);
            await fs.rm(dataDir, { recursive: true, force: true });
        } catch {}
        
        console.error('Provision error:', error);
        res.status(500).json({ error: error.message || error.stderr || 'Provisioning failed' });
    }
});

// Restart instance
app.post('/instances/:userId/restart', authMiddleware, async (req, res) => {
    const { userId } = req.params;
    const containerName = `openclaw-${userId}`;
    
    try {
        await runCommand(`docker restart ${containerName}`);
        res.json({ success: true, message: 'Instance restarted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Stop instance
app.post('/instances/:userId/stop', authMiddleware, async (req, res) => {
    const { userId } = req.params;
    const containerName = `openclaw-${userId}`;
    
    try {
        await runCommand(`docker stop ${containerName}`);
        res.json({ success: true, message: 'Instance stopped' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start instance
app.post('/instances/:userId/start', authMiddleware, async (req, res) => {
    const { userId } = req.params;
    const containerName = `openclaw-${userId}`;
    
    try {
        await runCommand(`docker start ${containerName}`);
        res.json({ success: true, message: 'Instance started' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete instance
app.delete('/instances/:userId', authMiddleware, async (req, res) => {
    const { userId } = req.params;
    const { keepBackup } = req.query;
    const containerName = `openclaw-${userId}`;
    const dataDir = path.join(DATA_DIR, 'instances', userId);
    
    try {
        // Stop and remove container
        await runCommand(`docker rm -f ${containerName}`);
        
        // Remove data directory (unless keeping backup)
        if (keepBackup !== 'true') {
            await fs.rm(dataDir, { recursive: true, force: true });
        }
        
        // TODO: Remove from Caddy config
        
        res.json({ success: true, message: 'Instance deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get instance logs
app.get('/instances/:userId/logs', authMiddleware, async (req, res) => {
    const { userId } = req.params;
    const { lines = 100 } = req.query;
    const containerName = `openclaw-${userId}`;
    
    try {
        const { stdout } = await runCommand(`docker logs ${containerName} --tail ${lines} 2>&1`);
        res.json({ logs: stdout });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get instance stats
app.get('/instances/:userId/stats', authMiddleware, async (req, res) => {
    const { userId } = req.params;
    const containerName = `openclaw-${userId}`;
    
    try {
        const { stdout } = await runCommand(`docker stats ${containerName} --no-stream --format "{{.CPUPerc}},{{.MemUsage}},{{.NetIO}}"`);
        const [cpu, memory, network] = stdout.trim().split(',');
        res.json({ cpu, memory, network });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Upgrade instance resources
app.post('/instances/:userId/upgrade', authMiddleware, async (req, res) => {
    const { userId } = req.params;
    const { plan } = req.body;
    const containerName = `openclaw-${userId}`;
    
    let memory = '1g';
    let cpus = '0.5';
    if (plan === 'pro') {
        memory = '1536m';
        cpus = '1.0';
    } else if (plan === 'power') {
        memory = '2g';
        cpus = '2.0';
    }
    
    try {
        await runCommand(`docker update --memory="${memory}" --cpus="${cpus}" ${containerName}`);
        res.json({ success: true, message: `Upgraded to ${plan}`, memory, cpus });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Validate Telegram token
app.post('/validate/telegram', async (req, res) => {
    const { token } = req.body;
    
    if (!token) {
        return res.status(400).json({ error: 'Token required' });
    }
    
    try {
        const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);
        const data = await response.json();
        
        if (data.ok) {
            res.json({ valid: true, bot: data.result });
        } else {
            res.json({ valid: false, error: data.description });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create data directories
const initDataDirs = async () => {
    await fs.mkdir(path.join(DATA_DIR, 'users'), { recursive: true });
    await fs.mkdir(path.join(DATA_DIR, 'instances'), { recursive: true });
};

// Start server
initDataDirs().then(() => {
    app.listen(PORT, () => {
        console.log(`🦞 2OpenClaw API running on port ${PORT}`);
    });
});
