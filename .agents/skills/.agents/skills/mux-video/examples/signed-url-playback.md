# Implementing Signed URL Playback

Complete example demonstrating how to secure video playback using signed URLs, including JWT generation on the server, token configuration in Mux Player, and handling thumbnail/storyboard tokens.

## Overview

Signed URLs protect video content by requiring a valid JSON Web Token (JWT) to access playback. This ensures only authorized viewers can access your content, with optional restrictions on expiration time, allowed domains, and user agents.

## Step 1: Create an Asset with Signed Playback Policy

When creating an asset, set the `playback_policy` to `signed`:

```json
// POST https://api.mux.com/video/assets

{
  "inputs": [
    {
      "url": "https://storage.googleapis.com/muxdemofiles/mux-video-intro.mp4"
    }
  ],
  "playback_policies": [
    "signed"
  ],
  "video_quality": "basic"
}
```

## Step 2: Create a Signing Key

Create a signing key from the Mux Dashboard or via the API. Signing keys are different from API keys and are used specifically for generating JWTs.

```json
// POST https://api.mux.com/system/v1/signing-keys

// Response:
{
  "data": {
    "private_key": "(base64-encoded PEM file with private key)",
    "id": "(unique signing-key identifier)",
    "created_at": "(UNIX Epoch seconds)"
  }
}
```

Store the `private_key` and `id` securely on your server.

## Step 3: Generate JWTs on the Server

JWTs must be generated server-side to keep your signing key secret. Each resource type requires a separate token with a specific audience claim.

### JWT Claims Structure

Required claims for all signed requests:

| Claim | Description | Value |
|-------|-------------|-------|
| `sub` | Subject | Mux Video Playback ID |
| `aud` | Audience | `v` (Video), `t` (Thumbnail), `g` (GIF), `s` (Storyboard), `d` (DRM License) |
| `exp` | Expiration | UNIX Epoch seconds when token expires |
| `kid` | Key ID | Signing key identifier |

Optional claims:

| Claim | Description | Value |
|-------|-------------|-------|
| `playback_restriction_id` | Playback Restriction ID | Restricts playback to allowed domains/conditions |

### Node.js Example

```javascript
const Mux = require('@mux/mux-node');
const mux = new Mux();

async function createTokens() {
  const playbackId = ''; // Enter your signed playback id here

  // Base options for signing
  let baseOptions = {
    keyId: '',      // Enter your signing key id here
    keySecret: '',  // Enter your base64 encoded private key here
    expiration: '7d', // E.g 60, "2 days", "10h", "7d"
  };

  // Generate playback token (audience: 'v' for video)
  const playbackToken = await mux.jwt.signPlaybackId(playbackId, {
    ...baseOptions,
    type: 'video'
  });

  // Generate thumbnail token (audience: 't')
  const thumbnailToken = await mux.jwt.signPlaybackId(playbackId, {
    ...baseOptions,
    type: 'thumbnail'
  });

  // Generate storyboard token (audience: 's')
  const storyboardToken = await mux.jwt.signPlaybackId(playbackId, {
    ...baseOptions,
    type: 'storyboard'
  });

  return { playbackToken, thumbnailToken, storyboardToken };
}
```

### Python Example

```python
import jwt
import base64
import time

playback_id = ''        # Enter your signed playback id here
signing_key_id = ''     # Enter your signing key id here
private_key_base64 = '' # Enter your base64 encoded private key here

private_key = base64.b64decode(private_key_base64)

# Generate video playback token
token = {
    'sub': playback_id,
    'exp': int(time.time()) + 3600,  # 1 hour
    'aud': 'v'  # 'v' for video, 't' for thumbnail, 's' for storyboard
}
headers = {
    'kid': signing_key_id
}

json_web_token = jwt.encode(
    token, private_key, algorithm="RS256", headers=headers)
```

### Ruby Example

```ruby
require 'base64'
require 'jwt'

def sign_url(playback_id, audience, expires, signing_key_id, private_key, params = {})
    rsa_private = OpenSSL::PKey::RSA.new(Base64.decode64(private_key))
    payload = {sub: playback_id, exp: expires.to_i, kid: signing_key_id, aud: audience}
    payload.merge!(params)
    JWT.encode(payload, rsa_private, 'RS256')
end

playback_id = ''        # Enter your signed playback id here
signing_key_id = ''     # Enter your signing key id here
private_key_base64 = '' # Enter your base64 encoded private key here

token = sign_url(playback_id, 'v', Time.now + 3600, signing_key_id, private_key_base64)
```

### Go Example

```go
package main

import (
    "encoding/base64"
    "log"
    "time"

    "github.com/golang-jwt/jwt/v4"
)

func main() {
    playbackId := "" // Enter your signed playback id here
    keyId      := "" // Enter your signing key id here
    key        := "" // Enter your base64 encoded private key here

    decodedKey, err := base64.StdEncoding.DecodeString(key)
    if err != nil {
        log.Fatalf("Could not base64 decode private key: %v", err)
    }

    signKey, err := jwt.ParseRSAPrivateKeyFromPEM(decodedKey)
    if err != nil {
        log.Fatalf("Could not parse RSA private key: %v", err)
    }

    token := jwt.NewWithClaims(jwt.SigningMethodRS256, jwt.MapClaims{
        "sub": playbackId,
        "aud": "v",
        "exp": time.Now().Add(time.Minute * 15).Unix(),
        "kid": keyId,
    })

    tokenString, err := token.SignedString(signKey)
    if err != nil {
        log.Fatalf("Could not generate token: %v", err)
    }
}
```

### PHP Example

```php
<?php
require __DIR__ . '/vendor/autoload.php';
use \Firebase\JWT\JWT;

$playbackId = ""; // Enter your signed playback id here
$keyId = "";      // Enter your signing key id here
$keySecret = "";  // Enter your base64 encoded private key here

$payload = array(
  "sub" => $playbackId,
  "aud" => "t",          // v = video, t = thumbnail, g = gif, s = storyboard
  "exp" => time() + 600, // Expiry time - now + 10 mins
  "kid" => $keyId,

  // Optional: include additional thumbnail parameters
  "time"     => 10,
  "width"    => 640,
  "fit_mode" => "smartcrop"
);

$jwt = JWT::encode($payload, base64_decode($keySecret), 'RS256');
?>
```

## Step 4: Configure Mux Player with Tokens

Pass all three tokens (playback, thumbnail, storyboard) to Mux Player.

### HTML Web Component

```html
<mux-player
  playback-id="qIJBqaJPkhNXiHbed8j2jyx02tQQWBI5fL6WkIQYL63w"
  playback-token="your-playback-token"
  thumbnail-token="your-thumbnail-token"
  storyboard-token="your-storyboard-token"
  metadata-video-id="video-id-54321"
  metadata-video-title="Test video title"
  metadata-viewer-user-id="user-007"
></mux-player>
```

### React Component

```jsx
<MuxPlayer
  playbackId="qIJBqaJPkhNXiHbed8j2jyx02tQQWBI5fL6WkIQYL63w"
  metadata={{
    video_id: "video-id-54321",
    video_title: "Test video title",
    viewer_user_id: "user-id-007",
  }}
  tokens={{
    playback: "your-playback-token",
    thumbnail: "your-thumbnail-token",
    storyboard: "your-storyboard-token",
  }}
/>
```

### JavaScript Property Assignment

```javascript
const muxPlayer = document.querySelector("mux-player");
muxPlayer.tokens = {
  playback: "eyJhbGciOiJSUzI1NiI...",
  thumbnail: "eyJhbGciOiJSUzI1N...",
  storyboard: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsI...",
};
```

### Iframe Embed

```html
<iframe
  src="https://player.mux.com/qIJBqaJPkhNXiHbed8j2jyx02tQQWBI5fL6WkIQYL63w?playback-token=your-playback-token&thumbnail-token=your-thumbnail-token&storyboard-token=your-storyboard-token"
  style="aspect-ratio: 16/9; width: 100%; border: 0;"
  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
  allowfullscreen="true"
></iframe>
```

## Token Types Explained

Each token serves a specific purpose:

- **Playback token** (`aud: 'v'`): Required to stream the actual video content
- **Thumbnail token** (`aud: 't'`): Required for poster images and thumbnails
- **Storyboard token** (`aud: 's'`): Required for timeline hover previews (on-demand only, not supported for live streams)
- **DRM token** (`aud: 'd'`): Required for DRM-protected content playback

## Optional: Playback Restrictions

Add domain restrictions to further secure playback.

### Create a Playback Restriction

```json
// POST https://api.mux.com/video/v1/playback-restrictions

{
  "referrer": {
    "allowed_domains": [
      "example.com",
      "*.example.com"
    ],
    "allow_no_referrer": false
  },
  "user_agent": {
    "allow_no_user_agent": false,
    "allow_high_risk_user_agent": false
  }
}
```

### Include Restriction in JWT Claims

```json
{
  "sub": "{PLAYBACK_ID}",
  "aud": "v",
  "exp": 1234567890,
  "kid": "{SIGNING_KEY_ID}",
  "playback_restriction_id": "JL88SKXTr7r2t9tovH7SoYS8iLBVsjZ2qTuFS8NGAQY"
}
```

### Domain Syntax Options

- Empty array `[]`: Deny all domains
- Specific domain: `["example.com"]`
- Subdomain wildcard: `["*.example.com"]` (one level only)
- Allow all: `["*"]`

### Important Considerations

- Add `www.gstatic.com` if using Chromecast
- For AirPlay to third-party devices, add `mediaservices.cdn-apple.com`
- First-party Apple devices require `allow_no_referrer: true` for AirPlay
- Create separate restrictions for web (referrer checked) and native apps (no referrer)

## Handling Expiration Time

Set expiration time (`exp` claim) to at least the duration of the asset plus viewing time. When a token expires, playback stops even if already started.

For long videos or when users may pause and return later, implement token refresh logic in your application to fetch new tokens before expiration.

## Signed URL Format

### Video Playback URL

```
https://stream.mux.com/{playback-id}.m3u8?token={JWT}
```

### Thumbnail URL

```
https://image.mux.com/{playback-id}/thumbnail.{format}?token={JWT}
```

### Important: Query Parameters in Signed URLs

When signing URLs, include parameters in the JWT claims, not in the URL. The signed URL should only contain the `token` parameter.

**Correct:**
```
https://image.mux.com/{signed_playback_id}/thumbnail.jpg?token={token}
```

**Incorrect:**
```
https://image.mux.com/{signed_playback_id}/thumbnail.jpg?time=25&token={token}
```

Instead, include `time: 25` in the JWT claims body:

```javascript
const thumbnailToken = await mux.jwt.signPlaybackId(playbackId, {
  ...baseOptions,
  type: 'thumbnail',
  params: { time: 25 },
});
```

## Common Errors

Mux Player detects and reports common token errors to Mux Data:

- **Playback ID mismatch**: Token was signed for a different playback ID
- **Expired token**: Token expiration time has passed
- **Malformatted token**: Token structure is invalid

These errors appear in the browser console and Mux Data dashboard.

## Custom Parameters for Tracking

Include custom parameters in JWT claims to track unauthorized sharing:

```json
{
  "sub": "{PLAYBACK_ID}",
  "aud": "v",
  "exp": 1234567890,
  "custom": {
    "session_id": "xxxx-123"
  }
}
```

Never include personally identifiable information (PII) in tokens. Use anonymous identifiers only.

## Development Tools

For local development before setting up production JWT signing:

- **Web-based signer**: https://jwt.mux.dev (client-side, credentials never leave your machine)
- **Mux CLI**: `npx @mux/cli sign PLAYBACK-ID`

Initialize CLI first:
```bash
npx @mux/cli init
```

Then sign playback IDs:
```bash
npx @mux/cli sign PLAYBACK-ID
```
