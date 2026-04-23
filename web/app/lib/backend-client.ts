import { Wallet } from 'ethers';

/**
 * BackendClient — Securely communicates with the agentbot-backend.
 * 
 * Implements "Identity as a Fact" by signing every request with the 
 * application's private key. This allows the backend to verify the 
 * request origin cryptographically without relying on shared API keys.
 */
export async function signedFetch(path: string, init?: RequestInit) {
  const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:3001';
  const privateKey = process.env.APP_PRIVATE_KEY;
  const internalApiKey = process.env.INTERNAL_API_KEY;

  // Ensure path starts with /
  const sanitizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${backendUrl}${sanitizedPath}`;
  
  const method = init?.method?.toUpperCase() || 'GET';
  const timestamp = Date.now().toString();
  
  // Reconstruct body for signing
  let bodyStr = '';
  if (init?.body) {
    if (typeof init.body === 'string') {
      bodyStr = init.body;
    } else {
      try {
        bodyStr = JSON.stringify(init.body);
      } catch {
        bodyStr = '';
      }
    }
  }

  const headers = new Headers(init?.headers || {});
  headers.set('Content-Type', 'application/json');
  
  // 1. Attempt Cryptographic Signing (Identity as a Fact)
  if (privateKey) {
    try {
      const wallet = new Wallet(privateKey);
      
      // Message format matching SignatureGuard: "${METHOD}:${PATH}:${BODY}:${TIMESTAMP}"
      const message = `${method}:${sanitizedPath}:${bodyStr}:${timestamp}`;
      const signature = await wallet.signMessage(message);
      
      headers.set('x-agent-signature', signature);
      headers.set('x-agent-address', wallet.address);
      headers.set('x-agent-timestamp', timestamp);
    } catch (error) {
      console.error('[BackendClient] Signing failed:', error);
    }
  }

  // 2. Legacy Fallback (Bearer Token)
  // We keep this during the transition phase to ensure no service interruption.
  if (internalApiKey) {
    headers.set('Authorization', `Bearer ${internalApiKey}`);
  }

  return fetch(url, {
    ...init,
    headers,
  });
}
