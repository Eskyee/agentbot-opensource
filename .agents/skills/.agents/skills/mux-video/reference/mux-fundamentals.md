# Mux Fundamentals

Core concepts and terminology for building with Mux, including organizations, environments, access tokens, assets, playback IDs, live streams, signing keys, and webhooks.

## Quick Reference

| Term | Description |
| :--- | :---------- |
| **Organization** | The top-level account container. You can belong to multiple organizations, each with its own billing, team members, and environments. |
| **Environment** | A container within an organization for organizing your Mux resources (assets, live streams, API tokens, etc.). Each organization can have multiple environments. |
| **Access Token** | A credential pair (Token ID + Token Secret) used to authenticate API requests. Scoped to a single environment. |
| **Asset** | A video or audio file that has been uploaded to Mux and processed for streaming playback. |
| **Playback ID** | A unique identifier used to stream an asset or live stream to viewers. |
| **Live Stream** | A resource representing a live broadcast that can receive RTMP/SRT input and deliver to viewers. |
| **Stream Key** | A secret credential that allows a broadcaster to push video to a specific live stream. |
| **Signing Key** | A public/private key pair used to create signed tokens (JWTs) for secure playback. |
| **Webhook** | An HTTP callback that Mux sends to your server when events occur (e.g., asset ready, live stream started). |

## Organizations and Environments Hierarchy

### Organizations

An **organization** is your top-level Mux account. It is the highest container in the Mux hierarchy and contains everything else: environments, team members, and billing settings.

Key things to know about organizations:

- **You can belong to multiple organizations.** This is useful if you work with different companies or clients, each with their own Mux account.
- **Each organization has its own billing.** Usage charges are tracked and billed per organization.
- **Team members are managed at the organization level.** You can invite collaborators and assign roles (Admin, Member) within each organization.
- **Organizations contain environments.** All your media resources live inside environments, which live inside organizations.

### Environments

An **environment** is a container within an organization for organizing your Mux resources. Each environment has its own isolated set of assets, live streams, access tokens, signing keys, and webhooks.

Common use cases for multiple environments:

- Separate **development** and **production** resources
- Isolate resources for different websites or domains (e.g., `site1.com`, `site2.com`)
- Organize by project or use case (e.g., CMS media, marketing site, customer uploads)
- Keep test data separate from production content

**Important:** Resources are scoped to their environment. An access token created in Development cannot be used to manage assets in Production, and webhooks configured for one environment will not fire for events in another.

## Access Tokens and Permissions

**Access tokens** are credentials that authenticate your API requests to Mux. Each token consists of two parts:

| Part | Description |
| :--- | :---------- |
| **Token ID** | The "username" portion of your credential. Safe to log (but not expose publicly). |
| **Token Secret** | The "password" portion. Keep this secure and never expose it in client-side code. |

**Important notes:**

- Mux only stores a hash of your token secret. If you lose it, you will need to create a new access token.
- Mux API requests must be made from a server, not from client-side code. The API does not support CORS, and exposing your credentials in a browser or mobile app is a security risk.

### Token Permissions

When creating an access token, you configure which permissions it has:

| Permission | Use Case |
| :--------- | :------- |
| **Mux Video Read** | Retrieve information about assets and live streams |
| **Mux Video Write** | Create, update, and delete assets and live streams |
| **Mux Data Read** | Access playback performance metrics |
| **Mux Data Write** | Create Data annotations |
| **System Read** | View signing keys and other system resources |
| **System Write** | Create and manage signing keys |

For most use cases when getting started, you will want **Mux Video Read** and **Write** permissions.

## Assets and Playback IDs

### Assets

An **asset** is a video or audio file that has been ingested into Mux and processed for adaptive bitrate streaming. When you create an asset, Mux:

1. Downloads the file from your provided URL (or receives it via direct upload)
2. Transcodes it into multiple quality levels
3. Packages it for HLS streaming
4. Generates a unique **asset ID**

Example asset response:

```json
{
  "data": {
    "id": "01itgOBvgjAbES7Inwvu4kEBtsQ44HFL6",
    "status": "ready",
    "playback_ids": [
      {
        "id": "TXjw00EgPBPS6acv7gBUEJ14PEr5XNWOe",
        "policy": "public"
      }
    ],
    "duration": 120.5,
    "aspect_ratio": "16:9"
  }
}
```

### Asset Status Lifecycle

| Status | Description |
| :----- | :---------- |
| `preparing` | Mux is downloading and processing the file |
| `ready` | The asset is ready for playback |
| `errored` | Something went wrong during processing |

Rather than polling the API to check status, use webhooks to be notified when an asset is ready.

### Playback IDs

A **playback ID** is what you use to actually stream content to viewers. While asset IDs are used to _manage_ your content (via `api.mux.com`), playback IDs are used to _stream_ your content (via `stream.mux.com`).

```
https://stream.mux.com/{PLAYBACK_ID}.m3u8
```

### Playback Policies

Each playback ID has a policy that controls how it can be accessed:

| Policy | Description |
| :----- | :---------- |
| `public` | Anyone with the URL can access the content |
| `signed` | Viewers need a valid JWT token to watch |

An asset can have multiple playback IDs with different policies. This lets you, for example, have a public playback ID for trailers and a signed playback ID for the full content.

You can add and remove playback IDs without affecting the underlying asset. This is useful for revoking access without re-encoding your content.

## Live Streams and Stream Keys

A **live stream** represents a live broadcast channel. Unlike assets (which are created from existing files), live streams receive real-time input and deliver it to viewers with low latency.

### Key Live Stream Components

| Component | Description |
| :-------- | :---------- |
| **Stream Key** | A secret credential broadcasters use to connect their encoder to Mux |
| **RTMP URL** | The ingest endpoint (`rtmp://global-live.mux.com:5222/app`) |
| **SRT URL** | Alternative ingest endpoint for SRT protocol |
| **Playback ID** | Used to stream to viewers (same concept as asset playback IDs) |

**Important:** Anyone with your stream key can broadcast to your live stream. Treat it like a password.

### Live Stream Lifecycle

| Status | Description |
| :----- | :---------- |
| `idle` | No one is broadcasting; waiting for input |
| `active` | A broadcaster is connected and viewers can watch |
| `disabled` | The live stream has been disabled and will not accept connections |

When a live stream ends, Mux automatically creates a new asset from the recording (if recording is enabled).

## Signing Keys for Secure Playback

**Signing keys** are cryptographic key pairs used to generate JWTs (JSON Web Tokens) for secure video playback. When you have assets or live streams with `signed` playback policies, you need signing keys to create valid playback tokens.

| Component | Description |
| :-------- | :---------- |
| **Key ID** | A unique identifier for the signing key |
| **Private Key** | Used by your server to sign JWTs. Keep this secret. |

Your server uses the private key to create short-lived tokens that grant access to specific content. The token can include claims for:

- **Expiration time** - When the token becomes invalid
- **Playback restrictions** - Additional rules like allowed domains

### Signing Keys vs Access Tokens

Signing keys and access tokens serve different purposes:

- **Access tokens** authenticate your server-to-Mux API requests
- **Signing keys** create tokens that authenticate viewer playback requests

## Webhooks Overview

**Webhooks** are HTTP callbacks that Mux sends to your application when events occur. Instead of repeatedly polling the API to check if an asset is ready, you configure a webhook URL and Mux notifies you automatically.

### Common Webhook Events

| Event | Description |
| :---- | :---------- |
| `video.asset.ready` | An asset has finished processing and is ready for playback |
| `video.asset.errored` | An asset failed to process |
| `video.live_stream.active` | A live stream has started broadcasting |
| `video.live_stream.idle` | A live stream has stopped broadcasting |
| `video.upload.asset_created` | A direct upload has completed and created an asset |

**Important:** Webhooks are configured per environment. Make sure your webhook is set up in the same environment where your resources are created.

## ID Types Reference

Mux uses several different types of identifiers:

| ID Type | Format Example | Purpose |
| :------ | :------------- | :------ |
| **Organization ID** | `abc123` | Identify your organization |
| **Environment ID** | `j0863n` | Identify specific environments within an organization |
| **Asset ID** | `01itgOBvgj...` | Identify and manage assets via the API |
| **Playback ID** | `TXjw00EgPB...` | Stream content to viewers |
| **Live Stream ID** | `aA02skpHX...` | Identify and manage live streams via the API |
| **Upload ID** | `OA02dANZ...` | Track direct upload status |
| **Token ID** | `44c819de-4add-...` | Identify access tokens (part of API auth) |
| **Signing Key ID** | `JjPXgkqO...` | Identify signing keys for JWT creation |

## Official SDKs

Mux provides official SDKs for several languages that handle authentication and make it easier to work with the API:

- Node.js
- Python
- Ruby
- PHP
- Java
- C# / .NET
- Elixir
