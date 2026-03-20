# CMS Integrations

Comprehensive guide to integrating Mux video with content management systems including Sanity, Contentful, WordPress, Strapi, Cosmic, DatoCMS, and Prepr. Covers installation, configuration, video upload workflows, playback integration, and advanced features.

## Overview

While Mux stores basic video metadata like titles and creator IDs, a content management system (CMS) can help you manage additional content around your videos - like descriptions, categories, related content, and other rich metadata that helps organize your video content within your application's broader content strategy.

Mux integrates with the following CMS applications:

**Headless CMS Integrations:**
- Sanity
- Contentful
- WordPress
- Strapi
- Cosmic
- DatoCMS
- Prepr

**Third-party (Community) Integrations:**
- PayloadCMS
- Statamic

---

## Sanity Integration

Sanity is a headless CMS that allows you to upload videos to Mux without leaving the Sanity studio.

### Prerequisites

You need an existing Sanity Studio. Follow the Sanity Studio quickstart guide to get started if needed.

### Installation

Install the Mux plugin in your Sanity project folder:

```sh
npm i sanity-plugin-mux-input
```

### Schema Configuration

#### Create a Schema Type

Create a new file in your `schemaTypes` directory (e.g., `videoBlogPost.ts`):

```typescript
// schemaTypes/videoBlogPost.ts
import { defineType, defineField } from 'sanity'

export default defineType({
  title: 'Video blog post',
  name: 'videoBlogPost',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Title'
    }),
    defineField({
      name: 'video',
      type: 'mux.video',
      title: 'Video file'
    })
  ]
})
```

#### Import the Schema Type

Import your schema type in `schemaTypes/index.ts`:

```typescript
// schemaTypes/index.ts
import videoBlogPost from './videoBlogPost'

export const schemaTypes = [videoBlogPost]
```

#### Configure the Mux Plugin

Add the Mux plugin to your Sanity configuration file (`sanity.config.ts`):

```typescript
// sanity.config.ts
import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { muxInput } from 'sanity-plugin-mux-input'
import { schemaTypes } from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'My Sanity Project',

  projectId: 'your-project-id',
  dataset: 'production',

  plugins: [
    structureTool(),
    muxInput()
  ],

  schema: {
    types: schemaTypes,
  },
})
```

### Enter Mux Credentials

Generate a new Access Token in your Mux account dashboard:
- Required permissions: Mux Video **Read** and **Write**, Mux Data **Read**
- For signed playback: Enable **Read** and **Write** for the `System` section

In Sanity Studio, navigate to the **Videos** section, click **Configure plugin**, and enter your Access Token ID and Secret Key.

### Upload Video

Use the select button to open file explorer, drag files into the input area, or paste a video URL. After upload, select your desired thumbnail.

### Advanced Options

#### Signed Tokens

By default, assets are created with `playback_policy: "public"`. To enable signed URLs:

1. Enable the feature in the Sanity configuration popover
2. The plugin creates a URL signing key and saves it with your secrets document
3. New assets are created with `playback_policy: "signed"`
4. The signing key is used to preview content in Sanity UI

Asset data structure with playback policies:

```json
{
  "_id": "0779365f-bbd1-46ab-9d78-c55feeb28faa",
  "_type": "mux.videoAsset",
  "assetId": "fNMFNYMq48EwgJM7AIn1rNldiFBcVIdK",
  "data": {
    "playback_ids": [
      {
        "id": "01cBJKm5KoeQii00YYGU7Rvpzvh6V01l4ZK",
        "policy": "public"
      }
    ]
  },
  "status": "ready"
}
```

For signed playback, construct URLs with tokens:
- Playback: `https://stream.mux.com/{SIGNED_PLAYBACK_ID}.m3u8?token={TOKEN}`
- Thumbnails: `https://image.mux.com/{SIGNED_PLAYBACK_ID}/thumbnail.jpg?token={TOKEN}`

**Note:** You must generate JWT tokens on your server for signed URLs.

#### Encoding Tiers

Select encoding tier when uploading:
- **Smart**: Additional options for maximum resolutions (1080p, 2K, 4K)
- **Baseline**: Standard encoding

#### Static Renditions

With Smart Encoding Tier, enable downloadable MP4s to create static renditions available for download via formatted URLs.

#### Auto-Generated Captions

Select the language of spoken words to automatically generate captions during asset preparation.

**Warning:** Only generate a single language caption track. The selected language must match the spoken language.

---

## Contentful Integration

The Mux Contentful app connects Contentful with your Mux account for uploading and streaming videos.

### Enter Mux Credentials

Create an access token with:
- **Read** and **Write** permissions for Mux Video
- **Read** for Mux Data

### Install the App

1. In Contentful dashboard, click **Apps > Manage Apps**
2. Find and install the Mux app
3. Enter your Mux credentials in the configuration screen
4. Assign Mux to JSON fields from your content model

Alternatively, create a JSON Object type field in a Content Model and edit its appearance to assign Mux.

#### Add Mux Sidebar

Add the Mux sidebar to your Content Model by clicking the plus sign in the sidebar configuration. This sidebar visualizes pending changes with publication.

### Upload Video

Create a new entry and use the drag-and-drop zone or file picker. Configuration options before upload:

- **Video Quality Settings**: Define video quality level
- **Privacy Settings**: Public or Protected visibility
- **Metadata**: Add title for Mux Dashboard
- **Captions**: Auto-generated or custom captions
- **MP4 Generation**: Static renditions for audio-only and audio with video

You can also enter an existing Mux Asset ID or URL to a video file.

### Playback

Query your Mux video through the Contentful API to get video data:

```json
{
  "version": 3,
  "uploadId": "some-upload-id",
  "assetId": "some-asset-id",
  "playbackId": "YOUR_PLAYBACK_ID",
  "ready": true,
  "ratio": "16:9",
  "max_stored_resolution": "HD",
  "max_stored_frame_rate": 29.928,
  "duration": 23.857167,
  "audioOnly": false,
  "created_at": 1664219467,
  "audioTracks": [
    {
      "type": "audio",
      "primary": true,
      "max_channels": 2,
      "max_channel_layout": "stereo",
      "id": "some-audio-track-id",
      "duration": 10.026667
    }
  ],
  "meta": {
    "title": "some-video-title",
    "external_id": "some-external-id"
  }
}
```

Use the `playbackId` to construct the HLS URL:

```text
https://stream.mux.com/{YOUR_PLAYBACK_ID}.m3u8
```

#### Using Mux Player

Copy the player code from the **Player Code** tab in Contentful. Options include:
- Autoplay, mute, and loop checkboxes
- Iframe embed code for alternative integration

### Captions and Subtitles

#### Auto-Generated Captions

Select Language Code (auto-populated from Audio Name). The language must match the spoken audio.

#### Custom Captions

Provide a public URL to `.vtt` or `.srt` caption files. Specify caption name and mark as closed captions if needed.

You can upload caption files to Contentful Media Manager, then right-click the download button and select "copy link."

#### Managing Captions

- Add or delete caption files
- Download files for editing
- Resync existing captions via the Data tab
- Deletions appear in Mux sidebar and require publishing

### Audio Tracks

Add multiple audio tracks for different languages or alternative audio content.

1. Provide a public URL of an audio file
2. Specify Language Code and Audio Name
3. Audio tracks can be added, deleted, and managed similarly to captions

### Mux Sidebar

The sidebar displays:
- Pending actions that need synchronization with Mux
- Changes requiring publishing to take effect

### Publishing Requirements

Breaking changes require publishing to apply to Mux:
- Delete Video
- Delete Captions
- Delete Audio
- Change Metadata Title
- Delete MP4 Renditions
- Change Video Visibility

### Advanced: Signed URLs

Enable signed URLs in configuration to:
1. Create a URL signing key saved with Contentful configuration
2. Select "Protected" when uploading for `playback_policy: "signed"`
3. Use the signing key for Contentful UI previews

Signed asset structure:

```json
{
  "uploadId": "some-upload-id",
  "assetId": "some-asset-id",
  "signedPlaybackId": "YOUR_SIGNED_PLAYBACK_ID",
  "ready": true,
  "ratio": "16:9"
}
```

**Note:** Requires generating JWT tokens on your server.

---

## WordPress Integration

The Mux Video Uploader plugin by 2Coders enables uploading, managing, and embedding videos from WordPress.

### Prerequisites

WordPress.com Business plan or higher (no requirement for self-hosted WordPress).

### Install the Plugin

#### From WordPress Plugin Directory

1. Navigate to **Plugins > Add Plugin**
2. Search for "Mux Video Uploader by 2Coders"
3. Click **Install and activate**

#### Manual Installation

1. Download the plugin ZIP from WordPress.org
2. Go to **Plugins > Add Plugin**
3. Click **Upload Plugin**, select the ZIP file
4. Click **Install Now**, then **Activate Plugin**

### Create Mux Account and Credentials

1. Sign up at mux.com
2. Generate an API Access Token with:
   - Mux Video **Read** and **Write** permissions
   - Mux Data **Read**

### Connect WordPress to Mux

1. Go to **Mux Video > Settings** in WordPress admin
2. Enter Mux API credentials (API ID and Secret Key)
3. Click **Save Settings**

### Upload Video

Upload videos through the plugin interface. Enable advanced features during or after creation:
- Signed URLs
- Subtitles & Captions
- MP4 generation

### Play Video

#### Using Gutenberg Block

1. Add or edit a post/page
2. Click + to add a new block
3. Search for "Mux Video" and select
4. Choose the asset and click **Insert**
5. Preview and publish

#### Using Shortcode Block

Use shortcodes for customized Mux Player configuration instead of defaults.

### Advanced Video Options

| Feature | Description |
|---------|-------------|
| Video Quality Levels | Basic, Plus, or Premium |
| MP4 Generation | Highest, Audio-Only, or both |
| Signed Tokens | Protected (secured) or Public |
| Auto-Generated Captions | Select spoken language for automatic generation |
| Custom Captions | Upload one or more caption files per asset |

**Warning:** Auto-generated captions should only generate a single language track matching the spoken language.

---

## Strapi Integration

The Mux Video Uploader plugin allows uploading to Mux from within the Strapi interface.

### Requirements

- Publicly accessible Strapi installation
- Mux Access Token and Secret Key
- Webhook listener configuration

### Install the Plugin

#### Strapi v5

```sh
npm i strapi-plugin-mux-video-uploader@latest
```

or with yarn:

```sh
yarn add strapi-plugin-mux-video-uploader@latest
```

#### Strapi v4

```sh
npm i strapi-plugin-mux-video-uploader@2.8.4
```

or with yarn:

```sh
yarn add strapi-plugin-mux-video-uploader@2.8.4
```

#### Strapi v3

```sh
npm i strapi-plugin-mux-video-uploader@2.0.0
```

or with yarn:

```sh
yarn add strapi-plugin-mux-video-uploader@2.0.0
```

### Create Access Token in Mux

Generate an access token with Mux Video **Read** and **Write** permissions. Save the Access Token ID and Secret Key.

### Configure Webhook Listener

Create a webhook in Mux Dashboard with the URL:

```txt
{YOUR_STRAPI_DOMAIN_HERE}/mux-video-uploader/webhook-handler
```

Copy the Signing Secret for later use.

### Setup Configuration in Strapi

1. Visit **Settings** page in Strapi
2. Navigate to **MUX VIDEO UPLOADER** section
3. Enter credentials from previous steps
4. Click **Save**

### Upload Video

Use the Mux Video Uploader page in Strapi's menu to upload via remote URL or local file.

Query Strapi using REST or GraphQL to access `playback_id` for streaming or thumbnail retrieval.

### Advanced Options

#### Signed Tokens

Enable signed URLs in Strapi settings. Asset data includes a `signed` property:

```json
{
  "id": 9,
  "upload_id": null,
  "asset_id": "H9H01yni83yRLuu6cKaf8jQI8XW01SPp5XI7WrGsD37n00",
  "playback_id": "aAqXNee00zlfzR2Rsw01NmGBvxSg1Ocs3g008YChvtG6aM",
  "signed": true,
  "isReady": true,
  "duration": 25.492133,
  "aspect_ratio": "16:9",
  "createdAt": "2024-04-01T23:48:19.760Z",
  "updatedAt": "2024-04-01T23:48:21.605Z"
}
```

A lock icon appears on signed assets in the Strapi UI.

#### Encoding Tiers

- **Smart**: Options for 1080p, 2K, or 4K maximum resolution
- **Baseline**: Standard encoding

#### Static Renditions

Enable downloadable MP4s with Smart Encoding Tier.

#### Captions/Subtitles

- **Auto-generated**: Mux generates captions during asset preparation
- **Custom**: Upload `.vtt` or `.srt` files via Strapi (files are served from a public URL)

---

## Cosmic Integration

Upload videos directly to Mux from your Cosmic JS Dashboard.

### Install the Mux Extension

1. Log in to Cosmic JS
2. Navigate to **Your Bucket > Settings > Extensions**
3. Find the Mux Videos Extension and click **Install**

### Enter Mux Credentials

In Extension settings under Query Parameters, provide:
- `mux_access_token`
- `mux_secret`

Generate an access token with **Read** and **Write** permissions for Mux Video.

### Upload Video

1. Click the Mux Videos Extension link in the navigation
2. Upload videos
3. Video data saves to the Mux Videos Object Type

Add Mux Videos to any Object using an Object metafield. Fetch data using the `mux_playback_url` property in Object metadata.

---

## DatoCMS Integration

Mux is enabled by default in every new DatoCMS project. Upload videos directly from the dashboard or using the REST API.

### Upload Video

Drag and drop videos in the DatoCMS media area.

### Fetch Video Information via GraphQL

Available properties for uploaded videos:
- HLS video streaming URL
- High, medium, and low quality MP4 versions
- Duration and frame rate
- Thumbnail URL (resizable, croppable, JPEG/PNG/GIF formats)

Example GraphQL query:

```gql
{
  allUploads(filter: {type: {eq: video}}) {
    video {
      streamingUrl
      mp4High: mp4Url(res: high)
      mp4Med: mp4Url(res: medium)
      mp4Low: mp4Url(res: low)
      duration
      framerate
      thumbJpg: thumbnailUrl(format: jpg)
      thumbPng: thumbnailUrl(format: png)
      thumbGif: thumbnailUrl(format: gif)
    }
  }
}
```

---

## Prepr Integration

Mux is enabled for every new Prepr account by default. Upload videos, add them to content models, and query URLs for display.

### Upload Video Content

1. Create a free Prepr account
2. Navigate to the **Media** page
3. Drag and drop audio/video files

### Add Live Streams

1. Navigate to the **Media** page
2. Click **Upload asset** dropdown
3. Choose **Add live stream**
4. Enter broadcasting details

### Add Videos to Content Items

1. Navigate to the **Content** page
2. Create or open a content item with an assets field
3. Drag and drop files or click to add previously uploaded videos
4. Save or publish to make videos available

### Query the GraphQL API

Example query for video URLs and playback IDs:

```gql
{
  Posts {
    items {
      videos {
        hls: url
        playback_id
        mp4High: url(res: "high")
        mp4Medium: url(res: "medium")
        mp4Low: url(res: "low")
        duration
        cover
      }
    }
  }
}
```

Options available:
- `url` field returns HLS streaming URL by default
- `playback_id` returns the playback ID
- `res` option for MP4 versions (high, medium, low)
- `duration` for video length
- `cover` for cover image (adjustable width, height, animated, time)

### Static Renditions

Prepr uses the plus quality level by default. MP4 support is enabled on all accounts via the `url` field.

### Captions/Subtitles

Edit assets from the Media page and click **+ Add subtitles** to upload caption files (`.vtt` or `.srt` formats).

---

## Access Token Requirements Summary

| CMS | Mux Video | Mux Data | System (for Signed URLs) |
|-----|-----------|----------|--------------------------|
| Sanity | Read + Write | Read | Read + Write |
| Contentful | Read + Write | Read | - |
| WordPress | Read + Write | Read | - |
| Strapi | Read + Write | - | - |
| Cosmic | Read + Write | - | - |
| DatoCMS | Built-in | Built-in | Built-in |
| Prepr | Built-in | Built-in | Built-in |

---

## Playback URL Patterns

### Public Playback

```text
https://stream.mux.com/{PLAYBACK_ID}.m3u8
```

### Signed Playback

```text
https://stream.mux.com/{SIGNED_PLAYBACK_ID}.m3u8?token={TOKEN}
```

### Thumbnails

Public:
```text
https://image.mux.com/{PLAYBACK_ID}/thumbnail.jpg
```

Signed:
```text
https://image.mux.com/{SIGNED_PLAYBACK_ID}/thumbnail.jpg?token={TOKEN}
```

**Note:** Tokens must be generated on your server using JWT when using signed playback.
