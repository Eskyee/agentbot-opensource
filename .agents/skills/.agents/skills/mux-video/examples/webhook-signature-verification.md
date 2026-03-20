# Example: Verify Webhook Signatures

Practical code examples for verifying Mux webhook signatures in your application. Shows how to extract timestamps and signatures, compute HMAC-SHA256, and validate incoming webhooks.

## Prerequisites

- Webhook endpoint configured in Mux dashboard
- Webhook signing secret from dashboard settings

## Obtaining Your Signing Secret

Before implementing verification, obtain your signing secret from the [Mux dashboard webhooks settings page](https://dashboard.mux.com/settings/webhooks). Note that the signing secret is unique for each webhook endpoint.

## Understanding the Mux-Signature Header

Webhooks contain a header called `Mux-Signature` with the timestamp and signature:

```text
Mux-Signature: t=1565220904,v1=20c75c1180c701ee8a796e81507cfd5c932fc17cf63a4a55566fd38da3a2d3d2
```

- **Timestamp**: Prefixed by `t=`
- **Signature**: Prefixed by scheme `v1=`
- **Algorithm**: HMAC with SHA-256

## Verification Steps

### Step 1: Extract the Timestamp and Signature

Split the header at the `,` character and get the values for `t` (timestamp) and `v1` (the signature).

### Step 2: Prepare the Signed Payload String

Concatenate three components:
1. The timestamp from Step 1 as a string (e.g., "1565220904")
2. The dot character `.`
3. The raw request body (JSON in string format)

### Step 3: Compute the Expected Signature

Compute an HMAC with SHA256 using your signing secret:

```javascript
secret = 'my secret' // your signing secret
payload = timestamp + "." + request_body
expected_signature = createHmacSha256(payload, secret)
```

### Step 4: Compare Signatures

Compare the signature in the header to the expected signature. If they match, verify the timestamp is within tolerance (default: 5 minutes).

## Code Examples

### Node.js (Using Mux SDK)

The official Node.js SDK provides helper methods for verification:

```javascript
import Mux from '@mux/mux-node';

// check the mux-node-sdk docs for details
// https://github.com/muxinc/mux-node-sdk/blob/master/api.md#webhooks
const mux = new Mux();
mux.webhooks.verifySignature(body, headers, secret);
```

### Elixir (Using Mux SDK)

```elixir
# check the mux-elixr docs for details and a full example using Phoenix
# https://github.com/muxinc/mux-elixir#verifying-webhook-signatures-in-phoenix
Mux.Webhooks.verify_header(raw_body, signature_header, secret)
```

### Laravel (PHP)

Full implementation for Laravel applications:

```php
/**
 * Verify the signature (laravel)
 *
 * @param Request $request
 * @return boolean
 */
protected function verifySignature(Request $request)
{
    // Get the signature from the request header
    $muxSig = $request->header('Mux-Signature');

    if(empty($muxSig)) {
        return false;
    }

    // Split the signature based on ','.
    // Format is 't=[timestamp],v1=[hash]'
    $muxSigArray = explode(',', $muxSig);

    if(empty($muxSigArray) || empty($muxSigArray[0]) || empty($muxSigArray[1])) {
        return false;
    }

    // Strip the first occurence of 't=' and 'v1=' from both strings
    $muxTimestamp = Str::replaceFirst('t=', '', $muxSigArray[0]);
    $muxHash = Str::replaceFirst('v1=', '', $muxSigArray[1]);

    // Create a payload of the timestamp from the Mux signature and the request body with a '.' in-between
    $payload = $muxTimestamp . "." . $request->getContent();

    // Build a HMAC hash using SHA256 algo, using our webhook secret
    $ourSignature = hash_hmac('sha256', $payload, config('mux.webhook_secret'));

    // `hash_equals` performs a timing-safe crypto comparison
    return hash_equals($ourSignature, $muxHash);
}
```

### Go

Full implementation with helper functions:

```go
func generateHmacSignature(webhookSecret, payload string) string {
    h := hmac.New(sha256.New, []byte(webhookSecret))
    h.Write([]byte(payload))
    return hex.EncodeToString(h.Sum(nil))
}

func IsValidMuxSignature(req *http.Request, body []byte) error {
    muxSignature := req.Header.Get("Mux-Signature")

    if muxSignature == "" {
        return errors.New("no Mux-Signature in request header")
    }

    muxSignatureArr := strings.Split(muxSignature, ",")

    if len(muxSignatureArr) != 2 {
        return errors.New(fmt.Sprintf("Mux-Signature in request header should be 2 values long: %s", muxSignatureArr))
    }

    timestampArr := strings.Split(muxSignatureArr[0], "=")
    v1SignatureArr := strings.Split(muxSignatureArr[1], "=")

    if len(timestampArr) != 2 || len(v1SignatureArr) != 2 {
        return errors.New(fmt.Sprintf("missing timestamp: %s or missing v1Signature: %s", timestampArr, v1SignatureArr))
    }

    timestamp := timestampArr[1]
    v1Signature := v1SignatureArr[1]

    webhookSecret := "" //insert secret here or load from config file.
    payload := fmt.Sprintf("%s.%s", timestamp, string(body))
    sha := generateHmacSignature(webhookSecret, payload)

    if sha != v1Signature {
        return errors.New("not a valid mux webhook signature")
    }

    fmt.Println("timestamp sha:", sha)
    fmt.Println("v1Signature:", v1Signature)
    return nil
}
```

## Framework-Specific Examples with SDK Verification

### Remix

Using `mux.webhooks.unwrap()` for validation and type-safe payload access:

```typescript
import { json, type ActionFunctionArgs } from "@remix-run/node";
import Mux from "@mux/mux-node";

// this reads your MUX_TOKEN_ID and MUX_TOKEN_SECRET
// from your environment variables
// https://dashboard.mux.com/settings/access-tokens
const mux = new Mux();

// Mux webhooks POST, so let's use an action
export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const body = await request.text();
  // mux.webhooks.unwrap will validate that the given payload was sent by Mux and parse the payload.
  // It will also provide type-safe access to the payload.
  // Generate MUX_WEBHOOK_SIGNING_SECRET in the Mux dashboard
  // https://dashboard.mux.com/settings/webhooks
  const event = mux.webhooks.unwrap(
    body,
    request.headers,
    process.env.MUX_WEBHOOK_SIGNING_SECRET
  );

  // you can also unwrap the payload yourself:
  // const event = await request.json();
  switch (event.type) {
    case "video.upload.asset_created":
      // we might use this to know that an upload has been completed
      // and we can save its assetId to our database
      break;
    case "video.asset.ready":
      // we might use this to know that a video has been encoded
      // and we can save its playbackId to our database
      break;
    // there are many more Mux webhook events
    // check them out at https://www.mux.com/docs/webhook-reference
    default:
      break;
  }

  return json({ message: "ok" });
};
```

### SvelteKit

```typescript
import mux from '$lib/mux';
import { json, type RequestHandler } from '@sveltejs/kit';
import { MUX_WEBHOOK_SIGNING_SECRET } from '$env/static/private';

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.text();
  // mux.webhooks.unwrap will validate that the given payload was sent by Mux and parse the payload.
  // It will also provide type-safe access to the payload.
  // Generate MUX_WEBHOOK_SIGNING_SECRET in the Mux dashboard
  // https://dashboard.mux.com/settings/webhooks
  const event = mux.webhooks.unwrap(body, request.headers, MUX_WEBHOOK_SIGNING_SECRET);

  // you can also unwrap the payload yourself:
  // const event = await request.json();
  switch (event.type) {
    case 'video.upload.asset_created':
      // we might use this to know that an upload has been completed
      // and we can save its assetId to our database
      break;
    case 'video.asset.ready':
      // we might use this to know that a video has been encoded
      // and we can save its playbackId to our database
      break;
    // there are many more Mux webhook events
    // check them out at https://www.mux.com/docs/webhook-reference
    default:
      break;
  }

  return json({ message: 'ok' });
};
```

## Key Implementation Notes

1. **Use Raw Request Body**: Always use the raw request body string for signature verification, not a parsed JSON object
2. **Timing-Safe Comparison**: Use constant-time comparison functions (like `hash_equals` in PHP) to prevent timing attacks
3. **Timestamp Tolerance**: The official SDKs allow a default tolerance of 5 minutes for timestamp validation
4. **Unique Secrets**: Each webhook endpoint has its own signing secret - do not share secrets between endpoints
5. **SDK Methods**: When using official SDKs, prefer the built-in verification methods (`verifySignature`, `unwrap`) over manual implementation
