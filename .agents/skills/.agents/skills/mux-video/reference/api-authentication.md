# API Authentication and Requests

Complete guide to authenticating with the Mux API, making HTTP requests, handling pagination, understanding rate limits, and using serverless functions.

## HTTP Basic Authentication

Mux uses HTTP Basic Auth with access tokens to authenticate all API requests. Every request to the API requires an Access Token, which consists of two parts:

| Term         | Description                                            |
| :----------- | :----------------------------------------------------- |
| Token ID     | Access token ID, the "username" in HTTP basic auth     |
| Token secret | Access token secret, the "password" in HTTP basic auth |

Access tokens can be created and managed at: https://dashboard.mux.com/settings/access-tokens

**Important security notes:**
- Mux only stores a hash of the secret, not the secret itself
- If you lose the secret key for your access token, Mux cannot recover it - you must create a new Access Token
- If the secret key for an Access Token is leaked, revoke that Access Token immediately on the settings page
- You must be an admin on the Mux organization to access the access tokens settings page

### How Basic Auth Works

HTTP basic auth works by base64 encoding the username and password in an `Authorization` header on the request:

```bash
'Authorization': 'Basic base64(MUX_TOKEN_ID:MUX_TOKEN_SECRET)'
```

The encoding process:
1. The access token ID and secret are concatenated with a `:` character
2. The resulting string is base64 encoded
3. The `Authorization` header value is the string `Basic` plus a space followed by the base64 encoded result

### Example cURL Request

```shell
curl https://api.mux.com/video/v1/assets \
  -H "Content-Type: application/json" \
  -X POST \
  -d '{ "inputs": [{ "url": "https://muxed.s3.amazonaws.com/leds.mp4" }], "playback_policies": ["public"], "video_quality": "basic" }' \
  -u YOUR_TOKEN_ID:YOUR_TOKEN_SECRET
```

The cURL library handles base64 encoding and setting the header value internally. Most HTTP libraries in server-side languages have similar functionality for handling basic auth - you pass in the username (Access Token ID) and password (Access Token secret), and the library handles the header formatting.

**All API requests must be made via HTTPS** (to `https://api.mux.com`).

### Environment Scoping

Access tokens are scoped to an environment. A development token cannot be used in requests to production. Always verify the intended environment when creating an access token.

## Access Token Permissions

Access tokens can be configured with different permission levels based on your needs.

### Permission Levels

**Read and Write permissions** - Required for creating or modifying resources with Mux Video:
- Creating new assets
- Creating direct uploads
- Creating new live streams

**Read only permissions** - Sufficient if your code only performs `GET` requests and does not create anything.

**System write permissions** - Required for creating signed tokens for secure video playback. This is necessary when working with signing keys.

**Mux Data permissions** - Only requires Write permissions if you need to create Annotations via API. Annotations created in the Dashboard do not require Write permissions.

### Recommended Approach

If you are just getting started with Mux Video, use Read and Write permissions to ensure you have access to all necessary functionality.

## CORS and Client-Side Considerations

Mux API endpoints do not have CORS headers. Attempting to call the Mux API from the browser will result in an error:

```
request has been blocked by CORS policy: Response to preflight request doesn't
pass access control check: No 'Access-Control-Allow-Origin' header is present
on the requested resource.
```

This is intentional and expected behavior.

### Why No CORS Support

Making API requests directly from the browser or mobile app would expose your API keys in client-side code. Anyone accessing your application would be able to steal your API credentials and make requests to Mux on your behalf, potentially gaining full control of your Mux account.

**Mux API credentials should never be stored in a client application. All Mux API calls should be made from a trusted server.**

### Recommended Client-Server Flow

Instead of making API requests from the client, follow this pattern:

1. Client makes a request to your server
2. Your server makes an authenticated API request to Mux
3. Your server saves whatever it needs in your database
4. Your server responds to the client with only the information the client needs (for example, with live streaming that is the stream key for a specific stream; for uploads that is just the direct upload URL)

## Using Serverless Functions with Mux

Serverless functions are an excellent way to add secure server-side code to client-heavy applications.

### Supported Platforms

- [AWS Lambda](https://aws.amazon.com/lambda/)
- [Firebase Cloud Functions](https://firebase.google.com/docs/functions)
- [Cloudflare Workers](https://workers.cloudflare.com/)
- [Vercel Functions](https://vercel.com/docs/functions)
- [Netlify Functions](https://docs.netlify.com/functions/overview/)

### Example: Creating a Direct Upload

Below is an example serverless function endpoint that creates a Mux Direct Upload:

```js
// pages/api/upload.js
// see: https://github.com/vercel/next.js/tree/canary/examples/with-mux-video
import Mux from '@mux/mux-node';

const mux = new Mux();

export default async function uploadHandler(req, res) {
  const { method } = req;

  switch (method) {
    case 'POST':
      try {
        const upload = await mux.video.uploads.create({
          new_asset_settings: { playback_policy: ['public'], video_quality: 'basic' },
          cors_origin: '*',
        });
        res.json({
          id: upload.id,
          url: upload.url,
        });
      } catch (e) {
        console.error('Request error', e);
        res.status(500).json({ error: 'Error creating upload' });
      }
      break;
    default:
      res.setHeader('Allow', ['POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
```

## API Pagination

List endpoints do not return every single relevant record. To offer the best performance, Mux limits the number of records per response and provides pagination parameters.

### Page/Limit Pagination

The most common pagination controls are `page` and `limit`:

| Parameter | Default | Maximum | Description                                      |
| :-------- | :------ | :------ | :----------------------------------------------- |
| `page`    | `1`     | None    | The page number to return. The first page is `1` |
| `limit`   | `10`    | `100`   | The number of records to return per page         |

**Example: Get the first 10 assets**
```http
GET /video/v1/assets?page=1&limit=10
```

**Example: Get the next 10 assets**
```http
GET /video/v1/assets?page=2&limit=10
```

### Cursor Pagination

Cursor pagination is a more efficient and reliable way of paginating through very large collections. Currently available on the List Assets endpoint.

When you make a request to the list assets endpoint, the response includes a `next_cursor` value:

```json
// GET /video/v1/assets
{
  "data": [
    {
      "id": "asset_id",
      "status": "ready",
      ...
    }
  ],
  "next_cursor": "eyJwYWdlX2xpbWl0IjoxMDAwLCJwYWdlX2NvdW50IjoxfQ"
}
```

Use the `next_cursor` value in subsequent requests with the `cursor` parameter:

```json
// GET /video/v1/assets?cursor=eyJwYWdlX2xpbWl0IjoxMDAwLCJwYWdlX2NvdW50IjoxfQ
{
  "data": [
    {
      "id": "asset_id",
      "status": "ready",
      ...
    }
  ],
  "next_cursor": null
}
```

If `next_cursor` is `null`, you have reached the end of the list. If `next_cursor` is not `null`, use that value to get the next page, repeating until `next_cursor` is `null`.

## API Rate Limits

Mux implements rate limits per account (not per environment) for two reasons:

1. To protect you from runaway scripts or batch processes that could accidentally delete content or run up unexpected bills
2. To ensure Mux infrastructure is available when needed for critical operations like starting live streams or ingesting urgent video

When the rate limit threshold is exceeded, the API returns HTTP status code `429`.

### Video API Rate Limits

| Request Type | Rate Limit | Description |
| :----------- | :--------- | :---------- |
| POST requests | 1 RPS sustained | Creating new Assets, Live Streams, and Uploads. Can burst above this for short periods |
| GET, PUT, PATCH, DELETE | 5 RPS sustained | Retrieving assets, updating MP4 support, listing delivery usage, etc. Can burst above this for short periods |

### Playback Rate Limits

There are no limits on the number of viewers your streams can have. Mux requests notification if you are planning an event expected to receive more than 100,000 concurrent live viewers.

### Monitoring Data API Rate Limits

Requests against the Monitoring Data APIs are rate limited to 1 RPS sustained with the ability to burst above this for short periods.

### General Data API Rate Limits

Requests against all other General Data APIs are rate limited to 5 RPS sustained with the ability to burst above this for short periods.

## Available SDKs

Mux provides API SDKs for several major languages. While not required, these SDKs:
- Handle authentication details automatically
- Make it easier to send API requests to Mux
- Provide type hints and static typing to help form correct requests
- Reduce development time

### Supported Languages

- **Node.js** - `@mux/mux-node`
- **Python** - Mux Python SDK
- **PHP** - Mux PHP SDK
- **Ruby** - Mux Ruby SDK
- **Elixir** - Mux Elixir SDK
- **Java** - Mux Java SDK
- **C# and other .NET languages** - Mux C# SDK

### SDK Usage Example (Node.js)

```js
import Mux from '@mux/mux-node';

// SDK automatically handles authentication when MUX_TOKEN_ID and
// MUX_TOKEN_SECRET environment variables are set
const mux = new Mux();

// Create an asset
const asset = await mux.video.assets.create({
  input: [{ url: 'https://example.com/video.mp4' }],
  playback_policy: ['public'],
});
```
