# Custom Metadata and Dimensions

Reference for extending Mux Data with custom metadata, including custom dimensions (custom_1 through custom_10), configurable metadata fields, and dimension categories.

## Overview

Mux Data provides many pre-defined metadata dimensions for tracking video view information such as Video Title, Video Series, or Encoding Variant. Custom Dimensions allow you to define, submit, and report on metadata specific to your use case that is not available in the pre-defined collection.

Examples of custom metadata include:
- Device firmware version
- Subscription plan type
- Internal experiment identifiers
- Secondary user identifiers

The number of custom dimensions you can track depends on your Mux Data plan. See the [pricing page](https://mux.com/pricing/data) for details.

## Custom Dimensions (custom_1 through custom_10)

Custom dimensions use pre-defined field names (`custom_1` through `custom_10`) when submitting values via SDK integration or accessing dimension values through the Mux Data API.

| Field Name | SDK Key Name | Unit | Type | Level |
|:-----------|:-------------|:-----|:----:|:-----:|
| custom_1 | `custom_1` | Text | Full | adv |
| custom_2 | `custom_2` | Text | Full | adv |
| custom_3 | `custom_3` | Text | Full | adv |
| custom_4 | `custom_4` | Text | Full | adv |
| custom_5 | `custom_5` | Text | Full | adv |
| custom_6 | `custom_6` | Text | Full | adv |
| custom_7 | `custom_7` | Text | Full | adv |
| custom_8 | `custom_8` | Text | Full | adv |
| custom_9 | `custom_9` | Text | Full | adv |
| custom_10 | `custom_10` | Text | Full | adv |

Each custom dimension can have:
- A **display name** configured in the Mux Dashboard
- An **assigned category** (defaults to "Custom" but can be added to any existing category)

## Configuring Custom Dimensions in the Dashboard

Custom Dimensions configuration is available from the Settings page under the "Custom Dimensions" tab.

### Enabling/Disabling Dimensions

- Click the switch next to a dimension name to enable it
- Click the switch off to disable it
- When disabled, custom dimension data continues to be collected from SDKs but is not available for reporting in the Mux Dashboard

### Editing Dimension Properties

Click the edit pencil to the right of a dimension row to:
- Set the display name to match your preferred definition
- Assign the most appropriate category

The name and category appear wherever dimensions are displayed:
- Metrics Breakdown page
- View detail page
- Filter modal
- Dimensions list on the Compare page

## Reporting on Custom Dimensions

Once configured to be visible, Custom Dimensions are available for:
- **Filtering** - Filter views by custom dimension values
- **Aggregation** - Group metrics by custom dimension
- **Comparison** - Compare metrics across different custom dimension values

Custom Dimension values are also available in export files using the pre-defined field name (e.g., `custom_1`).

## SDK Implementation Examples

Custom Dimension data is configured in Mux Data SDKs similarly to other view metadata. Use the pre-defined field name assigned to the dimension you configured.

### HTML5 Video Element and Web SDKs

In web-based SDKs, Custom Dimensions are set in the same `data` object as other view metadata fields.

```javascript
mux.monitor('#test_video', {
  data: {
    // Set other view data
    video_title: 'Big Buck Bunny',
    player_init_time: playerInitTime,
    env_key: 'YOUR_ENVIRONMENT_KEY_HERE',

    // Set custom dimension data
    custom_1: 'My Custom Dimension Value'    // Set the custom value here
  }
});
```

**Minimum version required:** HTML5 Video Element monitor version 4.1.0 or later

### ExoPlayer (Android)

In Android-based SDKs, Custom Dimensions are set in the `CustomData` object and attached to the `CustomerData` object used to initialize the Mux Data SDK.

```java
// Set other view data
CustomerPlayerData customerPlayerData = new CustomerPlayerData();
customerPlayerData.setEnvironmentKey("YOUR_ENVIRONMENT_KEY_HERE");
CustomerVideoData customerVideoData = new CustomerVideoData();
customerVideoData.setVideoTitle("Big Buck Bunny");

// Set custom dimension data
CustomData customData = new CustomData();
customData.setCustomData1("MY_CUSTOM_DIMENSION_VALUE");  // Set the custom value here
CustomerData customerData = new CustomerData(customerPlayerData, customerVideoData, null);
customerData.setCustomData(customData);

muxStats = new MuxStatsExoPlayer(this, player, "demo-player", customerData);
```

**Minimum version required:** ExoPlayer monitor version 2.5.0 or later

### AVPlayer (iOS)

In iOS-based SDKs, Custom Dimensions are set in the `MUXSDKCustomData` object and attached to the `MUXSDKCustomerData` object used to initialize the Mux Data SDK.

```swift
// Set custom dimension data
MUXSDKCustomData *customData = [[MUXSDKCustomData alloc] init];
[customData setCustomData1:@"my-custom-dimension-value"];  // Set the custom value here

// Set other view data
MUXSDKCustomerPlayerData *playerData = [[MUXSDKCustomerPlayerData alloc] initWithPropertyKey:@"YOUR_ENVIRONMENT_KEY_HERE"];
MUXSDKCustomerVideoData *videoData = [MUXSDKCustomerVideoData new];
videoData.videoTitle = @"Big Buck Bunny";
MUXSDKCustomerViewData *viewData= [[MUXSDKCustomerViewData alloc] init];

MUXSDKCustomerData *customerData = [[MUXSDKCustomerData alloc] initWithCustomerPlayerData:playerData videoData:videoData viewData:viewData customData: customData];
_playerBinding = [MUXSDKStats monitorAVPlayerViewController:_avplayerController withPlayerName:@"demo-player" customerData:customerData];
```

**Minimum version required:** AVPlayer monitor version 2.5.0 or later

### Roku

In the Roku SDK, Custom Dimensions are set in the same `muxConfig` object as other view metadata fields.

```brightscript
m.mux = m.top.CreateNode("mux")
m.mux.setField("video", m.video)

muxConfig = {
  property_key: "YOUR_ENVIRONMENT_KEY_HERE",
  ' Set the custom dimension data
  custom_1: "my-custom-dimension-value"
}

m.mux.setField("config", muxConfig)
m.mux.control = "RUN"

' Load the video into the Video node
```

**Minimum version required:** Roku monitor version 1.1.0 or later

## iOS/Android Naming Conventions

In iOS and Android SDKs, names are converted to lowerCamelCase setters and getters:
- Use `setCustomData1()` instead of `custom_1`
- Use `videoStreamType` instead of `video_stream_type`

**Objective-C SDKs:** Options are provided via `MUXSDKCustomerPlayerData`, `MUXSDKCustomerVideoData`, `MUXSDKCustomerViewData`, and `MUXSDKCustomData` objects.

**Java SDK:** Options are provided via `CustomerPlayerData`, `CustomerVideoData`, and `CustomData` objects.

## Dimension Categories

### Dimension Levels

Each dimension is either `basic` or `advanced`:
- All dimensions are available for the standard retention period of 100 days
- Long Term Metrics only support `basic` dimensions
- Custom dimensions are classified as `advanced` level

### Dimension Scoping

Dimensions are scoped to specific categories with different update behaviors:

| Scope | Prefix | Behavior |
|:------|:-------|:---------|
| Video details | `video_` | Reset automatically when changing the video |
| Player details | `player_` | Set when monitoring starts; do not reset on video change |
| Other details | (none) | Persist until explicitly changed |

### Dimension Types

| Type | Availability |
|:-----|:-------------|
| **Tracking** | Enables tracking of additional metrics but unavailable as dimensions |
| **Limited** | Appear as view attributes on individual view page and in API |
| **Full** | Available as filters and breakdowns in aggregate reports, view page, and API |

Custom dimensions are **Full** type dimensions.

## Setting Metadata via HLS Session Data

Metadata can also be set using Session Data key/value pairs in the HLS manifest. This method makes it easier to communicate values without having to side-channel information to the client or change client-side code.

### Format

```text
Tag: #EXT-X-SESSION-DATA
Key: DATA-ID="io.litix.data.[dimension_name]"
Value: VALUE="dimension value"
```

### Supported Dimensions via Session Data

- `video_*` (all video dimensions)
- `custom_*` (all custom dimensions)
- `experiment_name`
- `view_session_id`
- `viewer_user_id`

### Example Master Playlist

```text
#EXTM3U
#EXT-X-VERSION:7
#EXT-X-INDEPENDENT-SEGMENTS

#EXT-X-SESSION-DATA:DATA-ID="io.litix.data.experiment_name",VALUE="abr_test:true"
#EXT-X-SESSION-DATA:DATA-ID="io.litix.data.view_session_id",VALUE="12345ABCD"

#EXT-X-STREAM-INF:BANDWIDTH=2516370,AVERAGE-BANDWIDTH=2516370,CODECS="mp4a.40.2,avc1.640020",RESOLUTION=1280x720
...
```

This results in:
- `Experiment Name` dimension set to `abr_test:true`
- `View Session ID` dimension set to `12345ABCD`

**Note:** This feature is intended for developers using their own custom video delivery pipeline. Injecting your own HLS Session Data into Mux Video content is not currently supported.

## High Priority Configurable Metadata Reference

These are the most important fields to populate for basic Mux Data functionality:

| Dimension Name | Key Name | Unit | Type | Level | Description |
|:---------------|:---------|:-----|:----:|:-----:|:------------|
| Environment | `env_key` | Unique ID | Required | N/A | Your env key from the Mux dashboard |
| Video ID | `video_id` | Text | Full | basic | Your internal ID for the video |
| Video Title | `video_title` | Text | Full | basic | Title of the video being played |
| Viewer ID | `viewer_user_id` | Unique ID | Full | adv | An ID representing the viewer watching the stream |

**Important:** For `viewer_user_id`, do not use personally identifiable values (email, username, etc.). Instead, use an anonymized viewer ID from your own system.

## Optional Configurable Metadata Reference

| Dimension Name | SDK Key Name | Unit | Type | Level |
|:---------------|:-------------|:-----|:----:|:-----:|
| Audio Codec | `video_audio_codec` | Text | Full | adv |
| CDN | `video_cdn` | Text | Full | basic |
| CDN Edge PoP | `view_cdn_edge_pop` | Text | Full | adv |
| Content Type | `video_content_type` | Text | Full | basic |
| Client Application Name | `view_client_application_name` | Text | Full | adv |
| Client Application Version | `view_client_application_version` | Text | Full | adv |
| DRM Type | `view_drm_type` | Text | Full | adv |
| DRM Level | `view_drm_level` | Text | Full | adv |
| Duration | `video_duration` | Milliseconds | Limited | (none) |
| Encoding Variant | `video_encoding_variant` | Text | Full | adv |
| Experiment Name | `experiment_name` | Text | Full | adv |
| Origin | `view_cdn_origin` | Text | Full | adv |
| Page Type | `page_type` | Text | Full | adv |
| Player Initialization Time | `player_init_time` | Milliseconds since Epoch | Tracking | N/A |
| Player Name | `player_name` | Text | Full | basic |
| Player Version | `player_version` | Text | Full | adv |
| Sub Property ID | `sub_property_id` | Text | Full | basic |
| Time Shift Enabled | `view_time_shift_enabled` | Boolean | Full | adv |
| Used Captions | `player_captions_enabled` | Boolean | Full | adv |
| Used PiP | `player_pip_enabled` | Boolean | Full | adv |
| Video Affiliate | `video_affiliate` | Text | Full | adv |
| Video Brand | `video_brand` | Text | Full | adv |
| Video Codec | `video_codec` | Text | Full | adv |
| Video Dynamic Range Type | `video_dynamic_range_type` | Text | Full | adv |
| Video Language | `video_language_code` | Text | Full | adv |
| Video Producer | `video_producer` | Text | Full | adv |
| Video Series | `video_series` | Text | Full | basic |
| Video Stream Type | `video_stream_type` | Text | Full | basic |
| View Session ID | `view_session_id` | Unique ID | Full | adv |
| Video Variant Name | `video_variant_name` | Text | Full | adv |
| Video Variant ID | `video_variant_id` | Text | Full | adv |
| Viewer Plan | `viewer_plan` | Text | Full | adv |
| Viewer Plan Status | `viewer_plan_status` | Text | Full | adv |
| Viewer Plan Category | `viewer_plan_category` | Text | Full | adv |
