import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/app/lib/getAuthSession'
import { GATEWAY_CONFIG } from './temp';
import {
  getPaymentMethod,
  hasMppCredential,
  verifyMppPayment,
  create402Response,
  PLUGIN_PRICING,
} from '@/lib/mpp/middleware';
import {
  getUserSession,
  processVoucher,
  type Voucher,
} from '@/lib/mpp/sessions';

export const dynamic = 'force-dynamic';

// Helper to get CORS headers
function getCorsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': GATEWAY_CONFIG.cors.origin,
    'Access-Control-Allow-Methods': GATEWAY_CONFIG.cors.methods.join(', '),
    'Access-Control-Allow-Headers': GATEWAY_CONFIG.cors.headers.join(', '),
  };
}

// Find an available plugin by ID
async function findAvailablePlugin(
  pluginId: string,
  body: Record<string, unknown>,
  apiKey?: string
): Promise<{ id: string; url: string } | null> {
  const plugin = GATEWAY_CONFIG.plugins[pluginId as keyof typeof GATEWAY_CONFIG.plugins];
  if (!plugin || !plugin.enabled) return null;
  
  return {
    id: pluginId,
    url: plugin.endpoint,
  };
}

// Main POST handler
export async function POST(req: NextRequest) {
  const cors = getCorsHeaders();
  const streamHeaders: Record<string, string> = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  };

  try {
    // 1. Parse request
    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    // 2. Resolve plugin name
    let pluginName =
      (req.headers.get('x-plugin-id') as string) ??
      (body.plugin as string) ??
      GATEWAY_CONFIG.defaultPlugin;

    // 3. Payment Check (triple payment: Session or MPP or Stripe)
    const paymentMethod = getPaymentMethod(req);
    let mppReceipt: string | undefined;
    let sessionReceipt: string | undefined;
    
    if (paymentMethod === 'session') {
      // Session-based billing — auto-debit via voucher
      const sessionId = req.headers.get('X-Session-Id');
      const userAddress = req.headers.get('X-Wallet-Address') as `0x${string}` | null;
      
      if (!sessionId || !userAddress) {
        return NextResponse.json(
          { error: 'session_required', message: 'Session ID and wallet address required' },
          { status: 402, headers: cors },
        );
      }

      // Check session exists and has balance
      const { getUserSession, processVoucher } = await import('@/lib/mpp/sessions');
      const session = getUserSession(userAddress);
      
      if (!session || session.id !== sessionId) {
        return NextResponse.json(
          { error: 'session_invalid', message: 'No active session found' },
          { status: 402, headers: cors },
        );
      }

      // Check if plugin has pricing
      const pricing = PLUGIN_PRICING[pluginName];
      if (!pricing) {
        return NextResponse.json(
          { error: 'unknown_plugin', message: `No pricing for ${pluginName}` },
          { status: 400, headers: cors },
        );
      }

      // Check balance
      const remaining = parseFloat(session.remaining);
      const cost = parseFloat(pricing.amount);
      if (cost > remaining) {
        return NextResponse.json(
          { 
            error: 'insufficient_balance', 
            message: `Need $${pricing.amount}, have $${session.remaining}`,
            session: { remaining: session.remaining, cost: pricing.amount },
          },
          { status: 402, headers: cors },
        );
      }

      // Process voucher (off-chain debit)
      const voucher: Voucher = {
        sessionId: session.id,
        userAddress,
        amount: pricing.amount,
        plugin: pluginName,
        nonce: generateNonce(),
        timestamp: Date.now(),
        signature: '0x' as `0x${string}`, // Server-side voucher, no client sig needed
      };

      const voucherResult = processVoucher(voucher);
      if (!voucherResult.success) {
        return NextResponse.json(
          { error: 'voucher_failed', message: voucherResult.error },
          { status: 402, headers: cors },
        );
      }

      sessionReceipt = `session:${session.id}:${voucher.nonce}`;
      console.log(`[Session] Debited $${pricing.amount} from session ${session.id} for ${pluginName}. Remaining: $${voucherResult.session.remaining}`);
    } else if (paymentMethod === 'mpp') {
      // Verify MPP payment credential
      const mppResult = await verifyMppPayment(req, pluginName);
      
      if (!mppResult.valid) {
        // No valid credential — return 402 with pricing options
        const pricing = PLUGIN_PRICING[pluginName];
        if (pricing) {
          return create402Response(pluginName, pricing);
        }
        // Unknown plugin — fall through to normal flow
      }
      
      // Valid MPP payment — store receipt and proceed
      mppReceipt = mppResult.receipt;
      console.log(`[MPP] Payment verified for ${pluginName}: ${mppResult.receipt}`);
    }
    // If stripe or no payment method, existing flow continues unchanged

    // 4. Find an available plugin
    const matchedPlugin = await findAvailablePlugin(pluginName, body);
    if (!matchedPlugin) {
      return NextResponse.json(
        { error: 'no_plugin', message: `No plugin registered for id "${pluginName}"` },
        { status: 502 },
      );
    }

    // 5. Check authentication for protected plugins
    const plugin = GATEWAY_CONFIG.plugins[pluginName as keyof typeof GATEWAY_CONFIG.plugins];
    if (plugin?.auth) {
      const session = await getAuthSession();
      if (!session?.user?.email) {
        // Allow MPP or session-authenticated requests without login session
        if ((paymentMethod !== 'mpp' || !mppReceipt) && (paymentMethod !== 'session' || !sessionReceipt)) {
          return NextResponse.json(
            { error: 'Unauthorized', message: 'Authentication required' },
            { status: 401, headers: cors },
          );
        }
      }
    }

    // 6. Forward request to plugin
    // For now, return a mock response (in production, forward to actual plugin)
    const responseData = {
      plugin: matchedPlugin.id,
      message: `Request processed by ${matchedPlugin.id} plugin`,
      timestamp: new Date().toISOString(),
      payment: {
        method: paymentMethod,
        receipt: mppReceipt || sessionReceipt || null,
      },
    };

    // Build response headers
    const responseHeaders: Record<string, string> = {
      ...cors,
      'x-plugin-id': matchedPlugin.id,
    };

    // Add payment receipt
    if (mppReceipt) {
      responseHeaders['Payment-Receipt'] = mppReceipt;
    }
    if (sessionReceipt) {
      responseHeaders['Payment-Receipt'] = sessionReceipt;
      responseHeaders['X-Session-Remaining'] = getUserSession(
        req.headers.get('X-Wallet-Address') as `0x${string}`
      )?.remaining || '0';
    }

    return NextResponse.json(responseData, {
      status: 200,
      headers: responseHeaders,
    });

  } catch (error) {
    console.error('[Gateway] Error:', error);
    return NextResponse.json(
      { error: 'internal', message: 'Internal server error' },
      { status: 500, headers: cors },
    );
  }
}

// Generate random nonce for session vouchers
function generateNonce(): string {
  const bytes = new Uint8Array(12)
  crypto.getRandomValues(bytes)
  return 'v_' + Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}

// OPTIONS handler for CORS preflight
export async function OPTIONS(req: NextRequest) {
  const cors = getCorsHeaders();
  
  // Check if MPP is supported
  const acceptHeader = req.headers.get('accept');
  const isApiRequest = acceptHeader?.includes('application/json');
  
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...cors,
      ...(isApiRequest ? { 'WWW-Authenticate': 'Payment' } : {}),
    },
  });
}
