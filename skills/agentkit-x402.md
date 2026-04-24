# AgentKit x402

Use this skill when an Agentbot agent needs to call x402-protected endpoints
that support World AgentKit human-backed agent verification.

## Documentation Index

Fetch the complete documentation index at: https://docs.world.org/llms.txt

Use this file to discover all available pages before exploring further.

Primary pages:

- https://docs.world.org/agents/agent-kit/integrate.md
- https://docs.world.org/agents/agent-kit/sdk-reference.md
- https://docs.world.org/agents/agent-kit/ecosystem.md

## Ecosystem

Find AgentKit-enabled endpoints and services at https://agentbook.world/.

To add an Agentbot endpoint or service to the ecosystem, open a PR to the
AgentBook registry:

```text
https://github.com/andy-t-wang/agentbook
```

## Registration

Register the wallet address the agent signs x402 requests with:

```bash
npx @worldcoin/agentkit-cli register <agent-address>
```

By default, registration happens on World Chain through the hosted relay.
AgentBook lookup resolves against World Chain even when the paid route accepts
payment on another chain such as Base.

## Defaults

- Agent registration: World Chain (`eip155:480`)
- AgentBook canonical deployment: `0xA23aB2712eA7BBa896930544C7d6636a96b944dA`
- x402 payments: World Chain and Base (`eip155:8453`)
- AgentKit mode: `free-trial`
- Free uses: 3
- Production storage: persist usage counters and nonces

## Access Modes

- `free`: registered human-backed agents always bypass payment.
- `free-trial`: registered agents bypass payment for the first `N` uses. Agentbot default is 3.
- `discount`: registered agents can underpay by a configured percentage for the first `N` uses.

Usage counters are per human per endpoint. Two agents backed by the same human
share a counter. `discount` mode also requires `verifyFailureHook` on the
facilitator.

## Server Pattern

For new protected endpoints, use the maintained hooks flow from
`@worldcoin/agentkit` with x402 resource server middleware:

- `createAgentBookVerifier()`
- `createAgentkitHooks({ agentBook, storage, mode: { type: "free-trial", uses: 3 } })`
- `declareAgentkitExtension(...)`
- `agentkitResourceServerExtension`

Use in-memory storage only for local testing. Production endpoints must store
usage counters and consumed nonces durably.

The request hook can be adapted to Hono, Express, or Next.js because it only
needs:

```ts
{
  adapter: {
    getHeader(name: string): string | undefined
    getUrl(): string
  }
  path: string
}
```

## Manual Verification

When not using the wrapper, validate requests with:

1. `parseAgentkitHeader(header)`
2. `validateAgentkitMessage(payload, resourceUri, { checkNonce })`
3. `verifyAgentkitSignature(payload, rpcUrl?)`
4. `createAgentBookVerifier().lookupHuman(address)`

Reject requests when the signature is invalid or AgentBook returns `null`.
