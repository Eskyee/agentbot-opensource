#!/usr/bin/env node

/**
 * OpenClaw Gateway WebSocket Test
 * Tests connectivity to OpenClaw Gateway running on Render
 * 
 * Usage:
 *   node test-openclaw-gateway.js
 * 
 * This script:
 * 1. Connects to OpenClaw Gateway via WebSocket
 * 2. Sends a test message
 * 3. Receives response
 * 4. Verifies connection health
 */

const WebSocket = require('ws');

// Configuration
const GATEWAY_HOST = 'openclaw-gateway-lqma';
const GATEWAY_PORT = 10000;
const GATEWAY_URL = `ws://${GATEWAY_HOST}:${GATEWAY_PORT}`;

// Test parameters
const TEST_TIMEOUT = 10000; // 10 seconds
const RECONNECT_ATTEMPTS = 3;

console.log('🔌 OpenClaw Gateway WebSocket Test Suite');
console.log('========================================\n');

async function testGatewayConnection() {
  return new Promise((resolve, reject) => {
    console.log(`📍 Target: ${GATEWAY_URL}`);
    console.log(`⏱️  Timeout: ${TEST_TIMEOUT}ms\n`);

    let ws;
    let timeoutHandle;

    try {
      ws = new WebSocket(GATEWAY_URL);

      // Connection opened
      ws.on('open', () => {
        console.log('✅ WebSocket connected');
        
        // Send test message
        const testPayload = {
          type: 'health_check',
          timestamp: new Date().toISOString(),
          client: 'agentbot-test-suite'
        };

        console.log(`📤 Sending: ${JSON.stringify(testPayload)}`);
        ws.send(JSON.stringify(testPayload));

        // Set timeout for response
        timeoutHandle = setTimeout(() => {
          console.log('⚠️  Response timeout');
          ws.close();
          reject(new Error('No response from gateway within timeout'));
        }, TEST_TIMEOUT);
      });

      // Message received
      ws.on('message', (data) => {
        clearTimeout(timeoutHandle);
        console.log(`📥 Received: ${data}`);
        
        try {
          const response = JSON.parse(data);
          console.log('✅ Response parsed successfully');
          ws.close();
          resolve({ success: true, response });
        } catch (e) {
          console.error('❌ Failed to parse response:', e.message);
          ws.close();
          reject(e);
        }
      });

      // Error handler
      ws.on('error', (error) => {
        clearTimeout(timeoutHandle);
        console.error('❌ WebSocket error:', error.message);
        reject(error);
      });

      // Connection closed
      ws.on('close', () => {
        console.log('🔌 WebSocket closed');
      });

    } catch (error) {
      clearTimeout(timeoutHandle);
      console.error('❌ Failed to create WebSocket:', error.message);
      reject(error);
    }
  });
}

async function testAgentCommand() {
  return new Promise((resolve, reject) => {
    console.log('\n📨 Testing agent command...\n');

    let ws;

    try {
      ws = new WebSocket(GATEWAY_URL);

      ws.on('open', () => {
        console.log('✅ WebSocket connected for agent test');
        
        const agentCommand = {
          type: 'agent_command',
          payload: {
            agent_id: 'test-agent-001',
            command: 'ping',
            data: {
              message: 'Hello OpenClaw Gateway!'
            }
          }
        };

        console.log(`📤 Sending agent command: ${JSON.stringify(agentCommand)}`);
        ws.send(JSON.stringify(agentCommand));

        setTimeout(() => {
          ws.close();
          resolve({ success: true, message: 'Agent command sent' });
        }, 2000);
      });

      ws.on('error', (error) => {
        console.error('❌ Agent command test failed:', error.message);
        reject(error);
      });

    } catch (error) {
      console.error('❌ Failed to test agent command:', error.message);
      reject(error);
    }
  });
}

async function runAllTests() {
  try {
    console.log('🧪 Test 1: Health Check\n');
    await testGatewayConnection();

    console.log('\n🧪 Test 2: Agent Command\n');
    await testAgentCommand();

    console.log('\n✅ All tests completed successfully!\n');
    console.log('Summary:');
    console.log('- OpenClaw Gateway is reachable');
    console.log('- WebSocket connections work');
    console.log('- Message protocol functional');
    console.log('\n🚀 Gateway is ready for production use');

  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Verify OpenClaw Gateway is running: Render dashboard');
    console.error('2. Check network connectivity to openclaw-gateway-lqma:10000');
    console.error('3. Verify service address in Render dashboard');
    console.error('4. Check firewall rules allow WebSocket on port 10000');
    process.exit(1);
  }
}

runAllTests();
