import { NextResponse } from 'next/server'

const gatewayPort = 18789

export async function GET() {
  return NextResponse.json({
    defaultType: 'off',
    options: [
      {
        type: 'off',
        label: 'Off',
        description: 'Use the standard managed runtime without user-managed remote access.',
        requiredFields: [],
        setupSteps: [],
      },
      {
        type: 'ssh',
        label: 'Remote over SSH',
        description: 'Safest fallback. Keep OpenClaw loopback-only and let the user open an SSH tunnel.',
        requiredFields: ['sshTarget'],
        optionalFields: ['sshIdentity', 'port'],
        setupSteps: [
          'Confirm the user can SSH into the Gateway host.',
          `Open a tunnel with: ssh -N -L ${gatewayPort}:127.0.0.1:${gatewayPort} user@host`,
          `Connect clients to ws://127.0.0.1:${gatewayPort}.`,
          'Use the normal OpenClaw gateway token or password; SSH does not bypass gateway auth.',
        ],
      },
      {
        type: 'tailscale-serve',
        label: 'Tailscale Serve',
        description: 'Tailnet-only HTTPS access with OpenClaw Gateway kept on loopback.',
        requiredFields: ['authKey'],
        optionalFields: ['hostname', 'tags', 'acceptRoutes', 'resetOnExit'],
        setupSteps: [
          'Ask the user to create an auth key in their own Tailscale admin console.',
          'Prefer an ephemeral key for short-lived agents or a tagged reusable key for durable agents.',
          'Provision with remoteAccess.type=tailscale-serve and the user auth key.',
          'Open the Control UI at the MagicDNS HTTPS hostname after Tailscale Serve is ready.',
        ],
      },
      {
        type: 'tailscale-funnel',
        label: 'Tailscale Funnel',
        description: 'Public HTTPS access through Tailscale Funnel. Requires a shared Gateway password.',
        requiredFields: ['authKey', 'password'],
        optionalFields: ['hostname', 'tags', 'acceptRoutes', 'resetOnExit'],
        setupSteps: [
          'Confirm the user understands Funnel creates public HTTPS access.',
          'Ask the user to create a Tailscale auth key and choose a Gateway password.',
          'Provision with remoteAccess.type=tailscale-funnel, authKey, and password.',
          'Share the Funnel HTTPS URL only with intended operators.',
        ],
      },
      {
        type: 'tailnet',
        label: 'Tailnet IP',
        description: 'Bind OpenClaw directly to the Tailnet IP with token auth, without Serve/Funnel HTTPS automation.',
        requiredFields: ['authKey'],
        optionalFields: ['hostname', 'tags', 'acceptRoutes'],
        setupSteps: [
          'Ask the user to create a Tailscale auth key in their own tailnet.',
          'Provision with remoteAccess.type=tailnet.',
          `Connect from another Tailnet device to http://<tailscale-ip>:${gatewayPort}/ or ws://<tailscale-ip>:${gatewayPort}.`,
          'Use the normal OpenClaw gateway token.',
        ],
      },
    ],
  })
}
