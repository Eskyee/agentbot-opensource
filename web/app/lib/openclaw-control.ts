import { DEFAULT_OPENCLAW_GATEWAY_URL } from './openclaw-config';

export const DEFAULT_OPENCLAW_CONTROL_UI_BASE = DEFAULT_OPENCLAW_GATEWAY_URL.replace(
  /\/(chat|skills|config)\/?$/,
  ''
).replace(/\/$/, '');

export const OPENCLAW_CONTROLS_ENABLED = true;

type ControlView = 'chat' | 'skills' | 'config';

function getGatewayWsUrl(gatewayUrl: string | null | undefined): string | null {
  if (!gatewayUrl) return null;
  try {
    return `wss://${new URL(gatewayUrl).host}`;
  } catch {
    return null;
  }
}

export function buildOpenClawControlUrl({
  view,
  gatewayUrl,
  gatewayToken,
  session = 'main',
}: {
  view: ControlView;
  gatewayUrl?: string | null;
  gatewayToken?: string | null;
  session?: string;
}): string {
  // Prefer the user's own provisioned agent URL so dashboard links route into
  // the container the user was provisioned on (each user's own agentbot-agent
  // Railway host). Only fall back to the shared control origin when the caller
  // has no agent URL yet (e.g. pre-provision or legacy bootstrap).
  const gatewayOrigin = (() => {
    if (!gatewayUrl) return '';
    try {
      return new URL(gatewayUrl).origin;
    } catch {
      return '';
    }
  })();
  const controlUiBase = (gatewayOrigin || DEFAULT_OPENCLAW_CONTROL_UI_BASE).replace(/\/$/, '');

  if (!controlUiBase) {
    return '#';
  }

  const base = `${controlUiBase}/${view}`;
  const href = view === 'chat' ? `${base}?session=${encodeURIComponent(session)}` : base;

  const gatewayWsUrl = getGatewayWsUrl(gatewayUrl);
  if (!gatewayToken || !gatewayWsUrl) {
    return href;
  }

  return `${href}#token=${encodeURIComponent(gatewayToken)}&gatewayUrl=${encodeURIComponent(
    gatewayWsUrl
  )}`;
}
