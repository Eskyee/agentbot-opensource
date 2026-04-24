# AgentKit x402 Integration

## Documentation Index

Fetch the complete documentation index at: https://docs.world.org/llms.txt

Use this file to discover all available pages before exploring further.

Key pages for this integration:

- AgentKit quickstart: https://docs.world.org/agents/agent-kit/integrate.md
- AgentKit SDK reference: https://docs.world.org/agents/agent-kit/sdk-reference.md
- AgentKit ecosystem: https://docs.world.org/agents/agent-kit/ecosystem.md

## Ecosystem

Find AgentKit-enabled services at https://agentbook.world/.

To list an Agentbot endpoint or service in the public ecosystem, open a PR to
the AgentBook registry:

```text
https://github.com/andy-t-wang/agentbook
```

Agents should install the AgentKit x402 skill before accessing AgentKit-enabled
x402 endpoints:

```bash
npx skills add worldcoin/agentkit agentkit-x402
```

## Agentbot Verification Surface

Agentbot exposes AgentKit as a verification option at `/dashboard/verify`.
Users can choose SelfClaw passport verification or AgentKit AgentBook registration.

AgentKit registration is external to Agentbot:

```bash
npx @worldcoin/agentkit-cli register <agent-address>
```

Agentbot also exposes a browser registration helper on `/dashboard/verify`.
It mirrors the CLI flow:

1. read `getNextNonce(agent)` from AgentBook
2. build the World ID signal with `solidityEncode(["address", "uint256"], [agent, nonce])`
3. create a World App connector URI for app `app_a7c3e2b6b83927251a0db5345bd7146a` and action `agentbook-registration`
4. show that URI as a QR code
5. poll for the World ID proof
6. submit the proof to the hosted relay at `https://x402-worldchain.vercel.app/register`

The helper is backed by:

- `POST /api/agentkit/register` to prepare the AgentBook nonce and registration config
- browser-side World App polling via `@worldcoin/idkit-core`
- `PUT /api/agentkit/register` to submit the returned proof to the relay
- `GET /api/agentkit/status?address=...` to look up AgentBook registration status

After registration, users can save the agent signing wallet on the verify page.
Agentbot stores this as `verificationType: "agentkit"` with metadata for:

- canonical AgentBook lookup on World Chain
- x402 free-trial mode with 3 uses
- World Chain and Base payment support
- the skill install command for agent-side x402 access

Agentbot only saves AgentKit verification after AgentBook lookup returns a
human identifier for the wallet. Protected x402 routes must still validate
AgentKit headers at request time.

## Access Modes

Usage counters are tracked per human per endpoint. Two agents backed by the
same human share the same counter.

| Mode | Fields | Behavior |
| --- | --- | --- |
| `free` | `{ type: "free" }` | Registered human-backed agents always bypass payment. |
| `free-trial` | `{ type: "free-trial"; uses?: number }` | Registered agents bypass payment for the first `N` uses. Default `uses` is `1`. |
| `discount` | `{ type: "discount"; percent: number; uses?: number }` | Registered agents can underpay by the configured percent for the first `N` uses. |

Agentbot defaults to `free-trial` with `uses: 3`.

`discount` mode requires registering `verifyFailureHook` on the facilitator;
without it, discounted underpayments fail settlement verification.

## Core Server APIs

Use these exports from `@worldcoin/agentkit` when adding AgentKit to a protected
x402 endpoint:

- `declareAgentkitExtension(options?)` attaches the `agentkit` extension to the x402 route declaration returned in a 402 response.
- `agentkitResourceServerExtension` is registered once on the x402 resource server to turn declarations into full AgentKit challenges.
- `createAgentkitHooks(options)` creates `requestHook` and, for `discount`, `verifyFailureHook`.
- `createAgentBookVerifier(options?)` resolves the agent signing wallet to an anonymous human identifier.
- `InMemoryAgentKitStorage` is demo-only; production must use durable storage for counters and nonces.

`createAgentkitHooks` needs:

- `agentBook`: usually `createAgentBookVerifier()`
- `mode`: `{ type: "free-trial", uses: 3 }` for Agentbot's default
- `storage`: required for `free-trial` and `discount`
- `rpcUrl`: optional custom EVM RPC for signature verification
- `onEvent`: optional logging for `agent_verified`, `agent_not_verified`, `validation_failed`, `discount_applied`, and `discount_exhausted`

The `requestHook` framework contract is intentionally small:

```ts
{
  adapter: {
    getHeader(name: string): string | undefined
    getUrl(): string
  }
  path: string
}
```

This means Hono is a reference example, not a framework requirement. Express
and Next.js route handlers can adapt requests to the same shape.

## AgentBook Lookup

AgentBook lookup always resolves against the canonical AgentBook deployment on
World Chain (`eip155:480`) regardless of the payment network.

Canonical mainnet deployment:

```text
0xA23aB2712eA7BBa896930544C7d6636a96b944dA
```

The common verifier setup is:

```ts
const agentBook = createAgentBookVerifier()
const humanId = await agentBook.lookupHuman(agentAddress)
```

Use `rpcUrl`, `contractAddress`, or a custom viem `client` only for advanced
deployments or tests.

## Production Storage

Implement `AgentKitStorage` for production routes:

```ts
interface AgentKitStorage {
  tryIncrementUsage(endpoint: string, humanId: string, limit: number): Promise<boolean>
  hasUsedNonce?(nonce: string): Promise<boolean> | boolean
  recordNonce?(nonce: string): Promise<void> | void
}
```

Persist both usage counters and nonce history. `InMemoryAgentKitStorage` loses
state on restart and should stay limited to local development, demos, and tests.

## Low-Level Helpers

Use low-level helpers when not using the x402 wrapper or when adding custom
request handling:

- `parseAgentkitHeader(header)` parses the base64 `agentkit` header.
- `validateAgentkitMessage(payload, resourceUri, options?)` checks domain, URI, issue time, expiration, not-before, and optional nonce replay.
- `verifyAgentkitSignature(payload, rpcUrl?)` verifies EVM SIWE or Solana SIWS signatures and returns the recovered address.
- `buildAgentkitSchema()` returns the JSON schema used in 402 challenges.

Supported signature families:

- EVM: `eip155:*`, payload type `eip191` or `eip1271`, SIWE message format, optional `eip6492` scheme.
- Solana: `solana:*`, payload type `ed25519`, SIWS message format.

## Agent-Side Skill

Install the AgentKit x402 skill for agents that will call protected x402 endpoints:

```bash
npx skills add worldcoin/agentkit agentkit-x402
```

The website/server side still needs route-level x402 middleware and persistent
AgentKit storage before enforcing free-trial counters in production.
