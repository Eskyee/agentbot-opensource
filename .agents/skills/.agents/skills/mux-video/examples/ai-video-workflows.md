# AI Video Workflows with @mux/ai

Complete guide to using the `@mux/ai` library for AI-powered video workflows including automatic chapter generation, video summarization and tagging, content moderation, video recommendations with embeddings, subtitle translation, and audio dubbing.

## Overview

The `@mux/ai` library is an open-source library that provides prebuilt workflows for common video AI tasks. It works with popular LLM providers (OpenAI, Anthropic, or Google) and integrates directly with Mux's video platform.

**GitHub Repository:** https://github.com/muxinc/ai

## Installation

```bash
npm install @mux/ai
```

## Configuration

Set your environment variables based on the workflows you plan to use:

```bash
# Required for all workflows
MUX_TOKEN_ID=your_mux_token_id
MUX_TOKEN_SECRET=your_mux_token_secret

# LLM Provider API Keys (only need one)
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key

# For moderation with Hive (alternative to OpenAI)
HIVE_API_KEY=your_hive_api_key

# For dubbing with ElevenLabs
ELEVENLABS_API_KEY=your_elevenlabs_api_key

# For translation/dubbing workflows (S3-compatible storage)
S3_ENDPOINT=https://your-s3-endpoint.com
S3_REGION=auto
S3_BUCKET=your-bucket-name
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
```

## Supported AI Providers

| Provider | Default Model | Best For |
|----------|---------------|----------|
| OpenAI | `gpt-5-mini` | Fast and cost-effective |
| Anthropic | `claude-sonnet-4-5` | Nuanced understanding |
| Google | `gemini-2.5-flash` | Balance of speed and quality |

You can override the default model in any workflow:

```javascript
const result = await generateChapters("your-mux-asset-id", "en", {
  provider: "openai",
  model: "gpt-4o"  // Override default model
});
```

---

## AI-Generated Chapters

Automatically generate chapter markers for video playback using AI analysis of transcripts.

### Basic Usage

```javascript
import { generateChapters } from "@mux/ai/workflows";

const result = await generateChapters("your-mux-asset-id", "en", {
  provider: "openai"  // or "anthropic" or "google"
});
```

### Response Format

```json
{
  "chapters": [
    { "startTime": 0, "title": "Introduction" },
    { "startTime": 15, "title": "Setting Up the Live Stream" },
    { "startTime": 29, "title": "Adding Functionality with HTML and JavaScript" },
    { "startTime": 41, "title": "Identifying Favorite Scene for Clipping" }
  ]
}
```

### Adding Chapters to Mux Player

```javascript
const player = document.querySelector('mux-player');
player.addChapters(result.chapters);
```

### Custom Prompts

Override specific parts of the prompt to tune the output:

```javascript
const result = await generateChapters("your-mux-asset-id", "en", {
  provider: "anthropic",
  promptOverrides: {
    system: "You are a professional video editor. Create concise, engaging chapter titles.",
    instructions: "Generate 5-8 chapters with titles under 50 characters each."
  }
});
```

### Webhook Integration

Trigger chapter generation when captions are ready:

```javascript
export async function handleWebhook(req, res) {
  const event = req.body;

  if (event.type === 'video.asset.track.ready' &&
      event.data.type === 'text' &&
      event.data.language_code === 'en') {
    const result = await generateChapters(event.data.asset_id, "en");
    await db.saveChapters(event.data.asset_id, result.chapters);
  }
}
```

### How It Works

1. Fetches the video transcript from Mux using the asset ID
2. Formats the transcript for the AI provider
3. Sends optimized prompts to generate chapter markers
4. Parses and validates the AI response
5. Converts timestamps to the format Mux Player expects

---

## Video Summarization and Tagging

Automatically generate titles, descriptions, and tags by analyzing video transcripts and storyboard images.

### Basic Usage

```javascript
import { getSummaryAndTags } from "@mux/ai/workflows";

const result = await getSummaryAndTags("your-mux-asset-id", {
  tone: "professional"  // or "normal" or "sassy"
});

console.log(result.title);
// "How to Build a Video Platform in 2025"

console.log(result.description);
// "Learn the fundamentals of building a modern video platform..."

console.log(result.tags);
// ["video streaming", "web development", "tutorial", "javascript"]
```

### Tone Options

| Tone | Description | Example Title |
|------|-------------|---------------|
| `normal` | Balanced and conversational (default) | Effortless Thumbnails & GIFs with Mux API |
| `professional` | Formal and business-appropriate | Mux API Simplifies Video Thumbnail and GIF Creation |
| `sassy` | Playful and engaging | Developer Snags Thumbnails and GIFs with Mux API |

```javascript
// Professional tone
const professional = await getSummaryAndTags("your-mux-asset-id", {
  tone: "professional"
});

// Sassy tone
const sassy = await getSummaryAndTags("your-mux-asset-id", {
  tone: "sassy"
});
```

### Provider Options

```javascript
const result = await getSummaryAndTags("your-mux-asset-id", {
  provider: "anthropic",  // or "openai" or "google"
  model: "claude-opus-4-5"  // Optional: override default model
});
```

### Excluding Transcript

By default, both storyboard images and transcript are analyzed. To use only visual analysis:

```javascript
const result = await getSummaryAndTags("your-mux-asset-id", {
  includeTranscript: false
});
```

### Custom Prompts

```javascript
const result = await getSummaryAndTags("your-mux-asset-id", {
  promptOverrides: {
    system: "You are a video content specialist focused on technical tutorials.",
    instructions: "Create a title under 60 characters and exactly 5 tags focused on technical concepts."
  }
});
```

### Webhook Integration

```javascript
export async function handleWebhook(req, res) {
  const event = req.body;

  if (event.type === 'video.asset.track.ready' &&
      event.data.type === 'text' &&
      event.data.language_code === 'en') {
    const result = await getSummaryAndTags(event.data.asset_id, { tone: "professional" });
    await db.updateVideo(event.data.asset_id, {
      title: result.title,
      description: result.description,
      tags: result.tags
    });
  }
}
```

### Use Cases

- **Improve search and discovery**: Use titles, descriptions, and tags to build better search experiences
- **Content filtering**: Allow users to filter videos by auto-generated tags
- **Analytics and insights**: Track content trends across your video library

### How It Works

1. Fetches storyboard images for visual analysis
2. Optionally fetches the video transcript from Mux
3. Sends optimized multimodal prompts to the AI provider
4. Parses and validates the structured response
5. Returns clean, ready-to-use metadata

---

## Content Moderation

Automatically screen video content for inappropriate material using AI-powered image analysis.

### Basic Usage

```javascript
import { getModerationScores } from "@mux/ai/workflows";

const result = await getModerationScores("your-mux-asset-id", {
  provider: "openai",  // or "hive"
  thresholds: {
    sexual: 0.7,    // Flag content with 70%+ confidence
    violence: 0.8   // Flag content with 80%+ confidence
  }
});

console.log(result.exceedsThreshold);  // true if content flagged
console.log(result.maxScores.sexual);   // Highest sexual content score
console.log(result.maxScores.violence); // Highest violence score
```

### Response Format

```javascript
{
  "assetId": "your-asset-id",
  "exceedsThreshold": false,
  "maxScores": {
    "sexual": 0.12,
    "violence": 0.05
  },
  "thresholds": {
    "sexual": 0.7,
    "violence": 0.8
  },
  "thumbnailScores": [
    { "sexual": 0.12, "violence": 0.05, "error": false },
    { "sexual": 0.08, "violence": 0.03, "error": false }
  ]
}
```

### Provider Options

| Provider | Model | Description |
|----------|-------|-------------|
| OpenAI | `omni-moderation-latest` | Multi-modal moderation with vision support |
| Hive | Specialized safety models | Visual moderation using Hive's content safety models |

```javascript
// Using OpenAI (default)
const result = await getModerationScores("your-mux-asset-id", {
  provider: "openai"
});

// Using Hive
const result = await getModerationScores("your-mux-asset-id", {
  provider: "hive"
});
```

### Configuring Thresholds

Thresholds use a 0-1 scale where higher values mean stricter moderation (fewer false positives):

```javascript
const result = await getModerationScores("your-mux-asset-id", {
  thresholds: {
    sexual: 0.7,    // Flag content with 70%+ confidence of sexual content
    violence: 0.8   // Flag content with 80%+ confidence of violence
  }
});
```

### Webhook Integration with Automatic Removal

```javascript
export async function handleWebhook(req, res) {
  const event = req.body;

  if (event.type === 'video.asset.ready') {
    const result = await getModerationScores(event.data.id, {
      thresholds: { sexual: 0.7, violence: 0.8 }
    });

    if (result.exceedsThreshold) {
      // Remove access to flagged content
      await mux.video.assets.deletePlaybackId(
        event.data.id,
        event.data.playback_ids[0].id
      );
    }
  }
}
```

### How It Works

1. **Thumbnail extraction**: Selects representative frames based on video duration
   - Videos under 50 seconds: 5 evenly-spaced thumbnails
   - Longer videos: One thumbnail every 10 seconds
2. **Concurrent analysis**: Sends all thumbnails to the moderation API in parallel
3. **Score aggregation**: Tracks the highest scores across all thumbnails
4. **Threshold evaluation**: Compares max scores against your configured thresholds
5. **Error handling**: Gracefully handles API failures and returns partial results

### Best Practices

- Maintain a database of automated moderation actions to fine-tune thresholds
- Add notifications to users or moderators when content is flagged
- Implement manual review queues for borderline content
- Use transcriptions or captions for additional moderation
- Be mindful of AI API rate limits and implement moderation queueing if needed

---

## Video Recommendation Engine

Build a content-based recommendation system using video embeddings and vector similarity search.

### Overview

The core concept is to convert text (video transcripts) into high-dimensional vectors (embeddings) that capture semantic meaning. Videos with similar content will have embeddings that are close together in vector space.

### Basic Usage

```javascript
import { generateVideoEmbeddings } from "@mux/ai/workflows";

const result = await generateVideoEmbeddings("your-mux-asset-id", {
  provider: "openai",   // or "google"
  languageCode: "en"
});

// Use the averaged embedding for video-level search
console.log(result.averagedEmbedding);
// Array of 1536 numbers (for OpenAI's text-embedding-3-small)

// Or use individual chunks for timestamp-accurate search
console.log(result.chunks.length);
console.log(result.chunks[0].embedding);
```

### Response Format

```javascript
{
  "assetId": "your-asset-id",
  "averagedEmbedding": [0.123, -0.456, ...],  // Single vector representing the whole video
  "chunks": [
    {
      "chunkId": "chunk_0",
      "embedding": [0.234, -0.567, ...],
      "metadata": {
        "tokenCount": 450,
        "startTime": 0,
        "endTime": 30.5,
        "text": "Welcome to our tutorial..."
      }
    }
  ],
  "metadata": {
    "totalChunks": 12,
    "totalTokens": 5432,
    "embeddingDimensions": 1536,
    "languageCode": "en"
  }
}
```

### Provider Options

| Provider | Model | Dimensions |
|----------|-------|------------|
| OpenAI (default) | `text-embedding-3-small` | 1536 |
| OpenAI | `text-embedding-3-large` | 3072 |
| Google | `text-embedding-004` | 768 |

```javascript
// Using OpenAI (default)
const result = await generateVideoEmbeddings("your-mux-asset-id", {
  provider: "openai"
});

// Using Google
const result = await generateVideoEmbeddings("your-mux-asset-id", {
  provider: "google"
});

// Override the default model
const result = await generateVideoEmbeddings("your-mux-asset-id", {
  provider: "openai",
  model: "text-embedding-3-large"  // 3072 dimensions, higher quality
});
```

### Chunking Strategies

For long videos, transcripts are split into chunks. The chunking strategy affects search granularity:

**Token-based chunking** (default): Splits text by token count. Best for general video-level recommendations.

```javascript
const result = await generateVideoEmbeddings("your-mux-asset-id", {
  chunkingStrategy: {
    type: "token",
    maxTokens: 500,
    overlap: 100  // Tokens of overlap between chunks
  }
});
```

**VTT-based chunking**: Preserves caption boundaries and timing metadata. Best for timestamp-accurate search.

```javascript
const result = await generateVideoEmbeddings("your-mux-asset-id", {
  chunkingStrategy: {
    type: "vtt",
    maxTokens: 500,
    overlapCues: 2  // Number of caption cues to overlap
  }
});
```

### Storing Embeddings in Vector Databases

#### Using Pinecone

```javascript
import { Pinecone } from '@pinecone-database/pinecone';
import { generateVideoEmbeddings } from "@mux/ai/workflows";

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pinecone.index('video-recommendations');

// Generate and store embeddings
const result = await generateVideoEmbeddings("your-mux-asset-id");

// Store the averaged embedding for video-level search
await index.upsert([{
  id: "your-mux-asset-id",
  values: result.averagedEmbedding,
  metadata: {
    title: "Video Title",
    duration: 300,
    totalChunks: result.metadata.totalChunks
  }
}]);
```

#### Using Supabase with pgvector

```javascript
import { createClient } from '@supabase/supabase-js';
import { generateVideoEmbeddings } from "@mux/ai/workflows";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Generate embeddings
const result = await generateVideoEmbeddings("your-mux-asset-id");

// Store in Supabase
await supabase.from('video_embeddings').insert({
  asset_id: "your-mux-asset-id",
  embedding: result.averagedEmbedding,
  metadata: result.metadata
});
```

### Finding Similar Videos

```javascript
// Generate embedding for the query video
const queryResult = await generateVideoEmbeddings(queryAssetId);

// Search for similar videos in Pinecone
const searchResults = await index.query({
  vector: queryResult.averagedEmbedding,
  topK: 5,  // Return 5 most similar videos
  includeMetadata: true
});

// Display recommendations
searchResults.matches.forEach(match => {
  console.log(`Similar video: ${match.id}`);
  console.log(`Similarity score: ${match.score}`);
});
```

### Webhook Integration

```javascript
export async function handleWebhook(req, res) {
  const event = req.body;

  if (event.type === 'video.asset.track.ready' &&
      event.data.type === 'text' &&
      event.data.language_code === 'en') {
    const result = await generateVideoEmbeddings(event.data.asset_id);
    await vectorDB.upsert({
      id: event.data.asset_id,
      embedding: result.averagedEmbedding
    });
  }
}
```

### Vector Database Options

- **Pinecone**: Managed vector database, easy to use
- **Supabase with pgvector**: PostgreSQL extension, good for existing Postgres users
- **Weaviate**: Open-source vector database
- **Milvus**: Scalable vector database
- **Qdrant**: High-performance vector search

### How It Works

1. **Fetching transcript**: Downloads the VTT file from Mux
2. **Chunking**: Splits long transcripts into manageable pieces
3. **Token counting**: Ensures chunks fit within model limits
4. **Batch processing**: Sends chunks to the embedding API efficiently
5. **Averaging**: Computes a single vector for the whole video
6. **Metadata tracking**: Preserves timing and token information

### Best Practices

- Use averaged embeddings for video-level search (faster and simpler)
- Use chunk embeddings for precise matching within videos
- Always use the same embedding model for queries and storage
- Set quality thresholds for minimum similarity scores

---

## Subtitle Translation

Automatically translate video captions into different languages using AI.

### Basic Usage

```javascript
import { translateCaptions } from "@mux/ai/workflows";

// Translate English captions to Spanish
const result = await translateCaptions(
  "your-mux-asset-id",
  "en",  // source language
  "es",  // target language
  {
    provider: "anthropic"  // or "openai" or "google"
  }
);

console.log(result.uploadedTrackId);
// The new Mux track ID for the translated captions
```

### Language Support

Uses ISO 639-1 language codes. Common translations:

```javascript
await translateCaptions("your-mux-asset-id", "en", "es");  // English to Spanish
await translateCaptions("your-mux-asset-id", "en", "fr");  // English to French
await translateCaptions("your-mux-asset-id", "en", "de");  // English to German
await translateCaptions("your-mux-asset-id", "en", "ja");  // English to Japanese
await translateCaptions("your-mux-asset-id", "en", "zh");  // English to Chinese
await translateCaptions("your-mux-asset-id", "en", "ar");  // English to Arabic
```

### Provider Options

```javascript
const result = await translateCaptions("your-mux-asset-id", "en", "es", {
  provider: "anthropic",
  model: "claude-opus-4-5"  // Optional: override default model
});
```

### Translate Without Uploading

Get the translated file for manual review before uploading:

```javascript
const result = await translateCaptions("your-mux-asset-id", "en", "es", {
  uploadToMux: false
});

console.log(result.presignedUrl);
// URL to download the translated VTT file for review
```

### Webhook Integration

```javascript
export async function handleWebhook(req, res) {
  const event = req.body;

  if (event.type === 'video.asset.track.ready' &&
      event.data.type === 'text' &&
      event.data.language_code === 'en') {
    const result = await translateCaptions(event.data.asset_id, "en", "es");
    await db.saveTranslationTrack(event.data.asset_id, result.uploadedTrackId);
  }
}
```

### Complete Example

```javascript
import express from 'express';
import { translateCaptions } from "@mux/ai/workflows";

const app = express();
app.use(express.json());

app.post('/webhook', async (req, res) => {
  const event = req.body;

  if (event.type === 'video.asset.track.ready' &&
      event.data.type === 'text' &&
      event.data.language_code === 'en') {

    const assetId = event.data.asset_id;

    try {
      const result = await translateCaptions(assetId, "en", "es");
      console.log(`Spanish captions created: ${result.uploadedTrackId}`);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Translation error:', error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(200).json({ message: 'Event ignored' });
  }
});

app.listen(3000);
```

### Using with Mux Player

Mux Player automatically detects multiple caption tracks and shows a language selector:

```html
<mux-player
  playback-id="your-playback-id"
  metadata-video-title="My Video"
></mux-player>
```

### How It Works

1. **Fetching source captions**: Downloads the VTT file from Mux
2. **Translation**: Sends the captions to your chosen AI provider with optimized prompts
3. **VTT preservation**: Maintains timing information and formatting
4. **S3 upload**: Uploads the translated file to your S3 bucket with a presigned URL
5. **Mux track creation**: Creates a new caption track on your asset

### Best Practices

- Validate translations and review quality for critical content
- Handle errors gracefully for very long videos
- Consider costs when translating to many languages

---

## Audio Dubbing

Automatically translate and dub video audio into different languages using ElevenLabs.

### Prerequisites

- ElevenLabs API key with dubbing access
- S3-compatible storage bucket for audio file hosting

### Enabling Audio Static Renditions

The library automatically requests audio-only static renditions if they do not exist. You can pre-enable them:

```javascript
import Mux from '@mux/mux-node';

const mux = new Mux();

// When creating a video
const asset = await mux.video.assets.create({
  input: "https://example.com/video.mp4",
  playback_policy: ['public'],
  static_renditions: [
    { resolution: 'audio-only' }  // Enable audio.m4a rendition
  ]
});

// Or add to an existing asset
await mux.video.assets.createStaticRendition("your-mux-asset-id", {
  resolution: 'audio-only'
});
```

### Basic Usage

```javascript
import { translateAudio } from "@mux/ai/workflows";

// Dub video audio to Spanish (source language is auto-detected)
const result = await translateAudio(
  "your-mux-asset-id",
  "es"  // target language
);

console.log(result.uploadedTrackId);
// The new Mux audio track ID for the dubbed audio

console.log(result.dubbingId);
// ElevenLabs dubbing ID for tracking

console.log(result.targetLanguageCode);  // "es"
```

### Language Support

Uses ISO 639-1 language codes. The source language is automatically detected by ElevenLabs:

```javascript
await translateAudio("your-mux-asset-id", "es");  // Spanish
await translateAudio("your-mux-asset-id", "fr");  // French
await translateAudio("your-mux-asset-id", "de");  // German
await translateAudio("your-mux-asset-id", "ja");  // Japanese
await translateAudio("your-mux-asset-id", "zh");  // Chinese
await translateAudio("your-mux-asset-id", "pt");  // Portuguese
await translateAudio("your-mux-asset-id", "it");  // Italian
```

### Speaker Detection

Specify the number of speakers for better dubbing quality:

```javascript
// Auto-detect number of speakers (default)
const result = await translateAudio("your-mux-asset-id", "es", {
  numSpeakers: 0
});

// Specify exact number of speakers
const result = await translateAudio("your-mux-asset-id", "es", {
  numSpeakers: 2  // For videos with 2 distinct speakers
});
```

### Download Without Uploading

Get the dubbed audio file for manual review:

```javascript
const result = await translateAudio("your-mux-asset-id", "es", {
  uploadToMux: false
});

console.log(result.presignedUrl);
// URL to download the dubbed audio file
```

### Webhook Integration

```javascript
export async function handleWebhook(req, res) {
  const event = req.body;

  if (event.type === 'video.asset.static_rendition.ready') {
    const result = await translateAudio(event.data.id, "es");
    await db.saveDubbedTrack(event.data.id, result.uploadedTrackId);
  }
}
```

### Playing Multi-Language Content

Mux Player automatically detects multiple audio tracks and shows an audio selector. Users can switch between audio languages using the audio menu in player controls.

### How It Works

1. **Fetching source audio**: Downloads the audio.m4a static rendition from Mux
2. **ElevenLabs dubbing**: Submits the audio with language parameters
3. **Polling**: Waits for the dubbing job to complete (can take several minutes)
4. **Download**: Retrieves the dubbed audio file
5. **S3 upload**: Uploads the dubbed file to your S3 bucket
6. **Mux track creation**: Creates a new audio track on your asset

### Best Practices

- **Enable audio-only renditions**: Required for the dubbing workflow
- **Sequential processing**: Process one language at a time to avoid rate limits
- **Error handling**: Dubbing can fail or take time; implement retries and timeouts
- **Cost management**: Dubbing is more expensive than caption translation
- **Quality review**: AI dubbing quality varies - voices may not match the original tone, lip sync can be off, and nuances may be lost
- **Set user expectations**: Add labels like "Auto-dubbed" in your UI

---

## Common Prerequisites

Most workflows require:

- A Mux account with API credentials (token ID and token secret)
- Videos with captions enabled (human-generated or auto-generated)
- Node.js installed

For captions, human-generated captions provide the best results, but auto-generated captions work great too.

## Webhook Events Reference

| Webhook Event | Use With |
|---------------|----------|
| `video.asset.ready` | Content moderation |
| `video.asset.track.ready` (text track) | Chapters, summaries, embeddings, subtitle translation |
| `video.asset.static_rendition.ready` | Audio dubbing |

## Best Practices Summary

1. **Enable captions**: Required for most AI workflows
2. **Choose appropriate providers**: Match provider to your quality and cost needs
3. **Cache results**: Store generated content to avoid regeneration
4. **Handle errors gracefully**: AI services can fail or have rate limits
5. **Validate output**: Review auto-generated content for high-visibility use cases
6. **Use webhooks**: Automate workflows based on video lifecycle events
