# Complete Direct Upload Implementation with Webhooks

This guide provides an end-to-end example of implementing video uploads in a web application using Mux Direct Uploads. It covers creating an upload endpoint, handling uploads on the client with Mux Uploader, processing webhooks for asset status updates, and storing asset information in a database.

## Overview

Direct Uploads allow you to provide an authenticated upload URL to your client applications so content can be uploaded directly to Mux without needing any intermediary steps. You control who gets an authenticated URL, how long it's viable, and the Asset settings used when the upload completes.

The overall flow looks like this:

1. **Set up webhooks** - Configure a public webhook endpoint to receive events from Mux
2. **Create upload URL** - Generate a direct upload URL server-side and save the upload ID
3. **Upload the video** - Use Mux Uploader on the client to handle the file upload
4. **Handle webhook events** - Process `video.upload.asset_created` and `video.asset.ready` events
5. **Store asset information** - Save `asset_id` and `playback_id` to your database

## Database Schema

Here is an example database table schema for storing video information:

| Column | Type | Description |
|--------|------|-------------|
| id | uuid (primary key) | Your internal video ID |
| user_id | uuid (foreign key) | References users.id |
| upload_id | string | From initial upload creation |
| asset_id | string | From Mux webhook |
| playback_id | string | From Mux webhook |
| title | string | Optional metadata |
| status | enum | e.g. `preparing`, `ready` |
| created_at | timestamp | |
| updated_at | timestamp | |

## Step 1: Create the Server-Side Upload Endpoint

Create an `/upload` route that generates a new Direct Upload and returns the authenticated URL to the client. Use the `passthrough` field to associate the upload with your application's data.

```javascript
const { json, send } = require('micro');
const uuid = require('uuid/v1');

// This assumes you have MUX_TOKEN_ID and MUX_TOKEN_SECRET
// environment variables.
const mux = new Mux();

// All the 'db' references here are pseudocode for your database
const db = yourDatabase();

module.exports = async (req, res) => {
  const id = uuid();
  // Grab any info you want from the request body
  const assetInfo = await json(req);

  // Create a new upload using the Mux SDK
  const upload = await mux.video.uploads.create({
    // Set the CORS origin to your application
    cors_origin: 'https://your-app.com',

    // Specify the settings used to create the new Asset after
    // the upload is complete
    new_asset_settings: {
      passthrough: id,
      playback_policy: ['public'],
      video_quality: 'basic'
    }
  });

  db.put(id, {
    // Save the upload ID in case we need to update this based on
    // 'video.upload' webhook events
    uploadId: upload.id,
    metadata: assetInfo,
    status: 'waiting_for_upload',
  });

  // Send back the ID and upload URL so the client can use it
  send(res, 201, { id, url: upload.url });
}
```

### Adding Metadata to Uploads

You can include metadata when creating the upload that will be attached to the resulting asset:

```json
// POST /video/v1/uploads
{
    "new_asset_settings": {
        "playback_policies": ["public"],
        "video_quality": "basic",
        "meta": {
            "title": "My video title",
            "creator_id": "user_12345",
            "external_id": "my_internal_id_123"
        }
    },
    "cors_origin": "https://your-app.com"
}
```

Mux supports three metadata fields:

- `title`: A descriptive name for your video content (max 512 code points)
- `creator_id`: Identifies the creator or owner of the video (max 128 code points)
- `external_id`: References this asset in your system (max 128 code points)

**Note:** Do not include personally identifiable information in these fields. They will be accessible by browsers to display player UI.

## Step 2: Install and Configure Mux Uploader

Mux Uploader is a drop-in component that handles file selection, upload progress, retries, and offline/online detection.

### Installation

**NPM:**
```shell
npm install @mux/mux-uploader@latest
```

**Yarn:**
```shell
yarn add @mux/mux-uploader@latest
```

**For React:**
```shell
npm install @mux/mux-uploader-react@latest
```

**CDN (hosted script):**
```html
<script src="https://cdn.jsdelivr.net/npm/@mux/mux-uploader"></script>
```

### Basic HTML Usage

```html
<script src="https://cdn.jsdelivr.net/npm/@mux/mux-uploader"></script>
<mux-uploader endpoint="https://storage.googleapis.com/video..."></mux-uploader>
```

### Basic React Usage

```jsx
import MuxUploader from "@mux/mux-uploader-react";

export default function App() {
  return (
    <MuxUploader endpoint="https://storage.googleapis.com/video..." />
  );
}
```

### Fetching the Upload URL Asynchronously

In most applications, you will not have the upload URL at render time. Instead, fetch it from your server when the user selects a file:

**HTML with async endpoint:**
```html
<mux-uploader></mux-uploader>

<script>
  const muxUploader = document.querySelector("mux-uploader");

  // Endpoint can be a function that returns a promise
  muxUploader.endpoint = function () {
    return fetch("/your-server/api/create-upload")
      .then(res => res.text());
  };
</script>
```

**React with async endpoint:**
```jsx
import MuxUploader from "@mux/mux-uploader-react";

export default function App() {
  return (
    <MuxUploader
      endpoint={() => {
        return fetch("/your-server/api/create-upload")
          .then(res => res.text());
      }}
    />
  );
}
```

### Mux Uploader Features

Mux Uploader supports:
- Manual file selection
- Drag and drop for files
- Optional pausing and resuming of uploads
- Automatic offline/online detection with upload resumes
- Progress updates to the user
- Error handling with retry option

## Step 3: Create the Webhook Handler

Set up an endpoint to receive webhook events from Mux. The key events to handle are:

- `video.asset.created` - Asset was successfully created
- `video.asset.ready` - Asset has been processed and is ready for playback
- `video.upload.cancelled` - Upload was cancelled
- `video.upload.asset_created` - Contains the `asset_id` for the uploaded video

```javascript
const { json, send } = require('micro');

const db = yourDatabase();

module.exports = async (req, res) => {
  // Grab the event type and data from the webhook payload
  const { type: eventType, data: eventData } = await json(req);

  switch (eventType) {
    case 'video.asset.created': {
      // Asset was successfully created
      // Get the existing item from the DB using passthrough ID
      const item = await db.get(eventData.passthrough);

      // Check if asset isn't already ready before updating
      // (in case events arrived out of order)
      if (item.asset.status !== 'ready') {
        await db.put(item.id, {
          ...item,
          asset: eventData,
        });
      }
      break;
    }

    case 'video.asset.ready': {
      // Asset is processed and ready for playback
      // This is the final state, so update without checking
      const item = await db.get(eventData.passthrough);
      await db.put(item.id, {
        ...item,
        asset: eventData,
      });
      break;
    }

    case 'video.upload.cancelled': {
      // Upload was cancelled - update internal state
      const item = await db.findByUploadId(eventData.passthrough);
      await db.put(item.id, { ...item, status: 'cancelled_upload' });
      break;
    }

    default:
      // Mux sends webhooks for many events, ignore others for now
      console.log('some other event!', eventType, eventData);
  }

  send(res, 200);
}
```

### Important Webhook Events

| Event | Description | Key Data |
|-------|-------------|----------|
| `video.upload.asset_created` | Upload completed, asset created | `asset_id` in payload |
| `video.asset.created` | Asset record created | Full asset data |
| `video.asset.ready` | Video processed, ready for playback | `playback_id` in payload |
| `video.upload.cancelled` | Upload was cancelled | Upload ID |

### Using the Passthrough Field

The `passthrough` field is key for associating webhooks with your application data. When you create an upload, include your internal ID in the passthrough field. This ID will be included in all webhook events for that asset.

## Step 4: Handle Large Files with UpChunk

For very large files or unreliable connections, you can use UpChunk to chunk the upload and enable pause/resume functionality.

### Installation

**NPM:**
```shell
npm install --save @mux/upchunk
```

**Yarn:**
```shell
yarn add @mux/upchunk
```

**CDN:**
```html
<script src="https://cdn.jsdelivr.net/npm/@mux/upchunk@2"></script>
```

### Chunked Upload Requirements

When manually chunking uploads:

- Split the file into chunks that are a multiple of 256KB (`256 * 1024` bytes)
- Example: 20MB chunks would be 20,971,520 bytes (`20 * 1024 * 1024`)
- The final chunk can be the remainder of the file
- Set required headers:
  - `Content-Length`: Size of the current chunk
  - `Content-Range`: Byte range being uploaded (e.g., `bytes 0-1048575/10000000`)
- Use `PUT` request with the chunk as the body
- Server responds with `308` to continue, `200 OK` or `201 Created` when complete

## Step 5: Streaming Uploads for Unknown File Size

When dealing with streaming data where the total file size is unknown (like live recordings), you can upload chunks as they become available.

### Benefits

- No need to know total file size upfront
- Reduced memory usage on the client
- Faster uploads by uploading in parallel with recording

### MediaRecorder Example

```javascript
// Global variables for tracking state
let mediaRecorder;
let mediaStream;
let nextByteStart = 0;
const CHUNK_SIZE = 8 * 1024 * 1024; // 8MB chunks - must be multiple of 256KB
const maxRetries = 3;
const lockName = 'uploadLock';
let activeUploads = 0;
let isFinalizing = false;

async function startRecording() {
  mediaStream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true
  });

  const mimeType = 'video/webm';

  mediaRecorder = new MediaRecorder(mediaStream, {
    mimeType,
    videoBitsPerSecond: 5000000,  // 5 Mbps
    audioBitsPerSecond: 128000    // 128 kbps
  });

  let buffer = new Blob([], { type: mimeType });
  let bufferSize = 0;

  mediaRecorder.ondataavailable = async (event) => {
    if (event.data.size > 0 && !isFinalizing) {
      buffer = new Blob([buffer, event.data], { type: mimeType });
      bufferSize += event.data.size;

      while (bufferSize >= CHUNK_SIZE) {
        const chunk = buffer.slice(0, CHUNK_SIZE);
        buffer = buffer.slice(CHUNK_SIZE);
        bufferSize -= CHUNK_SIZE;

        await uploadChunk(chunk, nextByteStart, false);
        nextByteStart += chunk.size;
      }
    }
  };

  // Start recording, getting data every 500ms
  mediaRecorder.start(500);
}

async function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
    isFinalizing = true;

    // Wait for in-progress uploads to complete
    while (activeUploads > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Upload any remaining data as the final chunk
    if (buffer.size > 0) {
      await uploadChunk(buffer, nextByteStart, true);
      nextByteStart += buffer.size;
    }

    // Clean up media tracks
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
    }

    isFinalizing = false;
  }
}

async function uploadChunk(chunk, byteStart, isFinalChunk) {
  const byteEnd = byteStart + chunk.size - 1;
  const totalSize = isFinalChunk ? byteEnd + 1 : '*';

  const headers = {
    'Content-Length': chunk.size.toString(),
    'Content-Range': `bytes ${byteStart}-${byteEnd}/${totalSize}`,
  };

  let attempt = 0;
  let success = false;

  // Use Web Locks API to enforce sequential uploads
  await navigator.locks.request(lockName, async () => {
    activeUploads++;
    while (attempt < maxRetries && !success) {
      try {
        const response = await fetch('MUX_DIRECT_UPLOAD_URL_HERE', {
          method: 'PUT',
          headers,
          body: chunk
        });

        if (response.ok || response.status === 308) {
          success = true;
        } else {
          throw new Error(`Upload failed with status: ${response.status}`);
        }
      } catch (error) {
        attempt++;
        if (attempt < maxRetries) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        } else {
          throw error;
        }
      }
    }
    activeUploads--;
  });

  return success;
}
```

**Important:** Use the Web Locks API (`navigator.locks.request`) to enforce sequential chunk uploads. If chunks are uploaded out of order, the upload will fail.

## Step 6: Using Asset and Playback IDs

After processing is complete, you will have two key IDs:

1. **`asset_id`**: Used for managing the video through the Mux API (deleting, checking status, etc.)
2. **`playback_id`**: Used for playing the video with Mux Player or creating playback URLs

## Complete Application Flow

1. User selects a file in your application
2. Mux Uploader calls your `/upload` endpoint to get a direct upload URL
3. Your server creates a Direct Upload with Mux, saves the upload ID and passthrough ID to your database, and returns the URL
4. Mux Uploader uploads the file directly to Mux using the authenticated URL
5. Mux processes the video and sends webhook events
6. Your webhook handler receives `video.asset.created` and `video.asset.ready` events
7. You update your database with the asset ID and playback ID
8. The video is ready for playback

## Example Applications

For complete working examples, check out these open-source applications:

- **with-mux-video**: `npx create-next-app --example with-mux-video with-mux-video-app`
- **stream.new**: `git clone git@github.com:muxinc/stream.new.git`

Both examples use Next.js, Mux Direct Uploads, and Mux playback.

## Updating Metadata After Upload

Once an asset has been created, you can update its metadata at any time:

```json
// PATCH /video/v1/assets/{ASSET_ID}
{
    "meta": {
        "title": "Updated video title",
        "creator_id": "new_creator_id",
        "external_id": "new_external_id"
    }
}
```
