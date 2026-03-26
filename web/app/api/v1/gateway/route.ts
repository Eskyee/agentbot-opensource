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

    // 3. MPP Payment Check (dual payment: Stripe or MPP)
    const paymentMethod = getPaymentMethod(req);
    let mppReceipt: string | undefined;
    
    if (paymentMethod === 'mpp') {
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
        // Allow MPP-authenticated requests without session
        if (paymentMethod !== 'mpp' || !mppReceipt) {
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
        receipt: mppReceipt || null,
      },
    };

    // Build response headers
    const responseHeaders: Record<string, string> = {
      ...cors,
      'x-plugin-id': matchedPlugin.id,
    };

    // Add MPP receipt if payment was verified
    if (mppReceipt) {
      responseHeaders['Payment-Receipt'] = mppReceipt;
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
