# Video Upload Methods

Comprehensive guide to uploading videos to Mux, including direct uploads with authenticated URLs, URL ingestion, handling large files with chunking, and streaming uploads for live recording scenarios.

## Overview

Mux provides multiple methods for getting video content into your account:

1. **Direct Uploads** - Client applications upload directly to Mux using authenticated URLs
2. **URL Ingestion** - Mux fetches video from a publicly accessible URL
3. **Chunked Uploads** - Large files uploaded in resumable chunks using UpChunk
4. **Streaming Uploads** - Upload data as it becomes available (e.g., MediaRecorder)

## Direct Uploads

Direct Uploads allow you to provide an authenticated upload URL to your client applications so content can be uploaded directly to Mux without needing any intermediary steps. You control who gets an authenticated URL, how long it is viable, and the Asset settings used when the upload is complete.

Common use cases:
- Native mobile apps (iOS, Android)
- Browser-based uploads
- Server-side uploads
- Command line tools

### Step 1: Create an Authenticated URL

Create a new Direct Upload with the Mux Asset settings you want. The Mux API returns an authenticated URL and an ID specific to that Direct Upload.

#### cURL

```bash
curl https://api.mux.com/video/v1/uploads \
  -X POST \
  -H "Content-Type: application/json" \
  -u MUX_TOKEN_ID:MUX_TOKEN_SECRET \
  -d '{ "new_asset_settings": { "playback_policies": ["public"], "video_quality": "basic" }, "cors_origin": "*" }'
```

#### Node.js

```javascript
import Mux from '@mux/mux-node';
const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET
});

mux.video.uploads.create({
  cors_origin: 'https://your-browser-app.com',
  new_asset_settings: {
    playback_policy: ['public'],
    video_quality: 'basic'
  }
}).then(upload => {
  // upload.url is what you'll want to return to your client.
});
```

#### Ruby

```ruby
MuxRuby.configure do |config|
  config.username = ENV['MUX_TOKEN_ID']
  config.password = ENV['MUX_TOKEN_SECRET']
end

uploads_api = MuxRuby::DirectUploadsApi.new

create_asset_request = MuxRuby::CreateAssetRequest.new
create_asset_request.playback_policy = [MuxRuby::PlaybackPolicy::PUBLIC]
create_asset_request.video_quality = "basic"
create_upload_request = MuxRuby::CreateUploadRequest.new
create_upload_request.new_asset_settings = create_asset_request
create_upload_request.timeout = 3600
create_upload_request.cors_origin = "https://your-browser-app.com"
upload = uploads_api.create_direct_upload(create_upload_request)
```

#### Python

```python
import mux_python

configuration = mux_python.Configuration()
configuration.username = os.environ['MUX_TOKEN_ID']
configuration.password = os.environ['MUX_TOKEN_SECRET']

uploads_api = mux_python.DirectUploadsApi(mux_python.ApiClient(configuration))

create_asset_request = mux_python.CreateAssetRequest(playback_policy=[mux_python.PlaybackPolicy.PUBLIC], video_quality="basic")
create_upload_request = mux_python.CreateUploadRequest(timeout=3600, new_asset_settings=create_asset_request, cors_origin="*")
create_upload_response = uploads_api.create_direct_upload(create_upload_request)
```

#### Go

```go
import (
  muxgo "github.com/muxinc/mux-go"
)

client := muxgo.NewAPIClient(
  muxgo.NewConfiguration(
    muxgo.WithBasicAuth(os.Getenv("MUX_TOKEN_ID"), os.Getenv("MUX_TOKEN_SECRET")),
  ))

car := muxgo.CreateAssetRequest{PlaybackPolicy: []muxgo.PlaybackPolicy{muxgo.PUBLIC}, VideoQuality: "basic"}
cur := muxgo.CreateUploadRequest{NewAssetSettings: car, Timeout: 3600, CorsOrigin: "*"}
u, err := client.DirectUploadsApi.CreateDirectUpload(cur)
```

#### PHP

```php
$config = MuxPhp\Configuration::getDefaultConfiguration()
  ->setUsername(getenv('MUX_TOKEN_ID'))
  ->setPassword(getenv('MUX_TOKEN_SECRET'));

$uploadsApi = new MuxPhp\Api\DirectUploadsApi(
    new GuzzleHttp\Client(),
    $config
);

$createAssetRequest = new MuxPhp\Models\CreateAssetRequest(["playback_policy" => [MuxPhp\Models\PlaybackPolicy::_PUBLIC], "video_quality" => "basic"]);
$createUploadRequest = new MuxPhp\Models\CreateUploadRequest(["timeout" => 3600, "new_asset_settings" => $createAssetRequest, "cors_origin" => "https://your-browser-app.com"]);
$upload = $uploadsApi->createDirectUpload($createUploadRequest);
```

### Step 2: Upload the File

Once you have the upload object, use the authenticated URL to make a `PUT` request with the file in the body. The URL is resumable, allowing you to send large files in pieces and pause/resume at will.

#### cURL

```bash
curl -v -X PUT -T myawesomevideo.mp4 "$URL_FROM_STEP_ONE"
```

**Note:** Be sure to put quotes around the upload URL.

#### Node.js

```javascript
import fs from "fs";
import got from "got";

const uploadUrl = /* Authenticated URL from step 1 */

got.put(uploadUrl, {
  body: fs.createReadStream('/path/to/your/file'),
});
```

#### React Native

```javascript
async function uploadVideo () {
  // videoUri here is the local URI to the video file on the device
  // this can be obtained with an ImagePicker library like expo-image-picker
  const imageResponse = await fetch(videoUri)
  const blob = await imageResponse.blob()

  // Create an authenticated Mux URL
  // this request should hit your backend and return a "url" in the
  // response body
  const uploadResponse = await fetch('/backend-api')
  const uploadUrl = (await uploadResponse.json()).url

  try {
    let res = await fetch(uploadUrl, {
      method: 'PUT',
      body: blob,
      headers: { "content-type": blob.type}
    });
    console.log("Upload is complete");
  } catch(error) {
    console.error(error);
  }
};
```

## URL Ingestion

Instead of uploading files directly, you can have Mux fetch video from a publicly accessible URL by creating an Asset with an input URL.

#### cURL

```bash
curl https://api.mux.com/video/v1/assets \
  -H "Content-Type: application/json" \
  -X POST \
  -d '{ "inputs": [{ "url": "{INPUT_URL}" }], "playback_policies": ["public"], "video_quality": "basic" }' \
  -u ${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}
```

#### Node.js

```javascript
import Mux from '@mux/mux-node';
const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET
});

const asset = await mux.video.assets.create({
  inputs: [{ url: '{INPUT_URL}' }],
  playback_policies: ['public'],
  video_quality: 'basic',
});
```

#### Python

```python
import mux_python

configuration = mux_python.Configuration()
configuration.username = os.environ['MUX_TOKEN_ID']
configuration.password = os.environ['MUX_TOKEN_SECRET']

assets_api = mux_python.AssetsApi(mux_python.ApiClient(configuration))
input_settings = [mux_python.InputSettings(url='{INPUT_URL}')]
create_asset_request = mux_python.CreateAssetRequest(inputs=input_settings, playback_policies=[mux_python.PlaybackPolicy.PUBLIC], video_quality="basic")
create_asset_response = assets_api.create_asset(create_asset_request)
```

## Handling Large Files with UpChunk

For large files or unreliable connections where you need to pause/restart transfers, use chunked uploads with the resumable features of the upload endpoint. Mux provides [UpChunk](https://github.com/muxinc/upchunk) for browser-based chunked uploads.

### Installing UpChunk

**With NPM:**
```bash
npm install --save @mux/upchunk
```

**With Yarn:**
```bash
yarn add @mux/upchunk
```

**With CDN:**
```html
<script src="https://cdn.jsdelivr.net/npm/@mux/upchunk@2"></script>
```

### Using UpChunk

#### Basic JavaScript

```javascript
import * as UpChunk from '@mux/upchunk';

// Pretend you have an HTML page with an input like: <input id="picker" type="file" />
const picker = document.getElementById('picker');

picker.onchange = () => {
  const getUploadUrl = () =>
    fetch('/the-backend-endpoint').then(res => {
      res.ok ? res.text() : throw new Error('Error getting an upload URL :(')
    });

  const upload = UpChunk.createUpload({
    endpoint: getUploadUrl,
    file: picker.files[0],
    chunkSize: 5120, // Uploads the file in ~5mb chunks
  });

  // subscribe to events
  upload.on('error', err => {
    console.error('Error:', err.detail);
  });
}
```

#### React Example

```javascript
import React, { useState } from 'react';
import * as UpChunk from '@mux/upchunk';

function Page() {
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState(null);

  const handleUpload = (inputRef) => {
    try {
      const response = await fetch('/your-server-endpoint', { method: 'POST' });
      const url = await response.text();

      const upload = UpChunk.createUpload({
        endpoint: url, // Authenticated url
        file: inputRef.files[0], // File object with your video file's properties
        chunkSize: 5120, // Uploads the file in ~5mb chunks
      });

      // Subscribe to events
      upload.on('error', error => {
        setStatusMessage(error.detail);
      });

      upload.on('progress', progress => {
        setProgress(progress.detail);
      });

      upload.on('success', () => {
        setStatusMessage("Upload complete!");
      });
    } catch (error) {
      setErrorMessage(error);
    }
  }

  return (
    <div className="page-container">
      <h1>File upload button</h1>
      <label htmlFor="file-picker">Select a video file:</label>
      <input type="file" onChange={(e) => handleUpload(e.target)}
        id="file-picker" name="file-picker" />

      <label htmlFor="upload-progress">Downloading progress:</label>
      <progress value={progress} max="100"/>

      <em>{statusMessage}</em>
    </div>
  );
}

export default Page;
```

### Manual Chunking (Alternative to UpChunk)

If you prefer not to use UpChunk, you can implement chunked uploads manually:

1. **Split the file into chunks** that are a multiple of 256KB (`256 * 1024` bytes). For example, 20MB chunks would be 20,971,520 bytes (`20 * 1024 * 1024`). The final chunk can be the remainder of the file.

2. **Set required headers:**
   - `Content-Length`: the size of the current chunk
   - `Content-Range`: the byte range being uploaded (e.g., `bytes 0-1048575/10000000` for the first ~1MB chunk of a 10MB file)

3. **Make PUT requests** with each individual chunk as the body

4. **Handle responses:**
   - `308` response: continue uploading the next chunk
   - `200 OK` or `201 Created`: upload is complete

## Streaming Uploads (MediaRecorder)

When dealing with streaming data where the total file size is unknown until the end (such as live recordings or streaming AI-generated data), you can upload data to Mux in chunks as it becomes available.

### Benefits

- No need to know the total file size upfront
- Reduced memory usage on the client (upload chunks and release them instead of buffering)
- Faster uploads (upload chunks in parallel with recording instead of waiting for completion)

### MediaRecorder Example

#### Setup Global Variables

```javascript
// Global variables to track recording state and upload progress
let mediaRecorder;
let mediaStream;
let nextByteStart = 0;
const CHUNK_SIZE = 8 * 1024 * 1024; // 8MB chunks - must be multiple of 256KB
const maxRetries = 3; // Number of upload retry attempts
const lockName = 'uploadLock'; // Used by Web Locks API for sequential uploads
let activeUploads = 0; // Track number of chunks currently uploading
let isFinalizing = false; // Flag to prevent new uploads during finalization
```

#### Start Recording

```javascript
async function startRecording() {
  // Request access to user's media devices
  mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });

  // Use a widely supported MIME type for maximum compatibility
  const mimeType = 'video/webm';

  // Initialize MediaRecorder with optimal settings
  mediaRecorder = new MediaRecorder(mediaStream, {
    mimeType,
    videoBitsPerSecond: 5000000, // 5 Mbps video bitrate
    audioBitsPerSecond: 128000   // 128 kbps audio bitrate
  });

  // Buffer to accumulate media data until we have enough for a chunk
  let buffer = new Blob([], { type: mimeType });
  let bufferSize = 0;

  // Handle incoming media data
  mediaRecorder.ondataavailable = async (event) => {
    // Only process if we have data and aren't in the finalization phase
    if (event.data.size > 0 && !isFinalizing) {
      // Combine the new data with our existing buffer
      buffer = new Blob([buffer, event.data], { type: mimeType });
      bufferSize += event.data.size;

      // Keep processing chunks as long as we have enough data
      while (bufferSize >= CHUNK_SIZE) {
        // Extract exactly CHUNK_SIZE bytes from the start of our buffer
        const chunk = buffer.slice(0, CHUNK_SIZE);

        // Keep the remainder in the buffer for the next chunk
        buffer = buffer.slice(CHUNK_SIZE);
        bufferSize -= CHUNK_SIZE;

        // Upload this chunk
        await uploadChunk(chunk, nextByteStart, false);

        // Increment our position tracker
        nextByteStart += chunk.size;
      }
    }
  };

  // Start recording, getting data every 500ms
  mediaRecorder.start(500);
}
```

**Important:** Uploaded chunks must be delivered in multiples of 256KB (`256 * 1024` bytes). Since MediaRecorder chunks can be smaller, collect them in a buffer until you have at least 256KB. 8MB is a recommended chunk size.

#### Stop Recording

```javascript
async function stopRecording() {
  // Only proceed if we have an active mediaRecorder
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    // Stop recording new data
    mediaRecorder.stop();
    // Set flag to prevent new uploads from starting during finalization
    isFinalizing = true;

    // Wait for any in-progress chunk uploads to complete
    while (activeUploads > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Upload remaining data as the final chunk
    if (buffer.size > 0) {
      await uploadChunk(buffer, nextByteStart, true);
      nextByteStart += buffer.size;
    }

    // Clean up by stopping all media tracks
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
    }

    isFinalizing = false;
  }
}
```

#### Upload Chunk Function

```javascript
async function uploadChunk(chunk, byteStart, isFinalChunk) {
  // Calculate the end byte position for this chunk
  const byteEnd = byteStart + chunk.size - 1;

  // For the total size in the Content-Range header:
  // - If final chunk, use the actual total size (byteEnd + 1)
  // - Otherwise use '*' since we don't know the final size yet
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

**Important:** Use the Web Locks API (`navigator.locks.request`) to enforce sequential chunk uploads. If MediaRecorder is stopped, `ondataavailable` can trigger multiple times simultaneously, causing concurrent uploads that would fail if the final chunk is uploaded before previous uploads complete.

## Application Integration Pattern

When integrating Direct Uploads into your application, you typically want to:

1. Authenticate the request that gives users a signed URL
2. Save information about the file when the user creates the upload (uploader, timestamp, title, tags, etc.)
3. Associate the Asset created from the upload with that information

### Creating an Upload Route

Use the `passthrough` field to tie Assets back to your application data:

```javascript
const { json, send } = require('micro');
const uuid = require('uuid/v1');
const mux = new Mux();
const db = yourDatabase();

module.exports = async (req, res) => {
  const id = uuid();
  const assetInfo = await json(req);

  // Create a new upload using the Mux SDK
  const upload = await mux.video.uploads.create({
    cors_origin: 'https://your-app.com',
    new_asset_settings: {
      passthrough: id,
      playback_policy: ['public'],
      video_quality: 'basic'
    }
  });

  db.put(id, {
    uploadId: upload.id,
    metadata: assetInfo,
    status: 'waiting_for_upload',
  });

  // Return the ID and upload URL to the client
  send(res, 201, { id, url: upload.url });
}
```

### Handling Webhooks

Listen for Mux webhooks to track upload and asset status:

```javascript
const { json, send } = require('micro');
const db = yourDatabase();

module.exports = async (req, res) => {
  const { type: eventType, data: eventData } = await json(req);

  switch (eventType) {
    case 'video.asset.created': {
      const item = await db.get(eventData.passthrough);
      if (item.asset.status !== 'ready') {
        await db.put(item.id, {
          ...item,
          asset: eventData,
        });
      }
      break;
    };
    case 'video.asset.ready': {
      const item = await db.get(eventData.passthrough);
      await db.put(item.id, {
        ...item,
        asset: eventData,
      });
      break;
    };
    case 'video.upload.cancelled': {
      const item = await db.findByUploadId(eventData.passthrough);
      await db.put(item.id, { ...item, status: 'cancelled_upload' });
    }
    default:
      console.log('other event:', eventType, eventData);
  }
}
```

## Upload SDKs

Mux provides SDKs for reliable uploads that handle large files and preprocessing:

- **Android** - Upload directly from Android apps
- **iOS/iPadOS** - Upload directly from iOS or iPadOS
- **Web (Mux Uploader)** - Browser-based upload component

## Example Applications

- **with-mux-video**: Full Next.js example using direct uploads
  ```bash
  npx create-next-app --example with-mux-video with-mux-video-app
  ```

- **stream.new**: Open-source streaming application
  ```bash
  git clone git@github.com:muxinc/stream.new.git
  ```

Both examples use Next.js, UpChunk, Mux Direct Uploads, and Mux playback.
