# Quickstart: Stream Videos in Five Minutes

Upload and play back your video files in your application using Mux in five minutes or less.

## Prerequisites

- Mux account with access to dashboard
- Access token with Mux Video Read and Write permissions

## Overview

This guide walks through the essential steps to stream your first video with Mux:

1. Get an API Access Token
2. POST a video to create an asset
3. Wait for the asset to be ready
4. Watch your video using the playback URL
5. Manage your Mux assets

## Step 1: Get an API Access Token

The Mux Video API uses a token key pair that consists of a **Token ID** and **Token Secret** for authentication.

### Create Your Access Token

1. Go to the [Access Token settings](https://dashboard.mux.com/settings/access-tokens) in your Mux account dashboard
2. Click to create a new Access Token
3. Configure your token:
   - **Environment**: Select an environment (e.g., Production). Environments are containers for your Access Tokens, Signing Keys, and assets.
   - **Permissions**: Enable Mux Video **Read** and **Write** permissions
   - **Name**: Give your token an internal name (e.g., "Onboarding") to identify where it's used
4. Click **Generate token**
5. Save your **Access Token ID** and **Secret Key** securely

Once you have your credentials, you're ready to upload your first video.

## Step 2: POST a Video

Videos stored in Mux are called **assets**. To create your first video asset, send a POST request to the `/assets` endpoint with the URL of a video file accessible online.

### Demo Videos for Testing

You can use these demo videos hosted on common cloud storage services:

| Service | URL |
|---------|-----|
| Amazon S3 | `https://muxed.s3.amazonaws.com/leds.mp4` |
| Google Drive | `https://drive.google.com/uc?id=13ODlJ-Dxrd7aJ7jy6lsz3bwyVW-ncb3v` |
| Dropbox | `https://www.dropbox.com/scl/fi/l2sm1zyk6pydtosk3ovwo/get-started.mp4?rlkey=qjb34b0b7wgjbs5xj9vn4yevt&dl=0` |

### Install the SDK (Optional)

Mux provides officially supported API SDKs that make authenticated HTTP requests to the Mux API.

**Node.js:**
```shell
# npm
npm install @mux/mux-node --save

# yarn
yarn add @mux/mux-node
```

**Ruby:**
```shell
gem 'mux_ruby'
```

**Python:**
```shell
# Via pip
pip install git+https://github.com/muxinc/mux-python.git

# Via source
git checkout https://github.com/muxinc/mux-python.git
cd mux-python
python setup.py install --user
```

**Go:**
```shell
go get github.com/muxinc/mux-go
```

**PHP (composer.json):**
```json
{
    "require": {
        "muxinc/mux-php": ">=0.0.1"
    }
}
```

**Elixir (mix.exs):**
```elixir
def deps do
  [
    {:mux, "~> 1.8.0"}
  ]
end
```

### Create an Asset

**cURL:**
```bash
curl https://api.mux.com/video/v1/assets \
  -H "Content-Type: application/json" \
  -X POST \
  -d '{ "inputs": [{ "url": "{INPUT_URL}" }], "playback_policies": ["public"], "video_quality": "basic" }' \
  -u ${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}
```

**Node.js:**
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

**Python:**
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

**Ruby:**
```ruby
MuxRuby.configure do |config|
  config.username = ENV['MUX_TOKEN_ID']
  config.password = ENV['MUX_TOKEN_SECRET']
end

assets_api = MuxRuby::AssetsApi.new
create_asset = MuxRuby::CreateAssetRequest.new

create_asset.inputs = [{:url => '{INPUT_URL}'}]
create_asset.playback_policies = ["public"]
create_asset.video_quality = "basic"
create_response = assets_api.create_asset(create_asset)
```

**Go:**
```go
import (
  muxgo "github.com/muxinc/mux-go"
)

client := muxgo.NewAPIClient(
  muxgo.NewConfiguration(
    muxgo.WithBasicAuth(os.Getenv("MUX_TOKEN_ID"), os.Getenv("MUX_TOKEN_SECRET")),
  ))

asset, err := client.AssetsApi.CreateAsset(muxgo.CreateAssetRequest{
  Inputs: []muxgo.InputSettings{
    muxgo.InputSettings{
      Url: "{INPUT_URL}",
    }
  },
  PlaybackPolicies: []muxgo.PlaybackPolicy{"PUBLIC"},
  VideoQuality: "basic",
})
```

**PHP:**
```php
$config = MuxPhp\Configuration::getDefaultConfiguration()
  ->setUsername(getenv('MUX_TOKEN_ID'))
  ->setPassword(getenv('MUX_TOKEN_SECRET'));

$assetsApi = new MuxPhp\Api\AssetsApi(
    new GuzzleHttp\Client(),
    $config
);

$playbackIdApi = new MuxPhp\Api\PlaybackIDApi(
  new GuzzleHttp\Client(),
  $config
);

$input = new MuxPhp\Models\InputSettings(["url" => "{INPUT_URL}"]);
$createAssetRequest = new MuxPhp\Models\CreateAssetRequest(["inputs" => [$input], "playback_policies" => [MuxPhp\Models\PlaybackPolicy::_PUBLIC], "video_quality" => "basic"]);
$createAssetResponse = $assetsApi->createAsset($createAssetRequest);
```

### Response

The response includes an **Asset ID** and a **Playback ID**:

```json
{
  "data": {
    "status": "preparing",
    "playback_ids": [
      {
        "policy": "public",
        "id": "TXjw00EgPBPS6acv7gBUEJ14PEr5XNWOe"
      }
    ],
    "video_quality": "basic",
    "mp4_support": "none",
    "master_access": "none",
    "id": "01itgOBvgjAbES7Inwvu4kEBtsQ44HFL6",
    "created_at": "1607876845"
  }
}
```

**Important IDs:**
- **Asset ID**: Used to manage assets via `api.mux.com` (e.g., read or delete an asset)
- **Playback ID**: Used to stream an asset to a video player through `stream.mux.com`. You can add multiple playback IDs to an asset to create playback URLs with different viewing permissions, and you can delete playback IDs to remove access without deleting the asset.

**Note:** Mux does not store the original file in its exact form. If your original quality files are important to you, don't delete them after submitting them to Mux.

## Step 3: Wait for Ready Status

As soon as you make the POST request, Mux begins downloading and processing the video. For shorter files, this often takes just a few seconds. Very large files over poor connections may take a few minutes or longer.

When the video is ready for playback, the asset `status` changes to `ready`. You should wait until the asset status is `ready` before you attempt to play the video.

### Option 1: Webhooks (Recommended)

The best way to be notified of asset status updates is via **webhooks**. Mux sends a webhook notification as soon as the asset is ready.

### Option 2: Polling (Low Volume Only)

If you can't use webhooks, you can manually poll the asset API to check the status. Note that this only works at low volume.

**cURL:**
```bash
curl https://api.mux.com/video/v1/assets/{ASSET_ID} \
  -H "Content-Type: application/json" \
  -u ${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}
```

**Node.js:**
```javascript
import Mux from '@mux/mux-node';
const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET
});

await mux.video.assets.retrieve("{ASSET_ID}")
```

**Python:**
```python
import mux_python

configuration = mux_python.Configuration()
configuration.username = os.environ['MUX_TOKEN_ID']
configuration.password = os.environ['MUX_TOKEN_SECRET']

assets_api = mux_python.AssetsApi(mux_python.ApiClient(configuration))
get_asset_response = assets_api.get_asset("{ASSET_ID}")
```

**Important:** Do not poll this API more than once per second.

## Step 4: Watch Your Video

To play back an asset, create a playback URL using the `PLAYBACK_ID` you received when you created the asset.

### Playback URL Format

```
https://stream.mux.com/{PLAYBACK_ID}.m3u8
```

### Integrate with a Video Player

**HTML (Mux Player):**
```html
<script src="https://cdn.jsdelivr.net/npm/@mux/mux-player" defer></script>

<mux-player
  playback-id="{PLAYBACK_ID}"
  metadata-video-title="Test video title"
  metadata-viewer-user-id="user-id-007"
></mux-player>
```

**React:**
```jsx
import MuxPlayer from '@mux/mux-player-react';

export default function VideoPlayer() {
  return (
    <MuxPlayer
      playbackId="{PLAYBACK_ID}"
      metadata={{
        video_id: "video-id-54321",
        video_title: "Test video title",
        viewer_user_id: "user-id-007",
      }}
    />
  );
}
```

**Embed (iframe):**
```html
<iframe
  src="https://player.mux.com/{PLAYBACK_ID}?metadata-video-title=Test%20video%20title&metadata-viewer-user-id=user-id-007"
  style="aspect-ratio: 16/9; width: 100%; border: 0;"
  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
  allowfullscreen="true"
></iframe>
```

**Swift (iOS):**
```swift
import SwiftUI
import AVKit

let playbackID = "qxb01i6T202018GFS02vp9RIe01icTcDCjVzQpmaB00CUisJ4"

struct ContentView: View {

    private let player = AVPlayer(
        url: URL.makePlaybackURL(
            playbackID: playbackID
        )
    )

    var body: some View {
        //  VideoPlayer comes from SwiftUI
        //  Alternatively, you can use AVPlayerLayer or AVPlayerViewController
        VideoPlayer(player: player)
            .onAppear() {
                player.play()
            }
    }
}

extension URL {
    static func makePlaybackURL(
        playbackID: String
    ) -> URL {
        guard let baseURL = URL(
            string: "https://stream.mux.com"
        ) else {
            preconditionFailure("Invalid base URL string")
        }

        guard let playbackURL = URL(
            string: "\(playbackID).m3u8",
            relativeTo: baseURL
        ) else {
            preconditionFailure("Invalid playback URL component")
        }

        return playbackURL
    }
}
```

**Android (ExoPlayer):**
```java
implementation 'com.google.android.exoplayer:exoplayer-hls:2.X.X'

// Create a player instance.
SimpleExoPlayer player = new SimpleExoPlayer.Builder(context).build();
// Set the media item to be played.
player.setMediaItem(MediaItem.fromUri("https://stream.mux.com/{PLAYBACK_ID}.m3u8"));
// Prepare the player.
player.prepare();
```

### Preview with stream.new

[Stream.new](https://stream.new/) is an open source project by Mux that allows you to add a video and get a shareable link to stream it.

Go to `stream.new/v/{PLAYBACK_ID}` to preview your video streaming. This URL is shareable and automatically generated using the video playback ID.

```
https://stream.new/v/{PLAYBACK_ID}
```

## Step 5: Manage Your Mux Assets

After you have assets created in your Mux environment, you can use these additional API endpoints:

| Operation | Endpoint |
|-----------|----------|
| Create an asset | `POST /video/v1/assets` |
| List assets | `GET /video/v1/assets` |
| Retrieve an asset | `GET /video/v1/assets/{ASSET_ID}` |
| Delete an asset | `DELETE /video/v1/assets/{ASSET_ID}` |
| Retrieve asset input info | `GET /video/v1/assets/{ASSET_ID}/input-info` |
| Create asset playback ID | `POST /video/v1/assets/{ASSET_ID}/playback-ids` |
| Retrieve asset playback ID | `GET /video/v1/assets/{ASSET_ID}/playback-ids/{PLAYBACK_ID}` |
| Delete asset playback ID | `DELETE /video/v1/assets/{ASSET_ID}/playback-ids/{PLAYBACK_ID}` |
| Update MP4 support on asset | `PUT /video/v1/assets/{ASSET_ID}/mp4-support` |
| Update master access on asset | `PUT /video/v1/assets/{ASSET_ID}/master-access` |
| Create asset track | `POST /video/v1/assets/{ASSET_ID}/tracks` |
| Delete asset track | `DELETE /video/v1/assets/{ASSET_ID}/tracks/{TRACK_ID}` |

## Using Postman for API Requests

You can also use [Postman](https://postman.com) to explore and interact with the Mux API.

### Fork the Mux Collection

1. Visit the [Mux APIs Postman workspace](https://www.postman.com/muxinc/workspace/mux-apis/overview)
2. Fork the collection to your own workspace
3. Without forking, the collection is read-only

### Set Up Authentication

| Term | Description |
|------|-------------|
| Token ID | Access token ID, the "username" in basic auth |
| Token secret | Access token secret key, the "password" in basic auth |

To configure authentication:

1. Input your credentials in the authorization fields
2. Optionally, use environment variables to store credentials:
   - Click the eye icon on the right side of the collection
   - Add your credentials and set the type to **secret** (hides values on-screen)
   - Reference variables using `{{variable_name}}` in form fields

### Sample Requests and Responses

The Postman collection includes sample request bodies and example responses for all Mux Video and Mux Data endpoints to help you understand the API.

### Keep Your Fork Updated

Similar to GitHub, pull changes periodically to keep your fork in sync with the main collection:

1. Click the three dots next to your fork name
2. Select **merge changes** from the menu
3. If there's a diff, review and click **pull changes**
