# Custom Domains and JWT Security

Configuration guide for custom domains (CNAME setup for ingest and playback) and JWT signing for secure video access.

## Custom Domains

### Custom Domain for Live Ingest

CNAME-ing (Canonical Naming) allows you to use your own domain name instead of the default Mux domain for live streaming ingest.

**Setup Steps:**

1. Add a CNAME record to your domain's DNS settings
2. Configure it to point to `global-live.mux.com`
3. Wait for DNS propagation (may take a few hours)

**Protocol Support:**

| Protocol | Custom Domain Support |
|----------|----------------------|
| RTMP | Supported |
| SRT | Supported |
| RTMPS | Not supported |

For RTMP and SRT, configure the CNAME record to point at the relevant ingest URL's domain (such as `global-live.mux.com` or a regional live ingest URL).

**Example URLs:**

```text
# Default RTMPS URL
rtmps://global-live.mux.com:443/app

# Default RTMP URL
rtmp://global-live.mux.com:5222/app

# Custom domain RTMP URL
rtmp://your-cname.your-site.com:5222/app
```

The CNAME does not need to be `global-live` - it can be any subdomain you choose.

**DNS Provider Documentation:**

- Cloudflare: CNAME setup configuration
- Google Domains: Adding CNAME records
- AWS Route 53: CNAME record format
- GoDaddy: Add a CNAME record

### Custom Domain for Video and Image Delivery

Custom domains for delivery allow you to serve videos and images from your own domain rather than `stream.mux.com` or `images.mux.com`.

**Use Cases:**

- Consistent brand presence across all assets
- Sandboxing videos
- Allowlisting requirements

**Availability:**

Custom domains for playback is available for customers with an annual Mux contract. Without an annual contract, this feature can be added for $100 per month. Contact Mux Support to get set up.

## JWT Security

### What is a JWT?

JSON Web Tokens (JWTs) are an open, industry standard method for representing claims securely between two parties. JWTs consist of:

- **Header**: Contains metadata useful for decrypting the rest of the token
- **Payload**: Contains configuration options (claims)
- **Signature**: Generated from a signing key-pair using the RS256 algorithm

### Creating Signing Keys

Signing keys can be created from:

1. The [Signing Keys section](https://dashboard.mux.com/settings/signing-keys) of the Mux Dashboard
2. The Mux System API

When you create a new signing key, the API generates a 2048-bit RSA key-pair and returns:
- The private key (base64-encoded) - store this securely
- A generated key ID - used in the JWT `kid` claim

Mux stores the public key to validate signed tokens.

**API Response Example:**

```json
{
  "data": {
    "private_key": "(base64-encoded PEM file with private key)",
    "id": "(unique signing-key identifier)",
    "created_at": "(UNIX Epoch seconds)"
  }
}
```

### Signing JWTs During Development

#### Web-Based JWT Signer

Mux provides a web-based JWT signer at https://jwt.mux.dev for development use.

**Important:** This tool signs JWTs on the client, meaning credentials never leave your machine. Never use similar tools hosted on non-Mux domains.

#### Node.js CLI

After installing Node.js, initialize the Mux CLI with an Access Token:

```bash
npx @mux/cli init
```

Sign a JWT for video playback:

```bash
npx @mux/cli sign PLAYBACK-ID
```

**Security Best Practices:**

- Only sign JWTs on the server where you can keep your signing key secret
- Never put your signing key in client-side code
- Set up a REST endpoint behind your own authentication system that provides client-side code with signed JWTs

### JWT Claims Reference

**Required Claims:**

| Claim | Description | Value |
|-------|-------------|-------|
| `sub` | Subject of the JWT | Mux Video Playback ID |
| `aud` | Audience (intended application) | `v` (Video/Subtitles), `t` (Thumbnail), `g` (GIF), `s` (Storyboard), `d` (DRM License) |
| `exp` | Expiration time | UNIX Epoch seconds when token expires |
| `kid` | Key Identifier | Key ID from signing key creation |

**Optional Claims:**

| Claim | Description | Value |
|-------|-------------|-------|
| `playback_restriction_id` | Playback Restriction ID | Restricts playback based on referrer or user-agent |
| `custom` | Custom parameters | Object for tracking/identification purposes |

### Signing JWTs for Production

#### Node.js

```javascript
const Mux = require('@mux/mux-node');
const mux = new Mux();

async function createTokens () {
  const playbackId = ''; // Enter your signed playback id here

  let baseOptions = {
    keyId: '', // Enter your signing key id here
    keySecret: '', // Enter your base64 encoded private key here
    expiration: '7d', // E.g 60, "2 days", "10h", "7d"
  };

  const token = await mux.jwt.signPlaybackId(playbackId, { ...baseOptions, type: 'video' });
  console.log('video token', token);

  // Signed playback URL: https://stream.mux.com/${playbackId}.m3u8?token=${token}

  // For GIFs with parameters
  const gifToken = await mux.jwt.signPlaybackId(playbackId, {
    ...baseOptions,
    type: 'gif',
    params: { time: '10' },
  });

  // GIF URL: https://image.mux.com/${playbackId}/animated.gif?token=${gifToken}

  // For thumbnails with playback restrictions
  const thumbnailToken = await mux.jwt.signPlaybackId(playbackId, {
    ...baseOptions,
    type: 'thumbnail',
    params: { playback_restriction_id: YOUR_PLAYBACK_RESTRICTION_ID },
  });

  // Thumbnail URL: https://image.mux.com/${playbackId}/thumbnail.png?token=${thumbnailToken}
}
```

#### Ruby

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

#### Python

```python
# pip install pyjwt cryptography

import jwt
import base64
import time

playback_id = ''        # Enter your signed playback id here
signing_key_id = ''     # Enter your signing key id here
private_key_base64 = '' # Enter your base64 encoded private key here

private_key = base64.b64decode(private_key_base64)

token = {
    'sub': playback_id,
    'exp': int(time.time()) + 3600, # 1 hour
    'aud': 'v'
}
headers = {
    'kid': signing_key_id
}

json_web_token = jwt.encode(
    token, private_key, algorithm="RS256", headers=headers)

print(json_web_token)
```

#### PHP

```php
<?php
  // Using Composer and https://github.com/firebase/php-jwt
  require __DIR__ . '/vendor/autoload.php';
  use \Firebase\JWT\JWT;

  $playbackId = ""; // Enter your signed playback id here
  $keyId = "";      // Enter your signing key id here
  $keySecret = "";  // Enter your base64 encoded private key here

  $payload = array(
    "sub" => $playbackId,
    "aud" => "t",          // v = video, t = thumbnail, g = gif
    "exp" => time() + 600, // Expiry time in epoch - now + 10 mins
    "kid" => $keyId,

    // Optional image manipulations
    "time"     => 10,
    "width"    => 640,
    "fit_mode" => "smartcrop"
  );

  $jwt = JWT::encode($payload, base64_decode($keySecret), 'RS256');

  print "$jwt\n";
?>
```

#### Go

```go
package main

import (
    "encoding/base64"
    "fmt"
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

    fmt.Println(tokenString)
}
```

### Signing Data JWTs (Viewer Counts)

For signing JWTs to access Mux Data (e.g., viewer counts):

#### Node.js

```javascript
import Mux from '@mux/mux-node';
const mux = new Mux();

const myId = ''; // Video ID, asset ID, playback ID, or live stream ID
const myIdType = ''; // video_id | asset_id | playback_id | live_stream_id
const signingKeyId = '';
const privateKeyBase64 = '';

const getViewerCountsToken = async () => {
    return await mux.jwt.signViewerCounts(myId, {
        expiration: '1 day',
        type: myIdType,
        keyId: signingKeyId,
        keySecret: privateKeyBase64,
    });
};
```

### Using Signed URLs

Supply the JWT in the resource URL using the `token` query parameter:

**Video URL:**
```
https://stream.mux.com/{playback-id}.m3u8?token={JWT}
```

**Thumbnail URL:**
```
https://image.mux.com/{playback-id}/thumbnail.{format}?token={JWT}
```

**Important:** Passing a `token` parameter for public playback IDs will fail. This prevents false appearance of security.

### Expiration Time Considerations

- Set expiration to at least the duration of the asset or expected live stream duration
- When the signed URL expires, playback stops even if already in progress
- Handle cases where users leave and return - fetch new signed URLs as needed

### Query Parameters and Signing

When signing URLs with parameters (like thumbnail options), include them in the JWT claims, not the URL:

**Correct approach:**
```javascript
// Include time in JWT claims
sign(signedPlaybackId, { ...requiredTokenOptions, params: { time: 25 } })

// Resulting URL - no query params except token
https://image.mux.com/{signed_playback_id}/thumbnail.jpg?token={token}
```

**Incorrect approach:**
```
https://image.mux.com/{signed_playback_id}/thumbnail.jpg?time=25&token={token}
```

This also applies to playback modifiers like `default_subtitles_lang`, `redundant_streams`, and `roku_trick_play`.

### Custom Parameters for Tracking

Include custom parameters in a `custom` key for tracking purposes:

```json
{
  "sub": "{PLAYBACK_ID}",
  "aud": "{AUDIENCE_TYPE}",
  "exp": "{EXPIRATION_TIME}",
  "custom": {
    "session_id": "xxxx-123"
  }
}
```

**Guidelines:**
- Never include personally identifiable information (PII)
- Always nest custom parameters inside the `custom` key

## Playback Restrictions

### Creating Playback Restrictions

Playback restrictions allow additional rules for video playback:

**API Request:**
```json
POST https://api.mux.com/video/v1/playback-restrictions

{
  "referrer": {
    "allowed_domains": ["example.com"],
    "allow_no_referrer": false
  },
  "user_agent": {
    "allow_no_user_agent": false,
    "allow_high_risk_user_agent": false
  }
}
```

### Referrer Restriction Syntax

```json
{
  "referrer": {
    "allowed_domains": [
      "*.example.com",
      "foo.com"
    ],
    "allow_no_referrer": false
  }
}
```

**Options:**
- Empty array `[]`: Deny all domains
- `["*.example.com", "example.com"]`: Allow example.com and all subdomains
- `["*"]`: Allow any domain
- Wildcards match one subdomain level only

### Considerations

- Up to 100 playback restrictions per environment
- Up to 100 domains per restriction
- Native iOS/Android apps do not send `Referer` headers
- For Chromecast support, add `www.gstatic.com` to allowed domains
- For AirPlay to third-party devices, add `mediaservices.cdn-apple.com`
- First-party Apple devices never send referrer headers - `allow_no_referrer` must be `true`

**Recommended approach:** Create two playback restrictions - one with `allow_no_referrer: true` for native apps and one with `allow_no_referrer: false` for web.
