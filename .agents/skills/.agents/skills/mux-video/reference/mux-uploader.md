# Mux Uploader Components

Complete reference for Mux Uploader web components covering installation, usage in various frameworks (React, Vue, Svelte), core functionality, UI customization, styling with CSS and Tailwind, and working with subcomponents for custom upload experiences.

## Overview

Mux Uploader is a drop-in web component that makes it easy to upload video files to Mux from your web application. It provides a fully-functional, customizable video upload UI with a single line of code.

### Key Features

- Manual file selection
- Drag and drop for files
- Optional pausing and resuming of uploads
- Automatic offline/online detection with upload resumes
- Chunked uploads for large files (via UpChunk under the hood)
- Automatic retry on HTTP errors (5 retries by default)
- TypeScript support

### Available Packages

| Package | Description |
|---------|-------------|
| `@mux/mux-uploader` | Web component, compatible with all frontend frameworks |
| `@mux/mux-uploader-react` | React component wrapper |

## Installation

### NPM

```shell
npm install @mux/mux-uploader@latest
# or for React
npm install @mux/mux-uploader-react@latest
```

### Yarn

```shell
yarn add @mux/mux-uploader@latest
# or for React
yarn add @mux/mux-uploader-react@latest
```

### CDN (Hosted)

```html
<script src="https://cdn.jsdelivr.net/npm/@mux/mux-uploader"></script>
```

## Quick Start

### HTML Web Component

```html
<script src="https://cdn.jsdelivr.net/npm/@mux/mux-uploader"></script>
<mux-uploader endpoint="https://storage.googleapis.com/video..."></mux-uploader>
```

### React Component

```jsx
import MuxUploader from "@mux/mux-uploader-react";

export default function App() {
  return (
    <MuxUploader endpoint="https://storage.googleapis.com/video..." />
  );
}
```

## Framework Integration

### HTML/Vanilla JavaScript

```html
<script src="https://cdn.jsdelivr.net/npm/@mux/mux-uploader"></script>
<mux-uploader endpoint="https://my-authenticated-url/storage?your-url-params"></mux-uploader>

<script>
  const muxUploader = document.querySelector('mux-uploader');

  muxUploader.addEventListener('success', function () {
    // Handle upload success
  });

  muxUploader.addEventListener('uploaderror', function () {
    // Handle upload error
  });
</script>
```

### React

```jsx
import MuxUploader from "@mux/mux-uploader-react";

export default function App() {
  return (
    <MuxUploader
      endpoint="https://my-authenticated-url/storage?your-url-params"
      onSuccess={() => {
        // Handle upload success
      }}
      onUploadError={() => {
        // Handle upload error
      }}
    />
  );
}
```

### Vue

Vue supports web components natively, so no separate wrapper is needed:

```html
<script setup lang="ts">
  import "@mux/mux-uploader";
</script>

<template>
  <main>
    <mux-uploader endpoint="https://httpbin.org/put" />
  </main>
</template>
```

### Svelte

Svelte also supports web components natively:

```html
<script context="module" lang="ts">
  export const prerender = true;
</script>

<script lang="ts">
  import { onMount } from "svelte";
  onMount(async () => {
    await import("@mux/mux-uploader");
  });
</script>

<mux-uploader endpoint="https://httpbin.org/put" />
```

## Upload Configuration

### The endpoint Property

The `endpoint` property is the only required value. It accepts either:
- A direct upload URL from Mux's Direct Uploads API
- A function that returns a Promise resolving to the upload URL

#### Using a Direct URL

```html
<mux-uploader endpoint="https://storage.googleapis.com/video..."></mux-uploader>
```

#### Using an Async Function

When you need to fetch the upload URL dynamically:

```html
<mux-uploader></mux-uploader>

<script>
  const muxUploader = document.querySelector("mux-uploader");
  muxUploader.endpoint = function () {
    return fetch("/your-server/api/create-upload").then(res => res.text());
  };
</script>
```

React version:

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

### Upload Configuration Attributes

| Attribute / Property | Description |
|---------------------|-------------|
| `max-file-size` / `maxFileSize` | The largest size, in kB, allowed for upload |
| `chunk-size` / `chunkSize` | The size of each upload chunk, in kB. Useful for advanced optimization based on known network conditions or file details |
| `dynamic-chunk-size` / `dynamicChunkSize` | Boolean that tells Mux Uploader to automatically adapt chunk size based on network conditions |
| `use-large-file-workaround` / `useLargeFileWorkaround` | Boolean that enables a less memory efficient way of loading and chunking files for environments that don't reliably handle ReadableStream for large files (e.g., Safari with files >= 4GB). This fallback is only used if ReadableStream fails |

## Upload States

Mux Uploader provides a dynamic UI that changes based on the current upload state:

| State | Attribute | Description |
|-------|-----------|-------------|
| Initial | (none) | State before a media file has been selected for upload |
| In Progress | `upload-in-progress` | State while media chunks are being uploaded |
| Completed | `upload-complete` | State after the media has successfully finished uploading all chunks |
| Error | `upload-error` | State whenever an error occurs that results in a failure to fully upload the media |

### Pause States (when pausing is enabled)

1. **Pause** - Upload is not currently paused, but can be by pressing the button
2. **Pausing** - Upload will pause once the current chunk finishes uploading (button is disabled)
3. **Resume** - Upload is currently paused, but can be resumed by pressing the button

### Offline Detection

Mux Uploader automatically detects when the user goes offline and will display an offline indicator. When connectivity is restored, the upload can resume.

## Events

### Event Types

| Event | Description |
|-------|-------------|
| `progress` | Fired during upload with progress percentage in `e.detail` |
| `success` | Fired when upload completes successfully |
| `uploaderror` | Fired when an error occurs during upload |

### HTML Example

```html
<mux-uploader endpoint="https://my-authenticated-url/storage?your-url-params"></mux-uploader>

<script>
  const muxUploader = document.querySelector('mux-uploader');

  muxUploader.addEventListener('progress', function (e) {
    console.log(`My upload is ${e.detail}% complete!`)
  });

  muxUploader.addEventListener('success', function () {
    // Handle upload success
  });

  muxUploader.addEventListener('uploaderror', function () {
    // Handle upload error
  });
</script>
```

### React Example

```jsx
import MuxUploader from "@mux/mux-uploader-react";

export default function App() {
  return (
    <MuxUploader
      endpoint="https://my-authenticated-url/storage?your-url-params"
      onSuccess={() => {
        // Handle upload success
      }}
      onUploadError={() => {
        // Handle upload error
      }}
    />
  );
}
```

### Custom File-Ready Event

You can implement your own file selection and dispatch a custom `file-ready` event:

```html
<script>
  const muxUploader = document.querySelector("mux-uploader");

  // Dispatch custom event to trigger upload
  muxUploader.dispatchEvent(
    new CustomEvent("file-ready", {
      composed: true,
      bubbles: true,
      detail: file,
    })
  );
</script>
```

## UI Customization

### Enable/Disable UI Features

#### Enable Pausing

```html
<mux-uploader pausable endpoint="..."></mux-uploader>
```

```jsx
<MuxUploader pausable endpoint="..." />
```

#### Disable Retry

```html
<mux-uploader no-retry endpoint="..."></mux-uploader>
```

```jsx
<MuxUploader noRetry endpoint="..." />
```

#### Disable Drag and Drop

```html
<mux-uploader no-drop endpoint="..."></mux-uploader>
```

```jsx
<MuxUploader noDrop endpoint="..." />
```

#### Disable Progress UI

```html
<mux-uploader no-progress endpoint="..."></mux-uploader>
```

```jsx
<MuxUploader noProgress endpoint="..." />
```

#### Disable Status UI

```html
<mux-uploader no-status endpoint="..."></mux-uploader>
```

```jsx
<MuxUploader noStatus endpoint="..." />
```

### Custom File Select Button with Slots

Use the `slot="file-select"` attribute to provide your own file select element:

```html
<mux-uploader endpoint="...">
  <button slot="file-select" class="btn">Pick a video</button>
</mux-uploader>
```

React:

```jsx
<MuxUploader endpoint="...">
  <button slot="file-select" className="btn">Pick a video</button>
</MuxUploader>
```

## Styling with CSS

### Basic CSS Styling

```css
mux-uploader {
  display: inline-flex;
  width: 400px;
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 16px;
}
```

Note: Mux Uploader relies on flexbox for layout, so prefer `display: inline-flex` over `inline` or `inline-block`.

### CSS Variables

Mux Uploader exposes CSS variables for customizing internal styles:

| Variable | CSS Property | Default Value | Description |
|----------|-------------|---------------|-------------|
| `--overlay-background-color` | `background-color` | `rgba(226, 253, 255, 0.95)` | Background color of the drop overlay |
| `--progress-bar-fill-color` | `background` | `#000000` | Color for progress bar |
| `--progress-percentage-display` | `display` | `block` | Display value for text percentage progress UI |
| `--progress-radial-fill-color` | `stroke` | `black` | Stroke color for radial progress (experimental) |
| `--progress-bar-height` | `height` | `4px` | Height of the progress bar |

Example:

```css
mux-uploader {
  --overlay-background-color: rgba(0, 0, 255, 0.5);
  --progress-bar-fill-color: blue;
}
```

### State-Driven Styling with Attribute Selectors

Use CSS attribute selectors to style based on upload state:

```css
mux-uploader {
  border: 2px solid #ccc;
}

mux-uploader[upload-in-progress] {
  border-color: blue;
}

mux-uploader[upload-complete] {
  border-color: green;
}

mux-uploader[upload-error] {
  border-color: red;
}
```

### Using CSS Modules (React)

```jsx
import MuxUploader from "@mux/mux-uploader-react";
import styles from "./Uploader.module.css";

export default function App() {
  return (
    <MuxUploader className={styles.uploader} endpoint="..." />
  );
}
```

### Using Tailwind CSS (React)

```jsx
import MuxUploader from "@mux/mux-uploader-react";

export default function App() {
  return (
    <MuxUploader
      className="w-96 border border-gray-300 rounded-lg p-4 [--progress-bar-fill-color:theme(colors.blue.500)] [&[upload-complete]]:border-green-500"
      endpoint="..."
    />
  );
}
```

## Subcomponents

For more customized UIs, you can use Mux Uploader's subcomponents directly. Associate them with a `<mux-uploader>` using the `mux-uploader` attribute.

### Basic Pattern

```html
<!-- Hidden uploader with an id -->
<mux-uploader id="my-uploader" style="display: none;"></mux-uploader>

<!-- Subcomponent referencing the uploader -->
<mux-uploader-file-select mux-uploader="my-uploader">
  <button slot="file-select">Pick a video</button>
</mux-uploader-file-select>
```

React version:

```jsx
import MuxUploader, { MuxUploaderFileSelect } from "@mux/mux-uploader-react";

export default function App() {
  return (
    <>
      <MuxUploader id="my-uploader" style={{ display: "none" }} />
      <MuxUploaderFileSelect mux-uploader="my-uploader">
        <button slot="file-select">Pick a video</button>
      </MuxUploaderFileSelect>
    </>
  );
}
```

### File Select Subcomponent

Opens the file selection browser.

| Component | Web Component | React Component |
|-----------|---------------|-----------------|
| File Select | `<mux-uploader-file-select>` | `<MuxUploaderFileSelect>` |

Slot: `file-select` - Provide your own button or element.

### Drop Subcomponent

Implements drag and drop functionality.

| Component | Web Component | React Component |
|-----------|---------------|-----------------|
| Drop | `<mux-uploader-drop>` | `<MuxUploaderDrop>` |

**Slots:**
- `heading` - Default: "Drop a video file here to upload"
- `separator` - Default: "or" placed between heading and children
- (default) - Additional children appear below the slots

**Attributes/Properties:**
- `overlay` - Boolean to enable overlay UI when file is dragged over
- `overlay-text` / `overlayText` - Custom text for the overlay

**CSS Variable:**
- `--overlay-background-color` - Customize overlay background

### Progress Subcomponent

Visualizes upload progress.

| Component | Web Component | React Component |
|-----------|---------------|-----------------|
| Progress | `<mux-uploader-progress>` | `<MuxUploaderProgress>` |

**Type attribute values:**
- `percentage` (default) - Numeric percentage text
- `bar` - Progress bar
- `radial` (experimental) - Radial/circular progress indicator

**CSS Variables by type:**

`percentage`:
- `--progress-percentage-display` - Display property (default: `block`)

`bar`:
- `--progress-bar-height` - Height (default: `4px`)
- `--progress-bar-fill-color` - Fill color (default: `black`)

`radial`:
- `--progress-radial-fill-color` - Fill color (default: `black`)

### Status Subcomponent

Indicates upload completion, errors, or offline status.

| Component | Web Component | React Component |
|-----------|---------------|-----------------|
| Status | `<mux-uploader-status>` | `<MuxUploaderStatus>` |

### Retry Subcomponent

Button displayed on error to retry the upload.

| Component | Web Component | React Component |
|-----------|---------------|-----------------|
| Retry | `<mux-uploader-retry>` | `<MuxUploaderRetry>` |

### Pause Subcomponent

Button to pause/resume uploads while in progress.

| Component | Web Component | React Component |
|-----------|---------------|-----------------|
| Pause | `<mux-uploader-pause>` | `<MuxUploaderPause>` |

## Upload Workflow

### Complete Upload Flow

1. **Set up webhooks** - Configure your Mux dashboard to send events to your endpoint
2. **Create direct upload URL** - Call Mux's Create Direct Upload API from your server
3. **Save upload ID** - Store the upload ID in your database
4. **Pass URL to component** - Set the `endpoint` property on Mux Uploader
5. **Handle webhook events**:
   - `video.upload.asset_created` - Upload completed, asset created (contains `asset_id`)
   - `video.asset.ready` - Video processed and ready for playback (contains `playback_id`)
6. **Store IDs** - Save `asset_id` and `playback_id` to your database
7. **Use IDs**:
   - `asset_id` - Manage video via Mux API (delete, check status)
   - `playback_id` - Play video with Mux Player or create playback URLs

### Example Database Schema

| Column | Type | Description |
|--------|------|-------------|
| id | uuid (primary key) | |
| user_id | uuid (foreign key) | References users.id |
| upload_id | string | From initial upload |
| asset_id | string | From Mux webhook |
| playback_id | string | From Mux webhook |
| title | string | Optional metadata |
| status | enum | e.g., `preparing`, `ready` |
| created_at | timestamp | |
| updated_at | timestamp | |

## Error Handling

Mux Uploader monitors for unrecoverable errors and surfaces them via the UI with a retry option. Error handling includes:

- HTTP status errors (4xx, 5xx)
- File processing errors (e.g., exceeding max file size)
- Automatic retry (5 times) before surfacing HTTP errors
- `uploaderror` event for programmatic handling

## API Reference Summary

### Attributes/Properties

| Attribute | Property | React Prop | Description |
|-----------|----------|------------|-------------|
| `endpoint` | `endpoint` | `endpoint` | Direct upload URL or function returning a Promise |
| `pausable` | `pausable` | `pausable` | Enable pause/resume functionality |
| `no-drop` | `noDrop` | `noDrop` | Disable drag and drop |
| `no-retry` | `noRetry` | `noRetry` | Disable retry button on error |
| `no-progress` | `noProgress` | `noProgress` | Disable progress UI |
| `no-status` | `noStatus` | `noStatus` | Disable status UI |
| `max-file-size` | `maxFileSize` | `maxFileSize` | Maximum file size in kB |
| `chunk-size` | `chunkSize` | `chunkSize` | Upload chunk size in kB |
| `dynamic-chunk-size` | `dynamicChunkSize` | `dynamicChunkSize` | Enable adaptive chunk sizing |
| `use-large-file-workaround` | `useLargeFileWorkaround` | `useLargeFileWorkaround` | Enable workaround for large files |

### State Attributes (Read-only)

| Attribute | Description |
|-----------|-------------|
| `upload-in-progress` | Upload is currently in progress (including while paused) |
| `upload-complete` | Upload has completed successfully |
| `upload-error` | An error occurred during upload |

### Events

| Event | React Prop | Description |
|-------|------------|-------------|
| `progress` | `onProgress` | Progress update with percentage in `e.detail` |
| `success` | `onSuccess` | Upload completed successfully |
| `uploaderror` | `onUploadError` | Error occurred during upload |
| `file-ready` | - | Custom event to trigger upload with file in `detail` |
