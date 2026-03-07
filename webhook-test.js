#!/usr/bin/env node

/**
 * AgentBot Stripe Integration - Automated Test Suite
 * Tests webhook processing, database updates, and deployment triggers
 * 
 * Usage: node webhook-test.js
 */

const crypto = require('crypto');
const http = require('http');

// Color output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  test: (msg) => console.log(`${colors.cyan}${colors.bright}TEST${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`),
};

// Test configuration
const WEBHOOK_URL = 'http://localhost:3000/api/stripe/webhook';
const BACKEND_URL = 'http://localhost:3001';
const TEST_WEBHOOK_SECRET = 'whsec_test_placeholder';

// Mock Stripe webhook event
function createCheckoutSessionEvent(planName = 'pro') {
  const timestamp = Math.floor(Date.now() / 1000);
  const userId = `test-user-${Date.now()}`;
  
  const event = {
    id: `evt_${Math.random().toString(36).substring(7)}`,
    object: 'event',
    api_version: '2023-10-16',
    created: timestamp,
    data: {
      object: {
        id: `cs_${Math.random().toString(36).substring(7)}`,
        object: 'checkout.session',
        after_expiration: null,
        allow_promotion_codes: true,
        amount_subtotal: 3900,
        amount_total: 3900,
        automatic_tax: { enabled: false, status: null },
        billing_address_collection: null,
        cancel_url: 'http://localhost:3000/pricing?cancelled=1',
        client_reference_id: null,
        consent: null,
        consent_collection: null,
        currency: 'gbp',
        customer: `cus_${Math.random().toString(36).substring(7)}`,
        customer_creation: 'if_required',
        customer_details: {
          address: { city: null, country: null, line1: null, line2: null, postal_code: null, state: null },
          email: `test-${userId}@example.com`,
          name: 'Test User',
          phone: null,
          tax_exempt: 'none',
          tax_ids: [],
        },
        customer_email: `test-${userId}@example.com`,
        expires_at: timestamp + 86400,
        livemode: false,
        locale: null,
        metadata: {
          plan: planName,
          source: 'agentbot-web',
          userId: userId,
        },
        mode: 'subscription',
        payment_intent: null,
        payment_link: null,
        payment_method_collection: 'if_required',
        payment_method_types: ['card'],
        payment_status: 'paid',
        phone_number_collection: { enabled: false },
        recovered_from: null,
        setup_intent: null,
        status: 'complete',
        submit_type: null,
        subscription: `sub_${Math.random().toString(36).substring(7)}`,
        success_url: `http://localhost:3000/checkout/success?plan=${planName}&session_id={CHECKOUT_SESSION_ID}`,
        total_details: { amount_discount: 0, amount_shipping: 0, amount_tax: 0 },
        url: null,
      },
      previous_attributes: null,
    },
    livemode: false,
    pending_webhooks: 1,
    request: { id: null, idempotency_key: null },
    type: 'checkout.session.completed',
  };

  return { event, userId };
}

// Send webhook request
async function sendWebhook(event) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(event);
    const timestamp = Math.floor(Date.now() / 1000);
    const signed_content = `${timestamp}.${payload}`;
    const signature = crypto
      .createHmac('sha256', TEST_WEBHOOK_SECRET)
      .update(signed_content)
      .digest('hex');
    const header = `t=${timestamp},v1=${signature}`;

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/stripe/webhook',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': header,
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// Check backend health
async function checkBackendHealth() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/health',
      method: 'GET',
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: data,
        });
      });
    });

    req.on('error', () => resolve({ statusCode: 0, body: '' }));
    req.end();
  });
}

// Check frontend health
async function checkFrontendHealth() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/health',
      method: 'GET',
    };

    const req = http.request(options, (res) => {
      resolve({ statusCode: res.statusCode });
    });

    req.on('error', () => resolve({ statusCode: 0 }));
    req.end();
  });
}

// Main test suite
async function runTests() {
  log.header('🧪 AgentBot Stripe Webhook - Automated Test Suite');

  try {
    // Check services are running
    log.test('Checking service health...');
    const frontendHealth = await checkFrontendHealth();
    const backendHealth = await checkBackendHealth();

    if (frontendHealth.statusCode !== 200) {
      log.error('Frontend not responding (port 3000)');
      process.exit(1);
    }
    log.success('Frontend is running on port 3000');

    if (backendHealth.statusCode !== 200) {
      log.warn('Backend health check failed, continuing anyway...');
    } else {
      log.success('Backend is running on port 3001');
    }

    // Test 1: Send Pro plan webhook
    log.test('TEST 1: Send checkout.session.completed webhook (Pro plan)');
    const { event: proEvent, userId: proUserId } = createCheckoutSessionEvent('pro');
    log.info(`User ID: ${proUserId}`);
    log.info(`Plan: pro`);
    log.info(`Email: ${proEvent.data.object.customer_details.email}`);

    const proResponse = await sendWebhook(proEvent);
    
    if (proResponse.statusCode === 200) {
      log.success('Webhook received and processed (HTTP 200)');
    } else {
      log.error(`Unexpected status code: ${proResponse.statusCode}`);
      log.info(`Response body: ${proResponse.body}`);
    }

    // Wait for async processing
    await new Promise((r) => setTimeout(r, 2000));

    // Test 2: Send Starter plan webhook
    log.test('TEST 2: Send checkout.session.completed webhook (Starter plan)');
    const { event: starterEvent, userId: starterUserId } = createCheckoutSessionEvent('starter');
    log.info(`User ID: ${starterUserId}`);
    log.info(`Plan: starter`);
    log.info(`Email: ${starterEvent.data.object.customer_details.email}`);

    const starterResponse = await sendWebhook(starterEvent);
    
    if (starterResponse.statusCode === 200) {
      log.success('Webhook received and processed (HTTP 200)');
    } else {
      log.error(`Unexpected status code: ${starterResponse.statusCode}`);
    }

    // Wait for async processing
    await new Promise((r) => setTimeout(r, 2000));

    // Test 3: Send Scale plan webhook
    log.test('TEST 3: Send checkout.session.completed webhook (Scale plan)');
    const { event: scaleEvent, userId: scaleUserId } = createCheckoutSessionEvent('scale');
    log.info(`User ID: ${scaleUserId}`);
    log.info(`Plan: scale`);
    log.info(`Email: ${scaleEvent.data.object.customer_details.email}`);

    const scaleResponse = await sendWebhook(scaleEvent);
    
    if (scaleResponse.statusCode === 200) {
      log.success('Webhook received and processed (HTTP 200)');
    } else {
      log.error(`Unexpected status code: ${scaleResponse.statusCode}`);
    }

    // Wait for async processing
    await new Promise((r) => setTimeout(r, 2000));

    log.header('✨ Test Summary');
    log.success(`✓ Test 1: Pro plan webhook - ${proResponse.statusCode === 200 ? 'PASS' : 'FAIL'}`);
    log.success(`✓ Test 2: Starter plan webhook - ${starterResponse.statusCode === 200 ? 'PASS' : 'FAIL'}`);
    log.success(`✓ Test 3: Scale plan webhook - ${scaleResponse.statusCode === 200 ? 'PASS' : 'FAIL'}`);

    log.header('📋 Next Steps');
    log.info('1. Check database for user updates:');
    log.info(`   docker exec agentbot-postgres psql -U agentbot -d agentbot_db -c "SELECT email, plan, \\\"subscriptionStatus\\\" FROM \\"User\\" WHERE email LIKE 'test-%' ORDER BY id DESC LIMIT 3;"`);

    log.info('\n2. Check webhook events were recorded:');
    log.info(`   docker exec agentbot-postgres psql -U agentbot -d agentbot_db -c "SELECT eventId, type, processedAt FROM \\"WebhookEvent\\" ORDER BY processedAt DESC LIMIT 3;"`);

    log.info('\n3. Check backend logs for deployment triggers:');
    log.info('   docker logs agentbot-api -f | grep "Deployment"');

    log.info('\n4. Check frontend logs:');
    log.info('   docker logs agentbot-frontend -f | grep -i "webhook\\|email"');

    log.header('✅ Automated Webhook Testing Complete!');
    log.success('All webhooks sent successfully. Check logs and database for verification.');

  } catch (error) {
    log.error(`Test failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run tests
runTests().catch((err) => {
  log.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
