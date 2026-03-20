# Setting Up Mux Video with Sanity CMS

This guide walks through the complete process of integrating Mux video with Sanity CMS, allowing content teams to upload videos to Mux directly from the Sanity Studio interface.

## Prerequisites

You need an existing Sanity Studio set up before proceeding. If you do not have one, follow the [Sanity Studio quickstart guide](https://www.sanity.io/docs/sanity-studio-quickstart/setting-up-your-studio) first.

## Step 1: Install the Mux Plugin

Run this command in your Sanity project folder:

```sh
npm i sanity-plugin-mux-input
```

## Step 2: Configure Your Schema

To use Mux video in your Sanity schemas, you need to create a schema type, import it to your schema types index, and configure the Mux plugin in your Sanity configuration file.

### 2.1 Create a Schema Type

Create a new file in your `schemaTypes` directory (or `schemas` directory, depending on your setup). For example, create a file called `videoBlogPost.ts`:

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

The key field type is `mux.video` - this is provided by the Mux plugin and enables the video upload interface.

### 2.2 Import the Schema Type

Import your new schema type in your schema types index file (usually `schemaTypes/index.ts` or `schemas/index.ts`):

```typescript
// schemaTypes/index.ts
import videoBlogPost from './videoBlogPost'

export const schemaTypes = [videoBlogPost]
```

### 2.3 Configure the Mux Plugin

Add the Mux plugin to your Sanity configuration file (`sanity.config.ts` or `sanity.config.js`):

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

## Step 3: Configure Mux Credentials

### Generate an Access Token

1. Go to the Access Token settings in your Mux account dashboard
2. Generate a new Access Token with the following permissions:
   - **Mux Video**: Read and Write
   - **Mux Data**: Read-only
   - **System** (optional): Read and Write - required only if you want to use signed playback

### Enter Credentials in Sanity

1. In Sanity Studio, navigate to the **Videos** section in your studio menu
2. Click on **Configure plugin**
3. Enter your Access Token ID and Secret Key in the configuration settings

You will also see an option to **Enable signed URLs**. This feature allows you to create videos with signed playback policies for additional security. You can leave this disabled initially and enable it later if needed.

## Step 4: Upload Video

Once configured, you can upload videos in several ways:

- **File selection**: Use the select button to open the file explorer on your system
- **Drag and drop**: Drag the file directly into the input area
- **URL paste**: Paste the URL to a video in the field

After the upload completes, you can select a thumbnail for the preview.

## Advanced Configuration Options

### Signed Tokens (Secure Playback)

By default, all assets uploaded to Mux through Sanity are created with a playback policy of `"public"`. This means videos and thumbnails are accessible at:

- Playback: `https://stream.mux.com/{PLAYBACK_ID}.m3u8`
- Thumbnails: `https://image.mux.com/{PLAYBACK_ID}/thumbnail.jpg`

For more control over delivery, you can enable signed URLs in the Sanity configuration. When enabled:

1. The Mux Plugin creates a URL signing key and saves it with your `secrets` document
2. Assets are created with `playback_policy: "signed"` instead of `"public"`
3. The signing key is used by the Mux Plugin to preview content inside Sanity UI
4. Your application must generate JWT tokens on the server for playback

With signed playback, URLs require a token parameter:

- Playback: `https://stream.mux.com/{SIGNED_PLAYBACK_ID}.m3u8?token={TOKEN}`
- Thumbnails: `https://image.mux.com/{SIGNED_PLAYBACK_ID}/thumbnail.jpg?token={TOKEN}`

**Important**: Enabling signed URLs requires you to generate signing tokens on your application server.

### Checking Playback Policy

When accessing content in your application, use the `MuxAsset.data.playback_ids` property to determine the asset's policy:

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

### Encoding Tiers

When uploading a new video, you can select which Encoding Tier is used:

- **Smart**: Provides additional options for maximum resolutions (1080p, 2K, or 4K)
- **Baseline**: Standard encoding

### Static Renditions

When using the Smart Encoding Tier, you can enable downloadable MP4s. This creates Static Renditions for the Asset, making MP4 files available for download to client devices.

### Max Video Resolution

You can specify the maximum resolution to encode the uploaded video. This is important for:

- Managing costs when uploaded videos exceed 1080p resolution
- Encoding and playing videos in 2K or 4K resolutions

### Auto-Generated Captions

Mux can automatically generate captions for videos by selecting the language of the spoken words. The captions are generated while the Asset is being prepared.

**Note**: The auto-generated captions feature should only be used to generate a single language captions track, and the language selected must match the spoken language.

## Retrieving Videos for Playback

To retrieve your video for playback in your application, query your Sanity content using GROQ or the Sanity client. The Mux asset data includes the playback ID needed for streaming.

## Other CMS Integrations

Mux also integrates with other CMS platforms:

- Contentful
- WordPress
- Strapi
- Cosmic
- DatoCMS
- Prepr

Community-maintained integrations include:

- PayloadCMS
- Statamic
