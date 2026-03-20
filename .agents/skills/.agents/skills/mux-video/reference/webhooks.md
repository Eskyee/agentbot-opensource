# Webhooks Reference

Mux uses webhooks to notify your application when asynchronous events occur outside of an API request cycle. For example, you may want to update something on your end when an asset transitions from `processing` to `ready`, or when a live stream starts or ends.

When these events happen, Mux makes a POST request to the URL you configure, allowing you to handle the event appropriately.

## Key Behaviors

- Webhooks are scoped per **environment**. If you have configured webhooks but are not receiving them, verify the webhook is configured for the correct environment.
- If Mux does not receive a `2xx` response from your system, it will continue to retry the message for the next 24 hours with increasing delays between attempts.
- Duplicate webhook messages may be sent in certain situations, even if your service responds with a `2xx` response code. Ensure your webhook handler treats duplicated event delivery appropriately.
- A single request attempt will timeout after 5 seconds. If your processing takes longer, consider handling the work in an asynchronous task so you can respond to the event immediately.

## Webhooks vs Polling

Use webhooks to track asset status rather than polling the Asset API. Webhooks are more efficient for both you and Mux. GET requests to the `/assets` endpoint are rate limited, which means polling the `/assets` API does not scale.

---

## Configuring Webhook Endpoints

Webhook endpoints are configured in the Mux dashboard under **Settings > Webhooks**.

1. Navigate to the Mux dashboard
2. Go to **Settings**
3. Select **Webhooks**
4. Enter a URL from your application that Mux will call for event notifications
5. Save the webhook configuration

Each webhook endpoint receives a unique signing secret that you can use to verify the authenticity of incoming webhook requests.

---

## Webhook Payload Structure

When an event occurs, Mux sends a POST request to your configured URL with a JSON payload. Here is the structure of a webhook event:

```json
{
  "type": "video.asset.ready",
  "object": {
    "type": "asset",
    "id": "0201p02fGKPE7MrbC269XRD7LpcHhrmbu0002"
  },
  "id": "3a56ac3d-33da-4366-855b-f592d898409d",
  "environment": {
    "name": "Demo pages",
    "id": "j0863n"
  },
  "data": {
    "tracks": [
      {
        "type": "video",
        "max_width": 1280,
        "max_height": 544,
        "max_frame_rate": 23.976,
        "id": "0201p02fGKPE7MrbC269XRD7LpcHhrmbu0002",
        "duration": 153.361542
      },
      {
        "type": "audio",
        "max_channels": 2,
        "max_channel_layout": "stereo",
        "id": "FzB95vBizv02bYNqO5QVzNWRrVo5SnQju",
        "duration": 153.361497
      }
    ],
    "status": "ready",
    "max_stored_resolution": "SD",
    "max_stored_frame_rate": 23.976,
    "id": "0201p02fGKPE7MrbC269XRD7LpcHhrmbu0002",
    "duration": 153.361542,
    "created_at": "2018-02-15T01:04:45.000Z",
    "aspect_ratio": "40:17"
  },
  "created_at": "2018-02-15T01:04:45.000Z",
  "accessor_source": null,
  "accessor": null,
  "request_id": null
}
```

### Payload Fields

| Field | Description |
|-------|-------------|
| `type` | The event type (e.g., `video.asset.ready`) |
| `object.type` | The type of object the event relates to (e.g., `asset`, `live_stream`) |
| `object.id` | The ID of the object |
| `id` | Unique identifier for this webhook event |
| `environment.name` | Name of the Mux environment |
| `environment.id` | ID of the Mux environment |
| `data` | The full object data at the time of the event |
| `created_at` | Timestamp when the event occurred |
| `accessor_source` | Source of the accessor (if applicable) |
| `accessor` | Accessor information (if applicable) |
| `request_id` | Associated request ID (if applicable) |

---

## Event Types

### Asset Events

| Event | Description |
|-------|-------------|
| `video.asset.created` | Asset has been created |
| `video.asset.ready` | Asset is ready for playback. You can now use the asset's `playback_id` to successfully start streaming this asset. |
| `video.asset.errored` | Asset has encountered an error. Use this to notify your server about assets with errors. Asset errors can happen for a number of reasons, most commonly an input URL that Mux is unable to download or a file that is not a valid video file. |
| `video.asset.updated` | Asset has been updated. Use this to make sure your server is notified about changes to assets. |
| `video.asset.deleted` | Asset has been deleted. Use this so that your server knows when an asset has been deleted, at which point it will no longer be playable. |
| `video.asset.live_stream_completed` | The live stream for this asset has completed. Every time a live stream starts and ends a new asset gets created and this event fires. |
| `video.asset.static_renditions.ready` | Static renditions for this asset are ready. Static renditions are streamable mp4 files most commonly used for allowing users to download files for offline viewing. |
| `video.asset.static_renditions.preparing` | Static renditions for this asset are being prepared. |
| `video.asset.static_renditions.deleted` | Static renditions for this asset have been deleted. The static renditions (mp4 files) for this asset will no longer be available. |
| `video.asset.static_renditions.errored` | Preparing static renditions for this asset has encountered an error. This should be rare; if you see it unexpectedly, open a support ticket. |
| `video.asset.master.ready` | Master access for this asset is ready. Master access is used when downloading an asset for editing or post-production work. The master access file is not intended to be streamed or downloaded by end-users. |
| `video.asset.master.preparing` | Master access for this asset is being prepared. |
| `video.asset.master.deleted` | Master access for this asset has been deleted. You will no longer be able to download the master file. |
| `video.asset.master.errored` | Master access for this asset has encountered an error. This should be rare; if you see it unexpectedly, open a support ticket. |
| `video.asset.track.created` | A new track for this asset has been created (e.g., a subtitle text track). |
| `video.asset.track.ready` | A track for this asset is ready. For subtitle text tracks, the text track will now be delivered with your HLS stream. |
| `video.asset.track.errored` | A track for this asset has encountered an error. Most commonly this could be a text track file that Mux was unable to download for processing. |
| `video.asset.track.deleted` | A track for this asset has been deleted. |
| `video.asset.warning` | Mux has encountered a non-fatal issue with the recorded asset of the live stream. Currently only fired when Mux is unable to download a slate image from the `reconnect_slate_url` parameter value. |

### Upload Events

| Event | Description |
|-------|-------------|
| `video.upload.asset_created` | An asset has been created from this upload. This is useful to know when a user of your application has finished uploading a file using a Direct Upload URL. |
| `video.upload.cancelled` | Upload has been canceled. This event fires after hitting the cancel direct upload API. |
| `video.upload.created` | Upload has been created. This event fires after creating a direct upload. |
| `video.upload.errored` | Upload has encountered an error. This event fires when the asset created by the direct upload fails. Most commonly this happens when an end-user uploads a non-video file. |

### Live Stream Events

| Event | Description |
|-------|-------------|
| `video.live_stream.created` | A new live stream has been created. Broadcasters with a `stream_key` can start sending encoder feed to this live stream. |
| `video.live_stream.connected` | An encoder has successfully connected to this live stream. |
| `video.live_stream.recording` | Recording on this live stream has started. Mux has successfully processed the first frames from the encoder. If you show a "red dot" icon in your UI, this is a good time to show it. |
| `video.live_stream.active` | This live stream is now "active". The live stream's `playback_id` OR the `playback_id` associated with this live stream's asset can be used to create HLS URLs (`https://stream.mux.com/{PLAYBACK_ID}.m3u8`) and start streaming in your player. Before the live stream is `"active"`, trying to stream the HLS URL will result in HTTP `412` errors. |
| `video.live_stream.disconnected` | An encoder has disconnected from this live stream. Note that while disconnected the live stream is still `status: "active"`. |
| `video.live_stream.idle` | The `reconnect_window` for this live stream has elapsed. The live stream `status` will now transition to `"idle"`. |
| `video.live_stream.updated` | This live stream has been updated (e.g., after resetting the live stream's stream key). |
| `video.live_stream.enabled` | This live stream has been enabled via the enable live stream API. |
| `video.live_stream.disabled` | This live stream has been disabled via the disable live stream API. Disabled live streams will no longer accept new RTMP connections. |
| `video.live_stream.deleted` | This live stream has been deleted via the delete live stream API. |
| `video.live_stream.warning` | Mux has encountered a non-fatal issue. There is no disruption to the live stream ingest and playback. Currently only fired when Mux is unable to download an image from the `reconnect_slate_url` parameter value. |

### Simulcast Target Events

These events are useful when creating a UI that shows users the status of their configured 3rd party streaming endpoints.

| Event | Description |
|-------|-------------|
| `video.live_stream.simulcast_target.created` | A new simulcast target has been created for this live stream. |
| `video.live_stream.simulcast_target.idle` | When the parent live stream is `"disconnected"`, all simulcast targets will be `"idle"`. |
| `video.live_stream.simulcast_target.starting` | When the parent live stream fires `"connected"`, simulcast targets transition to `"starting"`. |
| `video.live_stream.simulcast_target.broadcasting` | Mux has successfully connected to the simulcast target and has begun pushing content to that third party. |
| `video.live_stream.simulcast_target.errored` | Mux has encountered an error while attempting to connect to the third party streaming service or while broadcasting. Mux will try to re-establish the connection; if successful, the simulcast target will transition back to `"broadcasting"`. |
| `video.live_stream.simulcast_target.updated` | This simulcast target has been updated. |
| `video.live_stream.simulcast_target.deleted` | This simulcast target has been deleted. |

---

## Signature Verification

Mux includes a signature in each webhook request header that you can use to verify the request was sent by Mux and not a third party.

### Obtaining Your Signing Secret

1. Go to the [webhooks settings page](https://dashboard.mux.com/settings/webhooks) in the Mux dashboard
2. Find your signing secret for each webhook endpoint
3. Note that the signing secret is different for each webhook endpoint

### Signature Header Format

Webhooks contain a header called `Mux-Signature` with the timestamp and signature:

```
Mux-Signature: t=1565220904,v1=20c75c1180c701ee8a796e81507cfd5c932fc17cf63a4a55566fd38da3a2d3d2
```

- `t=` is the timestamp (Unix epoch time)
- `v1=` is the signature (HMAC with SHA-256)

### Verification Steps

#### Step 1: Extract the Timestamp and Signature

Split the header at the `,` character and get the values for `t` (timestamp) and `v1` (signature).

#### Step 2: Prepare the Signed Payload String

Concatenate:
1. The timestamp from Step 1 as a string (e.g., `"1565220904"`)
2. The dot character `.`
3. The raw request body (JSON in string format)

#### Step 3: Compute the Expected Signature

Use HMAC with the SHA256 hash function:

```js
secret = 'your_signing_secret';
payload = timestamp + "." + request_body;
expected_signature = createHmacSha256(payload, secret);
```

#### Step 4: Compare Signatures

Compare the signature in the header to your expected signature. If they match, verify the timestamp is within an acceptable tolerance (recommended: 5 minutes) to prevent replay attacks.

### Code Examples

#### Node.js (using Mux SDK)

```js
import Mux from '@mux/mux-node';

// check the mux-node-sdk docs for details
// https://github.com/muxinc/mux-node-sdk/blob/master/api.md#webhooks
const mux = new Mux();
mux.webhooks.verifySignature(body, headers, secret);
```

#### Elixir (using Mux SDK)

```elixir
# check the mux-elixir docs for details and a full example using Phoenix
# https://github.com/muxinc/mux-elixir#verifying-webhook-signatures-in-phoenix
Mux.Webhooks.verify_header(raw_body, signature_header, secret)
```

#### Laravel (PHP)

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

#### Go

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

    return nil
}
```

---

## Handling Webhooks Locally

When developing locally, your application typically runs on a URL like `https://localhost:3000` which is not accessible from the internet. To receive webhooks during local development, you need to create a secure tunnel.

### Using ngrok

[ngrok](https://ngrok.com/docs/integrations/mux/webhooks/) is a popular tool for exposing your local application to the internet.

**Note:** You need to create an ngrok account (a free account is sufficient for most testing purposes).

#### Steps

1. Install ngrok and authenticate
2. Start your local application (e.g., on `http://localhost:3000`)
3. Run ngrok to create a tunnel:

```bash
ngrok http 3000
```

4. ngrok provides a public URL that looks something like:

```
https://025c-2603-6010-fd04-a497-8cc9-f31e-1e0d-1406.ngrok.io/
```

5. Append your webhook handler path to create the complete endpoint:

```
https://025c-2603-6010-fd04-a497-8cc9-f31e-1e0d-1406.ngrok.io/api/webhooks/mux
```

6. Enter this URL as the webhook endpoint in the Mux dashboard

### Alternative Tunneling Solutions

Other secure tunnel options are available at [awesome-tunneling](https://github.com/anderspitman/awesome-tunneling).

---

## Best Practices

1. **Always verify webhook signatures** in production to ensure requests come from Mux
2. **Handle duplicates gracefully** - your webhook handler should be idempotent
3. **Respond quickly** - return a 2xx response within 5 seconds; process work asynchronously if needed
4. **Use webhooks instead of polling** - they are more efficient and scale better
5. **Log webhook events** for debugging and audit purposes
6. **Check the environment** - verify webhooks are configured for the correct Mux environment
7. **Implement timestamp validation** - reject old webhooks (recommended tolerance: 5 minutes) to prevent replay attacks
