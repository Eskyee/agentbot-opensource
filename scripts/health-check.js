/**
 * Health monitoring script for Agentbot
 * Run this periodically to check API health and send alerts
 * 
 * Usage: node scripts/health-check.js
 * 
 * Configure via environment variables:
 * - HEALTH_CHECK_URL: The URL to check (default: https://agentbot.raveculture.xyz/api/health)
 * - SLACK_WEBHOOK: Optional Slack webhook for notifications
 * - DISCORD_WEBHOOK: Optional Discord webhook for notifications
 */

const HEALTH_CHECK_URL = process.env.HEALTH_CHECK_URL || 'https://agentbot.raveculture.xyz/api/health';
const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK;
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK;
const CHECK_INTERVAL = process.env.CHECK_INTERVAL || 60000; // 1 minute

async function sendSlackNotification(message, color = 'danger') {
  if (!SLACK_WEBHOOK) return;
  
  const colors = {
    good: '#36a64f',
    warning: '#ff9800',
    danger: '#dc3545'
  };
  
  try {
    await fetch(SLACK_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attachments: [{
          color: colors[color] || colors.danger,
          text: message,
          timestamp: new Date().toISOString()
        }]
      })
    });
  } catch (error) {
    console.error('Failed to send Slack notification:', error.message);
  }
}

async function sendDiscordNotification(message) {
  if (!DISCORD_WEBHOOK) return;
  
  try {
    await fetch(DISCORD_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title: 'Health Check Alert',
          description: message,
          color: 0xdc3545,
          timestamp: new Date().toISOString()
        }]
      })
    });
  } catch (error) {
    console.error('Failed to send Discord notification:', error.message);
  }
}

async function checkHealth() {
  const startTime = Date.now();
  const timeoutMs = 10000; // 10 second timeout
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    const response = await fetch(HEALTH_CHECK_URL, {
      method: 'GET',
      headers: {
        'User-Agent': 'Agentbot-Health-Check/1.0'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    const responseTime = Date.now() - startTime;
    
    if (!response.ok) {
      const message = `❌ Health check failed: ${response.status} ${response.statusText} (${responseTime}ms)`;
      console.log(message);
      await sendSlackNotification(message);
      await sendDiscordNotification(message);
      return false;
    }
    
    const data = await response.json();
    
    if (data.status === 'healthy') {
      console.log(`✅ Health check passed (${responseTime}ms)`);
      return true;
    } else {
      const message = `⚠️ Health check degraded: ${JSON.stringify(data)}`;
      console.log(message);
      await sendSlackNotification(message, 'warning');
      return false;
    }
  } catch (error) {
    const message = `❌ Health check error: ${error.message}`;
    console.log(message);
    await sendSlackNotification(message);
    await sendDiscordNotification(message);
    return false;
  }
}

async function startMonitoring() {
  console.log(`🔄 Starting health monitoring...`);
  console.log(`   URL: ${HEALTH_CHECK_URL}`);
  console.log(`   Interval: ${CHECK_INTERVAL}ms`);
  console.log(`   Slack: ${SLACK_WEBHOOK ? 'configured' : 'not configured'}`);
  console.log(`   Discord: ${DISCORD_WEBHOOK ? 'configured' : 'not configured'}`);
  
  // Initial check
  await checkHealth();
  
  // Periodic checks
  setInterval(checkHealth, CHECK_INTERVAL);
}

// Run if called directly
if (require.main === module) {
  startMonitoring();
}

module.exports = { checkHealth, sendSlackNotification, sendDiscordNotification };
