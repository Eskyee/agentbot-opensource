# Web Framework Integrations

Comprehensive guide for integrating Mux video into popular web frameworks including Next.js, Remix, SvelteKit, Astro, and Laravel. Covers quick setup with Mux Player, direct uploads with Mux Uploader, webhook handling, and framework-specific patterns.

## Overview

When adding video to any web application, you will encounter common challenges:

- **Large file sizes**: Videos stored in public directories lead to excessive bandwidth and poor Git performance
- **Optimization**: Videos need compression and optimization for web delivery
- **Adaptive streaming**: Network conditions change, requiring quality adaptation for smooth playback
- **Additional features**: Captions, thumbnails, and analytics integration

Mux provides APIs and components to handle these challenges across all major web frameworks.

## Core Components

All framework integrations use these key Mux components:

| Component | Package | Purpose |
|-----------|---------|---------|
| Mux Player | `@mux/mux-player-react`, `@mux/mux-player`, `@mux/mux-player-astro` | Video playback with built-in analytics |
| Mux Uploader | `@mux/mux-uploader-react`, `@mux/mux-uploader`, `@mux/mux-uploader-astro` | Direct uploads to Mux |
| Mux Node SDK | `@mux/mux-node` | Server-side API interactions |
| Mux PHP SDK | `mux-php` | PHP server-side API interactions |

---

## Next.js

### Quick Start with next-video

The simplest way to add video to Next.js is with `next-video`, a React component maintained by Mux:

```bash
npx -y next-video init
```

This installs the package, updates `next.config.js` and TypeScript configuration, and creates a `/videos` folder.

Add a video to your `/videos` folder, then use it in your app:

```jsx
import Video from 'next-video';
import myVideo from '/videos/my-video.mp4';

export default function Page() {
 return <Video src={myVideo} />;
}
```

### Direct Uploads with Mux Uploader

For user-uploaded content, use Mux Uploader with the Direct Uploads API.

**App Directory (JavaScript)** - `app/upload/page.jsx`:

```jsx
import Mux from '@mux/mux-node';
import MuxUploader from '@mux/mux-uploader-react';

const client = new Mux({
  tokenId: process.env['MUX_TOKEN_ID'],
  tokenSecret: process.env['MUX_TOKEN_SECRET'],
});

export default async function Page() {
  const directUpload = await client.video.uploads.create({
    cors_origin: '*',
    new_asset_settings: {
      playback_policy: ['public'],
    },
  });

  return <MuxUploader endpoint={directUpload.url} />;
}
```

**Pages Directory (JavaScript)** - `pages/upload.jsx`:

```jsx
import Mux from '@mux/mux-node';
import MuxUploader from '@mux/mux-uploader-react';

const client = new Mux({
  tokenId: process.env['MUX_TOKEN_ID'],
  tokenSecret: process.env['MUX_TOKEN_SECRET'],
});

export const getServerSideProps = async () => {
  const directUpload = await client.video.uploads.create({
    cors_origin: '*',
    new_asset_settings: {
      playback_policy: ['public'],
    },
  });

  return {
    props: {
      directUpload,
    },
  };
}

export default function Page({ directUpload }) {
  return <MuxUploader endpoint={directUpload.url} />;
}
```

**Pages Directory (TypeScript)** - `pages/upload.tsx`:

```tsx
import type { InferGetServerSidePropsType, GetServerSideProps } from 'next'

import Mux, { type Upload } from '@mux/mux-node';
import MuxUploader from '@mux/mux-uploader-react';

const client = new Mux({
  tokenId: process.env['MUX_TOKEN_ID'],
  tokenSecret: process.env['MUX_TOKEN_SECRET'],
});

export const getServerSideProps = (async () => {
  const directUpload = await client.video.uploads.create({
    cors_origin: '*',
    new_asset_settings: {
      playback_policy: ['public'],
    },
  });

  return {
    props: {
      directUpload,
    },
  };
}) satisfies GetServerSideProps<{ directUpload: Upload }>

export default function Page({
  directUpload
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return <MuxUploader endpoint={directUpload.url} />;
}
```

### Webhook Handler

Handle Mux webhooks to track when videos are ready for playback.

**App Directory** - `app/mux-webhook/route.ts`:

```typescript
export async function POST(request: Request) {
  const body = await request.json();
  const { type, data } = body

  if (type === 'video.asset.ready') {
    await saveAssetToDatabase(data);
  } else {
    /* handle other event types */
  }
  return Response.json({ message: 'ok' });
}
```

**Pages Directory** - `pages/api/mux-webhook.ts`:

```typescript
import { NextApiRequest, NextApiResponse } from 'next';

export default async function muxWebhookHandler (req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const { method, body } = req;

  switch (method) {
    case 'POST': {
      const { data, type } = body;

      if (type === 'video.asset.ready') {
        await saveAssetToDatabase(data);
      } else {
        /* handle other event types */
      }
      res.json({ message: ok });
    } default:
      res.setHeader('Allow', ['POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
```

### Playback Page

Retrieve video metadata and play with Mux Player.

**App Directory** - `app/watch/[id]/page.tsx`:

```tsx
import Mux from '@mux/mux-node';
import MuxPlayer from '@mux/mux-player-react';

const mux = new Mux();

export default async function Page({ params }: { params: { id: string } }) {
  /* Get the asset metadata from your database here or directly from Mux like below. */
  const asset = await mux.video.assets.retrieve(params.id);
  return <MuxPlayer playbackId={asset.playback_ids?.[0].id!} accentColor="#ac39f2" />;
}
```

**Pages Directory** - `pages/watch/[id].jsx`:

```jsx
import Mux from '@mux/mux-node';
import MuxPlayer from '@mux/mux-player-react';

const mux = new Mux();

export const getStaticProps = async ({ params })  => {
  /* Get the asset metadata from your database here or directly from Mux like below. */
  const asset = await mux.video.assets.retrieve(params.id);
  return {
    props: {
      asset,
    },
  };
}

export default function Page({ asset }) {
  return <MuxPlayer playbackId={asset.playback_ids?.[0].id} accentColor="#ac39f2" />;
}
```

### Example Projects

- **Video Course Starter Kit**: Full-featured course platform with GitHub OAuth, course creation, video lessons, and progress tracking - [GitHub](https://github.com/muxinc/video-course-starter-kit)
- **with-mux-video**: Bare-bones starter with Direct Uploads, Mux Video, Data, and Player - [GitHub](https://github.com/vercel/next.js/tree/931eee87be8af86bd95336deade5870ad5e04669/examples/with-mux-video)
- **stream.new**: Open source app with Direct Uploads and content moderation - [GitHub](https://github.com/muxinc/stream.new)

---

## Remix

### Quick Start with Mux Player

```jsx
import MuxPlayer from "@mux/mux-player-react";

export default function Page() {
  return (
    <MuxPlayer
      playbackId="jwmIE4m9De02B8TLpBHxOHX7ywGnjWxYQxork1Jn5ffE"
      metadata={{
        video_title: "Test video title",
        viewer_user_id: "user-id-007",
      }}
    />
  );
}
```

Upload videos directly through the Mux Dashboard and find the playback ID in the "Playback and Thumbnails" tab.

### Direct Uploads with Mux Uploader

Create a shared Mux client module first:

```typescript
// lib/mux.server.ts
import Mux from '@mux/mux-node';

const mux = new Mux();

export default mux;
```

**Upload Page** - `app/routes/upload.tsx`:

```tsx
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import MuxUploader from "@mux/mux-uploader-react";
import mux from "~/lib/mux.server";

export const loader = async () => {
  const upload = await mux.video.uploads.create({
    new_asset_settings: {
      playback_policy: ["public"],
      video_quality: "basic",
    },
    cors_origin: "*",
  });
  return json({ url: upload.url });
};

export default function UploadPage() {
  const { url } = useLoaderData<typeof loader>();
  return <MuxUploader endpoint={url} />
}
```

### Webhook Handler

**Webhook Route** - `app/routes/mux.webhook.ts`:

```typescript
import { json, type ActionFunctionArgs } from "@remix-run/node";
import Mux from "@mux/mux-node";

// this reads your MUX_TOKEN_ID and MUX_TOKEN_SECRET
// from your environment variables
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

  switch (event.type) {
    case "video.upload.asset_created":
      // we might use this to know that an upload has been completed
      // and we can save its assetId to our database
      break;
    case "video.asset.ready":
      // we might use this to know that a video has been encoded
      // and we can save its playbackId to our database
      break;
    default:
      break;
  }

  return json({ message: "ok" });
};
```

### Playback Page

**Playback Route** - `app/routes/playback.$playbackId.tsx`:

```tsx
import MuxPlayer from "@mux/mux-player-react";
import { type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useParams } from "@remix-run/react";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const { title } = getAssetFromDatabase(params);
  const userId = getUser(request);
  return json({ title, userId });
};

export default function Page() {
  const { title, userId } = useLoaderData<typeof loader>();
  const { playbackId } = useParams();
  return (
    <MuxPlayer
      playbackId={playbackId}
      metadata={{
        video_title: title,
        viewer_user_id: userId
      }}
    />
  );
}
```

### Example Projects

- **remix-examples/mux-video**: Bare-bones starter with Direct Uploads, Mux Uploader, Video, Data, and Player - [GitHub](https://github.com/remix-run/examples/tree/main/mux-video)

---

## SvelteKit

### Quick Start with Mux Player

SvelteKit uses the web component version of Mux Player:

```svelte
<script lang="ts">
  import "@mux/mux-player";
</script>

<mux-player
  playback-id="jwmIE4m9De02B8TLpBHxOHX7ywGnjWxYQxork1Jn5ffE"
  metadata-video-title="Test VOD"
  metadata-viewer-user-id="user-id-007"
></mux-player>
```

### Mux Node SDK Setup

Create a shared Mux client:

```typescript
// lib/mux.ts
import Mux from '@mux/mux-node';
import { MUX_TOKEN_ID, MUX_TOKEN_SECRET } from '$env/static/private';

const mux = new Mux({
  tokenId: MUX_TOKEN_ID,
  tokenSecret: MUX_TOKEN_SECRET
});

export default mux;
```

### Direct Uploads

**Server Load Function** - `routes/upload/+page.server.ts`:

```typescript
import mux from '$lib/mux';
import type { PageServerLoad } from './$types';

export const load = (async () => {
  // Create an endpoint for MuxUploader to upload to
  const upload = await mux.video.uploads.create({
    new_asset_settings: {
      playback_policy: ['public'],
      video_quality: 'basic'
    },
    // in production, you'll want to change this origin to your-domain.com
    cors_origin: '*'
  });
  return { id: upload.id, url: upload.url };
}) satisfies PageServerLoad;
```

**Upload Component (Svelte 5)** - `src/routes/upload/+page.svelte`:

```svelte
<script lang="ts">
  import '@mux/mux-uploader';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<mux-uploader endpoint={data.url} />
```

**Upload Component (Svelte 4)** - `src/routes/upload/+page.svelte`:

```svelte
<script lang="ts">
  import '@mux/mux-uploader';
  import type { PageData } from './$types';
  export let data: PageData;
</script>

<mux-uploader endpoint={data.url} />
```

### Webhook Handler

**Webhook Endpoint** - `routes/api/mux/webhook/+server.ts`:

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

  switch (event.type) {
    case 'video.upload.asset_created':
      // we might use this to know that an upload has been completed
      // and we can save its assetId to our database
      break;
    case 'video.asset.ready':
      // we might use this to know that a video has been encoded
      // and we can save its playbackId to our database
      break;
    default:
      break;
  }

  return json({ message: 'ok' });
};
```

### Playback Page

**Playback Component (Svelte 5)** - `src/routes/playback/+page.svelte`:

```svelte
<script lang="ts">
  import '@mux/mux-player';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<mux-player
  playback-id={data.playbackId}
  accentColor="#FF3E00"
/>
```

### Example Projects

- **sveltekit-uploader-and-player**: Bare-bones starter with Direct Uploads, Mux Uploader, Video, Data, and Player - [GitHub](https://github.com/muxinc/examples/tree/main/sveltekit-uploader-and-player)

---

## Astro

Astro requires SSR mode for user uploads since this work is done on the server and is unique for every user. Make sure your Astro app is in SSR mode before implementing uploads.

### Installation

Install the Astro-specific packages:

```bash
npm install @mux/mux-uploader-astro @mux/mux-player-astro @mux/mux-node
```

### Direct Uploads

**Upload Page** - `src/pages/index.astro`:

```astro
---
import Layout from '../layouts/Layout.astro';
import Mux from "@mux/mux-node";
import MuxUploader from "@mux/mux-uploader-astro";

const mux = new Mux({
  tokenId: import.meta.env.MUX_TOKEN_ID,
  tokenSecret: import.meta.env.MUX_TOKEN_SECRET
});

const upload = await mux.video.uploads.create({
  new_asset_settings: {
    playback_policy: ['public'],
    video_quality: 'basic',
  },
  cors_origin: '*',
});
---

<Layout title="Upload a video to Mux">
  <MuxUploader endpoint={upload.url} />
</Layout>
```

### Upload Event Handling

```astro
---
import Layout from '../layouts/Layout.astro';
import Mux from "@mux/mux-node";
import MuxUploader from "@mux/mux-uploader-astro";

const mux = new Mux({
  tokenId: import.meta.env.MUX_TOKEN_ID,
  tokenSecret: import.meta.env.MUX_TOKEN_SECRET
});

const upload = await mux.video.uploads.create({
  new_asset_settings: {
    playback_policy: ['public'],
    video_quality: 'basic',
  },
  cors_origin: '*',
});
---

<Layout title="Upload with Event Handling">
  <MuxUploader
    id="my-uploader"
    endpoint={upload.url}
    pausable
    maxFileSize={50000}
  />

  <script>
    import type { MuxUploaderElement } from '@mux/mux-uploader-astro';

    const uploader = document.getElementById('my-uploader') as MuxUploaderElement;

    uploader.addEventListener('uploadstart', (event) => {
      console.log('Upload started!', event.detail);
    });

    uploader.addEventListener('success', (event) => {
      console.log('Upload successful!', event.detail);
    });

    uploader.addEventListener('uploaderror', (event) => {
      console.error('Upload error!', event.detail);
    });

    uploader.addEventListener('progress', (event) => {
      console.log('Upload progress: ', event.detail);
    });
  </script>
</Layout>
```

### Webhook Handler

**Webhook Endpoint** - `src/pages/mux-webhook.json.ts`:

```typescript
import type { APIRoute } from 'astro';
import mux from '../lib/mux';

export const POST: APIRoute = async ({ request }) => {
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

  switch (event.type) {
    case 'video.upload.asset_created':
      // we might use this to know that an upload has been completed
      // and we can save its assetId to our database
      break;
    case 'video.asset.ready':
      // we might use this to know that a video has been encoded
      // and we can save its playbackId to our database
      break;
    default:
      break;
  }

  return new Response(JSON.stringify({ message: 'ok' }), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
};
```

### Playback Page

**Basic Playback** - `src/pages/playback/[playbackId].astro`:

```astro
---
import Layout from '../../layouts/Layout.astro';
import MuxPlayer from "@mux/mux-player-astro";

const { playbackId } = Astro.params;
---

<Layout>
  <MuxPlayer
    playbackId={playbackId}
    metadata={{video_title: 'My Video'}}
  />
</Layout>
```

### Retrieving Asset Data

Fetch video asset data and display metadata:

```astro
---
import Layout from '../../layouts/Layout.astro';
import Mux from "@mux/mux-node";
import MuxPlayer from "@mux/mux-player-astro";

const mux = new Mux({
  tokenId: import.meta.env.MUX_TOKEN_ID,
  tokenSecret: import.meta.env.MUX_TOKEN_SECRET,
});

const { assetId } = Astro.params;
const asset = await mux.video.assets.retrieve(assetId);

const playbackId = asset.playback_ids?.find((id) => id.policy === "public")?.id;
const videoTitle = asset?.meta?.title;
const createdAt = Number(asset?.created_at);
const duration = Number(asset?.duration);

const date = new Date(createdAt * 1000).toDateString();
const time = new Date(Math.round(duration) * 1000).toISOString().substring(14, 19);
---

<Layout>
  <h1>My Video Page</h1>
  <p>Title: {videoTitle}</p>
  <p>Upload Date: {date}</p>
  <p>Length: {time}</p>

  <MuxPlayer
    playbackId={playbackId}
    metadata={{video_title: videoTitle}}
  />
</Layout>
```

### Using mux-video Element

For a simpler alternative with HLS playback and automatic analytics:

```bash
npm install @mux/mux-video
```

```astro
<script>import '@mux/mux-video'</script>

<mux-video
  playback-id="FOTbeIxKeMPzyhrob722wytaTGI02Y3zbV00NeFQbTbK00"
  metadata-video-title="My Astro Video"
  controls
  disable-tracking
></mux-video>
```

### Example Projects

- **astro-uploader-and-player**: Bare-bones starter with Direct Uploads, Mux Uploader, Video, Data, and Player - [GitHub](https://github.com/muxinc/examples/tree/main/astro-uploader-and-player)

---

## Laravel

### Webhook Handler

Set up a route for webhooks:

```php
// routes/api.php
use App\Http\Controllers\WebhookController;

Route::post('webhook/endpoint', [WebhookController::class, 'handle']);
```

Create the controller:

```php
// app/Http/Controllers/WebhookController.php
namespace App\Http\Controllers;

use Illuminate\Http\Request;

class WebhookController extends Controller
{
    public function handle(Request $request)
    {
        // Process webhook payload here
        // Save the asset ID and playback ID to your database
        return response()->json(['success' => true]);
    }
}
```

Store at least the Asset ID and Playback ID in your database:
- **Asset ID**: Used for API interactions with Mux
- **Playback ID**: Used for front-end video playback

### Direct Uploads

Use the Mux PHP library to create upload URLs:

```php
$createAssetRequest = new MuxPhp\Models\CreateAssetRequest(["playback_policy" => [MuxPhp\Models\PlaybackPolicy::_PUBLIC]]);
$createUploadRequest = new MuxPhp\Models\CreateUploadRequest(["new_asset_settings" => $createAssetRequest]);
$upload = $uploadsApi->createDirectUpload($createUploadRequest);

print "Upload URL:" $upload->getData()->getUrl();
```

Use Mux Uploader on the front-end via CDN:

```html
<script src="https://cdn.jsdelivr.net/npm/@mux/mux-uploader"></script>

<mux-uploader endpoint="{direct_upload_url}"></mux-uploader>
```

### Video Playback

Use Mux Player in Blade templates:

```html
<script src="https://cdn.jsdelivr.net/npm/@mux/mux-player" defer></script>

<!-- The `metadata-` attributes are optional  -->
<mux-player
  playback-id="{{ $playbackId }}"
  metadata-video-title="{{ $title }}"
  metadata-viewer-user-id="{{ $userId }}"
></mux-player>
```

Create a playback controller:

```php
<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;

class PlaybackController extends Controller
{
    public function show($videoId)
    {
        // Fetch the video from the database and set
        // $playbackId
        // $title

        // Get user (replace with your actual authentication logic)
        $userId = auth()->id();

        return view('playback', [
            'playbackId' => $playbackId,
            'title' => $title,
            'userId' => $userId,
        ]);
    }
}
```

### Community Libraries

- **mux-php-laravel**: Laravel-specific wrapper for easier Mux integration - [GitHub](https://github.com/martinbean/mux-php-laravel)
- **Statamic Mux**: Community integration for the Statamic CMS built on Laravel - [Website](https://statamic-mux.daun.ltd/)

---

## Security Best Practices

When implementing uploads in production, apply these security measures:

1. **Protect upload routes with authentication** to prevent unauthorized uploads
2. **Set `cors_origin`** to your specific domain instead of `'*'`
3. **Use `playback_policy`** to control who can view uploaded videos (e.g., `'signed'` for private content)
4. **Verify webhook signatures** using `mux.webhooks.unwrap()` to ensure payloads are from Mux
5. **Store webhook signing secrets securely** in environment variables

## Common Webhook Events

| Event Type | Description |
|------------|-------------|
| `video.upload.asset_created` | Upload completed, asset ID available |
| `video.asset.ready` | Video encoded and ready for playback |

See the full webhook reference for all available event types.
