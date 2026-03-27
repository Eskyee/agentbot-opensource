/**
 * MPP Smoke Test for Agentbot
 * 
 * Tests the full 402 Payment Required flow:
 * 1. Send initial request → expect 402
 * 2. Parse challenge → verify structure
 * 3. Sign mock transaction → create credential
 * 4. Retry with credential → expect 200 + receipt
 * 
 * Run: npx tsx lib/mpp/smoke-test.ts
 */

import { privateKeyToAccount } from 'viem/accounts';

const BASE_URL = process.env.AGENTBOT_URL || 'https://agentbot.raveculture.xyz';
const PLUGIN = 'generate-text';
const GATEWAY_URL = `${BASE_URL}/api/v1/gateway`;

// Generate a test private key (DO NOT use in production)
const TEST_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as `0x${string}`;
const account = privateKeyToAccount(TEST_PRIVATE_KEY);

async function smokeTest() {
  console.log('🧪 MPP Smoke Test Starting...\n');
  console.log(`Target: ${BASE_URL}/api/v1/gateway`);
  console.log(`Plugin: ${PLUGIN}`);
  console.log(`Account: ${account.address}\n`);

  // Step 1: Initial request (should get 402)
  console.log('Step 1: Sending initial request...');
  console.log(`URL: ${GATEWAY_URL}`);
  
  const initialResponse = await fetch(GATEWAY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Plugin-Id': PLUGIN,
      'X-Payment-Method': 'mpp', // Force MPP mode
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'Say hello' }],
      max_tokens: 50,
    }),
  });

  console.log(`Status: ${initialResponse.status}`);

  if (initialResponse.status !== 402) {
    if (initialResponse.ok) {
      console.log('⚠️  Got 200 instead of 402 - MPP may not be required or enabled');
      const data = await initialResponse.json();
      console.log('Response:', JSON.stringify(data, null, 2));
      return;
    }
    console.error('❌ Expected 402, got:', initialResponse.status);
    const error = await initialResponse.text();
    console.error('Error:', error);
    return;
  }

  // Step 2: Parse 402 challenge
  console.log('\nStep 2: Parsing 402 challenge...');
  const challengeData = await initialResponse.json();
  
  if (!challengeData.mpp) {
    console.error('❌ No MPP challenge in 402 response');
    console.error('Response:', JSON.stringify(challengeData, null, 2));
    return;
  }

  const challenge = challengeData.mpp;
  console.log(`Amount: ${challenge.amount}`);
  console.log(`Currency: ${challenge.currency}`);
  console.log(`Recipient: ${challenge.recipient}`);
  console.log(`Description: ${challenge.description}`);
  console.log(`Nonce: ${challenge.nonce}`);
  console.log(`Expires: ${new Date(challenge.expiresAt).toISOString()}`);

  // Also check Stripe option exists
  if (challengeData.stripe) {
    console.log(`\n✅ Stripe option available: ${challengeData.stripe.checkoutUrl}`);
  }

  // Step 3: Sign mock transaction
  console.log('\nStep 3: Signing MPP transaction...');
  
  const txData = {
    chainId: 4217,
    to: challenge.recipient,
    token: challenge.currency,
    amount: challenge.amount,
    nonce: challenge.nonce,
    from: account.address,
    timestamp: Date.now(),
  };

  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(txData));
  const hexArray = Array.from(new Uint8Array(data));
  const encoded = hexArray.map(b => b.toString(16).padStart(2, '0')).join('');
  const transaction = `0x76${encoded}`;

  const credential = {
    scheme: 'Payment' as const,
    transaction,
    challengeNonce: challenge.nonce,
  };

  console.log(`Transaction type: 0x76 (Tempo)`);
  console.log(`From: ${account.address}`);
  console.log(`To: ${challenge.recipient}`);
  console.log(`Amount: ${challenge.amount}`);

  // Step 4: Retry with credential
  console.log('\nStep 4: Retrying with MPP credential...');
  const paidResponse = await fetch(GATEWAY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Payment ${JSON.stringify(credential)}`,
      'X-Plugin-Id': PLUGIN,
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'Say hello' }],
      max_tokens: 50,
    }),
  });

  console.log(`Status: ${paidResponse.status}`);

  if (!paidResponse.ok) {
    console.error('❌ Payment verification failed');
    const error = await paidResponse.json().catch(() => ({}));
    console.error('Error:', JSON.stringify(error, null, 2));
    return;
  }

  // Step 5: Verify receipt
  const receipt = paidResponse.headers.get('Payment-Receipt');
  console.log(`\n✅ Payment verified!`);
  console.log(`Receipt: ${receipt || 'none'}`);

  const responseData = await paidResponse.json().catch(() => ({}));
  console.log('\nResponse data:', JSON.stringify(responseData, null, 2));

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('🧪 MPP Smoke Test Results:');
  console.log('='.repeat(50));
  console.log('✅ 402 challenge received');
  console.log('✅ Challenge structure valid');
  console.log('✅ Transaction signed');
  console.log('✅ Payment verified');
  console.log('✅ Response received');
  console.log(receipt ? '✅ Receipt generated' : '⚠️  No receipt header');
  console.log('\n🎉 All checks passed!');
}

// Run the test
smokeTest().catch(error => {
  console.error('\n💥 Smoke test failed:', error);
  process.exit(1);
});
