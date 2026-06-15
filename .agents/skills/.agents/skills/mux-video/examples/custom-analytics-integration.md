# Building a Custom Analytics Integration

This guide provides a practical example of building a comprehensive custom Mux Data integration. It covers setting up custom metadata, configuring custom dimensions, implementing error categorization, setting up streaming exports to a data warehouse, and understanding playback events for custom dashboards and KPI monitoring.

## Overview

A complete custom analytics integration typically involves:

1. Setting up custom dimensions to track business-specific metadata
2. Configuring metadata to make your data actionable
3. Implementing error categorization for focused operational response
4. Exporting raw video view data to your data warehouse
5. Understanding playback events for custom integrations

## Part 1: Setting Up Custom Metadata

### Understanding Custom Dimensions

Custom Dimensions allow you to define, submit, and report on metadata necessary to support your use case that are not in the pre-defined collection of metadata dimensions in Mux Data. Examples include device firmware version, subscription plan type, or internal content identifiers.

Each custom dimension has:
- A **display name** for reporting in the dashboard
- An **assigned category** for organization
- A **pre-defined field name** (`custom_1` through `custom_10`) used in code

### Configuring Custom Dimensions in the Dashboard

1. Navigate to the **Settings** page in the Mux Dashboard
2. Select the **Custom Dimensions** tab
3. Enable a dimension by clicking the toggle switch
4. Click the edit pencil to customize the display name and category
5. Custom Dimensions can be assigned to any existing dimension category

### Submitting Custom Metadata from SDKs

#### Web SDKs (HTML5 Video Element)

```js
mux.monitor('#test_video', {
  data: {
    // Required metadata
    env_key: 'YOUR_ENVIRONMENT_KEY_HERE',

    // Standard view metadata
    video_title: 'Big Buck Bunny',
    player_init_time: playerInitTime,

    // Custom dimension data
    custom_1: 'subscription-premium',      // e.g., Subscription Plan
    custom_2: 'firmware-v2.3.1',           // e.g., Device Firmware
    custom_3: 'content-category-sports',   // e.g., Content Category
    custom_4: 'experiment-group-A',        // e.g., A/B Test Group
    custom_5: 'partner-id-12345'           // e.g., Partner Identifier
  }
});
```

**Minimum SDK version required:** 4.1.0 or later

#### Android (ExoPlayer)

```java
// Set standard view data
CustomerPlayerData customerPlayerData = new CustomerPlayerData();
customerPlayerData.setEnvironmentKey("YOUR_ENVIRONMENT_KEY_HERE");
CustomerVideoData customerVideoData = new CustomerVideoData();
customerVideoData.setVideoTitle("Big Buck Bunny");

// Set custom dimension data
CustomData customData = new CustomData();
customData.setCustomData1("subscription-premium");
customData.setCustomData2("firmware-v2.3.1");
customData.setCustomData3("content-category-sports");
customData.setCustomData4("experiment-group-A");
customData.setCustomData5("partner-id-12345");

CustomerData customerData = new CustomerData(customerPlayerData, customerVideoData, null);
customerData.setCustomData(customData);

muxStats = new MuxStatsExoPlayer(this, player, "demo-player", customerData);
```

**Minimum SDK version required:** 2.5.0 or later

#### iOS (AVPlayer)

```swift
// Set custom dimension data
MUXSDKCustomData *customData = [[MUXSDKCustomData alloc] init];
[customData setCustomData1:@"subscription-premium"];
[customData setCustomData2:@"firmware-v2.3.1"];
[customData setCustomData3:@"content-category-sports"];
[customData setCustomData4:@"experiment-group-A"];
[customData setCustomData5:@"partner-id-12345"];

// Set standard view data
MUXSDKCustomerPlayerData *playerData = [[MUXSDKCustomerPlayerData alloc]
    initWithPropertyKey:@"YOUR_ENVIRONMENT_KEY_HERE"];
MUXSDKCustomerVideoData *videoData = [MUXSDKCustomerVideoData new];
videoData.videoTitle = @"Big Buck Bunny";
MUXSDKCustomerViewData *viewData = [[MUXSDKCustomerViewData alloc] init];

MUXSDKCustomerData *customerData = [[MUXSDKCustomerData alloc]
    initWithCustomerPlayerData:playerData
    videoData:videoData
    viewData:viewData
    customData:customData];

_playerBinding = [MUXSDKStats monitorAVPlayerViewController:_avplayerController
    withPlayerName:@"demo-player"
    customerData:customerData];
```

**Minimum SDK version required:** 2.5.0 or later

#### Roku

```brightscript
m.mux = m.top.CreateNode("mux")
m.mux.setField("video", m.video)

muxConfig = {
  property_key: "YOUR_ENVIRONMENT_KEY_HERE",
  ' Set custom dimension data
  custom_1: "subscription-premium",
  custom_2: "firmware-v2.3.1",
  custom_3: "content-category-sports"
}

m.mux.setField("config", muxConfig)
m.mux.control = "RUN"
```

**Minimum SDK version required:** 1.1.0 or later

## Part 2: Making Your Data Actionable with Metadata

### High Priority Metadata Fields

These are the most important fields to populate for basic Mux Data functionality:

| Dimension Name | Key Name | Description |
|---------------|----------|-------------|
| Environment | `env_key` | Your env key from the Mux dashboard (required) |
| Video ID | `video_id` | Your internal ID for the video |
| Video Title | `video_title` | Title of the video being played |
| Viewer ID | `viewer_user_id` | An anonymized ID representing the viewer |

**Important:** For `viewer_user_id`, never use personally identifiable information (email, username). Use an anonymized viewer ID from your system.

### Optional Configurable Metadata

| Dimension Name | SDK Key Name | Type | Description |
|---------------|--------------|------|-------------|
| CDN | `video_cdn` | Full | CDN delivering the video |
| Content Type | `video_content_type` | Full | Type: `short`, `movie`, `episode`, `clip`, `trailer`, `event` |
| Client Application Name | `view_client_application_name` | Full | Name of your app (e.g., 'OurBrand iOS App') |
| Client Application Version | `view_client_application_version` | Full | Version of your app |
| DRM Type | `view_drm_type` | Full | DRM SDK or service (`widevine`, `playready`) |
| Encoding Variant | `video_encoding_variant` | Full | Encoder or settings (`x264`, `hevc`, `av1`) |
| Experiment Name | `experiment_name` | Full | A/B test experiment identifier |
| Player Name | `player_name` | Full | Name for player configuration comparison |
| Sub Property ID | `sub_property_id` | Full | Group data within a property |
| Video Series | `video_series` | Full | Series name (e.g., `Season 1`) |
| Video Stream Type | `video_stream_type` | Full | `live` or `on-demand` |
| Viewer Plan | `viewer_plan` | Full | Viewer's subscription plan name |
| Viewer Plan Status | `viewer_plan_status` | Full | Subscription status (`subscriber`, `SVOD`, `AVOD`, `free`) |

### Dimension Scoping

Understanding how metadata persists:

- **Video details** (`video_*`): Reset automatically when changing the video
- **Player details** (`player_*`): Persist until monitoring is stopped/restarted
- **All other details**: Persist until explicitly changed

### Setting Metadata via HLS Session Data

You can set metadata using Session Data key/value pairs in the HLS manifest, useful when you cannot easily communicate values to the client.

```text
#EXTM3U
#EXT-X-VERSION:7
#EXT-X-INDEPENDENT-SEGMENTS

#EXT-X-SESSION-DATA:DATA-ID="io.litix.data.experiment_name",VALUE="abr_test:true"
#EXT-X-SESSION-DATA:DATA-ID="io.litix.data.view_session_id",VALUE="12345ABCD"
#EXT-X-SESSION-DATA:DATA-ID="io.litix.data.custom_1",VALUE="partner-abc"

#EXT-X-STREAM-INF:BANDWIDTH=2516370,AVERAGE-BANDWIDTH=2516370,CODECS="mp4a.40.2,avc1.640020",RESOLUTION=1280x720
...
```

Available dimension names for HLS Session Data:
- `video_*`
- `custom_*`
- `experiment_name`
- `view_session_id`
- `viewer_user_id`

## Part 3: Error Categorization

Error categorization allows you to distinguish between fatal errors or warnings and classify errors as playback failures or business exceptions.

### Why Error Categorization Matters

- **Playback Failure metrics** only include fatal operational failures
- **Business exceptions** and **warnings** are excluded from Playback Failure metrics
- Reduces alert noise by categorizing expected non-critical errors
- Business exceptions appear in dedicated metrics (`Playback Business Exception Percentage`)

### Configuring Error Categorization in Dashboard

1. Navigate to **Settings** > **Categorize Errors** tab
2. Click **Add an error code**
3. Select from previously seen error codes or type a new one
4. Set **Error Severity**: `fatal` or `warning`
5. Set **Error Type**: `playback failure` or `business exception`

### Implementing Error Categorization in SDKs

#### Web SDKs

```js
function errorTranslator(error) {
  return {
    player_error_code: translateCode(error.player_error_code),
    player_error_message: translateMessage(error.player_error_message),
    player_error_context: translateContext(error.player_error_context),
    player_error_severity: translateSeverity(error.player_error_severity),
    player_error_business_exception: translateBusinessException(error.player_error_business_exception)
  };
}

mux.monitor('#my-player', {
  debug: false,
  errorTranslator: errorTranslator,
  data: {
    env_key: 'ENV_KEY',
    // ... additional metadata
  }
});
```

**Minimum SDK version:** 5.2.0 or later

#### Android

```java
import com.mux.stats.sdk.core.events.EventBus;
import com.mux.stats.sdk.core.model.CustomerPlayerData;
import com.mux.stats.sdk.muxstats.IPlayerListener;
import com.mux.stats.sdk.events.playback.ErrorEvent;

public class PlayerListener extends EventBus implements IPlayerListener {
    MuxStats muxStats;

    // Dispatch a warning-level error event
    public void onPlaybackWarning(String errorCode, String errorMessage, String errorContext) {
        PlayerData playerData = new PlayerData();
        playerData.setErrorCode(errorCode);
        playerData.setErrorMessage(errorMessage);

        ErrorEvent errorEvent = new ErrorEvent(
            playerData,
            errorContext,
            ErrorSeverity.ErrorSeverityWarning
        );

        dispatch(errorEvent);
    }
}
```

**Minimum SDK version:** Core Java-based SDK v8.0.0 or later

#### iOS (AVPlayer Integration)

```objc
- (void)dispatchPlaybackWarningWithPlayerName:(NSString *)playerName
                              playerErrorCode:(NSString *)playerErrorCode
                           playerErrorMessage:(NSString *)playerErrorMessage
                           playerErrorContext:(NSString *)playerErrorContext {
  [MUXSDKStats dispatchError:playerErrorCode
                 withMessage:playerErrorMessage
                    severity:MUXSDKErrorSeverityWarning
                errorContext:playerErrorContext
                   forPlayer:playerName];
}
```

**Minimum SDK version:** AVPlayer integration v4.0.0 or later

#### iOS (Custom Integration)

```objc
- (void)dispatchPlaybackWarningWithPlayerName:(NSString *)playerName
                              playerErrorCode:(NSString *)playerErrorCode
                           playerErrorMessage:(NSString *)playerErrorMessage
                           playerErrorContext:(NSString *)playerErrorContext
                           playerPlayheadTime:(NSNumber *)playerPlayheadTime {
  MUXSDKErrorEvent *errorEvent = [[MUXSDKErrorEvent alloc]
      initWithSeverity:MUXSDKErrorSeverityWarning
               context:playerErrorContext];

  MUXSDKPlayerData *playerData = [[MUXSDKPlayerData alloc] init];
  [playerData setPlayerErrorCode:playerErrorCode];
  [playerData setPlayerErrorMessage:playerErrorMessage];
  [playerData setPlayerPlayheadTime:playerPlayheadTime];

  [MUXSDKCore dispatchEvent:errorEvent forPlayer:playerName];
}
```

**Minimum SDK version:** Core Objective-C SDK v5.0.0 or later

#### Roku

```brightscript
mux.setField("error", {
  player_error_code: errorCode,
  player_error_message: errorMessage,
  player_error_context: errorContext,
  player_error_severity: errorSeverity,      ' "warning" or "fatal"
  player_error_business_exception: isBusinessException
})
```

**Minimum SDK version:** v2.0.0 or later

## Part 4: Exporting Raw Video View Data

### Export Methods

Mux Data provides two methods for exporting view data:

1. **Daily CSV Exports** - Batch files generated daily via the Exports API
2. **Streaming Exports** - Real-time export to Amazon Kinesis or Google Cloud Pub/Sub

### Daily CSV Exports via API

Use the Exports API to get a list of CSV files available for download. Files are available for seven days after generation.

**Key considerations:**
- Each CSV file contains one day of data
- Includes every dimension collected by Mux for each video view
- Build imports using field names, not ordinal order (fields may be added in future versions)

### Streaming Exports

Streaming exports send video views to your cloud infrastructure as they complete, typically within one minute after the view ends.

**Supported platforms:**
- Amazon Kinesis Data Streams
- Google Cloud Pub/Sub

**Message formats:**
- JSON
- Protobuf (proto2 encoding)

#### Setting Up Streaming Exports

1. Navigate to **Settings** > **Streaming Exports** in the Mux Dashboard
2. Click **New streaming export**
3. Configure your Amazon Kinesis or Google Cloud Pub/Sub connection
4. Select message format (JSON or Protobuf)

#### Handling View Updates

Views can be updated after export. When processing views:
- Handle multiple records for the same `view_id`
- Use `view_id` as the unique primary key
- Later records represent the latest version of the view

### Key Export Data Fields

| Field | Unit | Type | Description |
|-------|------|------|-------------|
| `view_id` | Unique ID | Dim. | Unique View Identifier |
| `video_id` | Unique ID | Dim. | Your internal video ID |
| `video_title` | Text | Dim. | Video Title |
| `viewer_user_id` | Unique ID | Dim. | Customer-defined viewer ID |
| `custom_1` - `custom_10` | Text | Dim. | Customer-defined metadata |
| `video_startup_time` | Milliseconds | Metric | Time to first frame |
| `rebuffer_count` | Integer | Metric | Number of rebuffering events |
| `rebuffer_duration` | Milliseconds | Metric | Total rebuffer wait time |
| `rebuffer_percentage` | Percentage | Metric | Volume of rebuffering |
| `watch_time` | Milliseconds | Dim. | Total watch time |
| `view_playing_time` | Milliseconds | Metric | Time spent actually playing |
| `exit_before_video_start` | Boolean | Metric | Viewer abandoned before play |
| `video_startup_failure` | Boolean | Metric | Error before first frame |
| `viewer_experience_score` | Decimal | Score | Overall experience score |
| `playback_success_score` | Decimal | Dim. | Playback success score |
| `smoothness_score` | Decimal | Score | Smoothness score |
| `video_quality_score` | Decimal | Score | Video quality score |
| `player_error_code` | String | Dim. | Fatal error code |
| `player_error_message` | Text | Dim. | Error message |
| `operating_system` | Text | Dim. | Viewer's OS |
| `browser` | Text | Dim. | Viewer's browser |
| `viewer_device_category` | Text | Dim. | Device form factor |
| `country` | ISO Code | Dim. | 2-letter country code |
| `region` | Text | Dim. | Viewer's region |

### Streaming Export Versioning

**Backward compatibility:** Each schema version guarantees compatibility with future upgrades. New fields will not be sent without explicit upgrade action.

**Upgrading the schema:**

For **Google Pub/Sub with schema:**
1. Create a new topic with the upgraded schema
2. Point Mux Data Streaming Export to the new topic
3. Click **Upgrade** in Dashboard > Settings > Streaming Export

For **Google Pub/Sub schemaless (JSON):**
- Click **Upgrade** in Dashboard > Settings > Streaming Export

For **Amazon Kinesis:**
1. Get the latest protobuf definition from the mux-protobuf repository
2. Click **Upgrade** in Dashboard > Settings > Streaming Export

## Part 5: Understanding Playback Events

When building a custom integration or creating dashboards for specific KPIs, understanding the playback event timeline is essential.

### Event Time Fields

Each event contains these time values:

| Field | Description |
|-------|-------------|
| `viewer_time` | Wall clock time on device (ms since Unix epoch) |
| `playback_time` | Playhead position at event time (ms) |
| `event_time` | Server time when event received (ms since Unix epoch) |

### Core Playback Events

| Event | Description |
|-------|-------------|
| `playerready` | Player initialization complete, ready for interaction |
| `viewinit` | New view beginning (first view in player) |
| `videochange` | Video changed within same player |
| `play` | Player attempting to start playback |
| `playing` | First frame displayed, playback progressing |
| `pause` | Playback intentionally paused |
| `timeupdate` | Playback advanced (sent at least every 250ms) |
| `seeking` | User initiated seek |
| `seeked` | Player ready at new position |
| `rebufferstart` | Playback stalled unexpectedly |
| `rebufferend` | Playback resumed after stall |
| `error` | Error occurred during view |
| `ended` | Video played to completion |
| `viewend` | View tracking complete |

### Error Event Data

When dispatching errors, include:

| Field | Description |
|-------|-------------|
| `player_error_code` | Category code for the error (group similar errors) |
| `player_error_message` | Generic error details (not full stack trace) |
| `player_error_context` | Instance-specific details (stack trace, segment number) |

### Sample Event Sequence

A typical playback session:

```
playerready     - Player initialized
viewinit        - Video loaded
play            - User presses play
playing         - First frame displayed
timeupdate      - Progress updates (every 250ms)
pause           - User pauses
play            - User resumes
playing         - Playback continues
timeupdate      - Progress updates
ended           - Video complete
viewend         - View tracking ends
```

### Ad Events (Optional)

For ad-supported content:

| Event | Description |
|-------|-------------|
| `adbreakstart` | Ad break begins |
| `adplay` | Ad playback starting |
| `adplaying` | Ad first frame displayed |
| `adpause` | Ad paused |
| `adended` | Individual ad complete |
| `adbreakend` | All ads in break complete |
| `aderror` | Ad-related error |

### Network Request Events (Optional)

For bandwidth throughput tracking:

| Event | Description |
|-------|-------------|
| `requestcompleted` | Network request succeeded |
| `requestfailed` | Network request failed |
| `requestcanceled` | Network request aborted |

Request data fields:

| Field | Description |
|-------|-------------|
| `request_start` | Request initiation timestamp |
| `request_bytes_loaded` | Total bytes loaded |
| `request_response_start` | First byte received timestamp |
| `request_response_end` | Last byte received timestamp |
| `request_type` | Content type (`manifest`, `video`, `audio`, `media`) |
| `request_hostname` | Hostname of requested URL |

## Complete Integration Example

Here is a comprehensive example combining all components for a web-based integration:

```js
// Initialize timestamp for player startup time tracking
const playerInitTime = Date.now();

// Error translation function for categorization
function errorTranslator(error) {
  // Map known non-fatal errors to warnings
  const warningCodes = ['MEDIA_ERR_NETWORK_TEMPORARY', 'AD_TIMEOUT'];
  const businessExceptionCodes = ['GEO_BLOCKED', 'SUBSCRIPTION_REQUIRED'];

  const isWarning = warningCodes.includes(error.player_error_code);
  const isBusinessException = businessExceptionCodes.includes(error.player_error_code);

  return {
    player_error_code: error.player_error_code,
    player_error_message: error.player_error_message,
    player_error_context: error.player_error_context,
    player_error_severity: isWarning ? 'warning' : 'fatal',
    player_error_business_exception: isBusinessException
  };
}

// Initialize Mux monitoring with full metadata
mux.monitor('#video-player', {
  debug: false,
  errorTranslator: errorTranslator,
  data: {
    // Required
    env_key: 'YOUR_ENVIRONMENT_KEY',

    // High priority metadata
    video_id: 'video-12345',
    video_title: 'Introduction to Analytics',
    viewer_user_id: 'anon-user-abc123',

    // Player tracking
    player_name: 'Main Site Player',
    player_version: '2.1.0',
    player_init_time: playerInitTime,

    // Content metadata
    video_series: 'Analytics Tutorial Series',
    video_content_type: 'episode',
    video_stream_type: 'on-demand',
    video_duration: 1800000, // 30 minutes in ms

    // Viewer context
    viewer_plan: 'Professional',
    viewer_plan_status: 'subscriber',
    view_client_application_name: 'MyApp Web',
    view_client_application_version: '3.0.0',

    // A/B testing
    experiment_name: 'new-player-controls-v2',

    // Custom dimensions for business KPIs
    custom_1: 'premium-tier',           // Subscription Tier
    custom_2: 'partner-acme-corp',      // Content Partner
    custom_3: 'marketing-campaign-q4',  // Acquisition Source
    custom_4: 'ab-group-treatment',     // A/B Test Assignment
    custom_5: 'content-rating-pg',      // Content Rating
    custom_6: 'engagement-score-high',  // Predicted Engagement
    custom_7: 'device-smart-tv',        // Device Category Override
    custom_8: 'region-west',            // Business Region
    custom_9: 'first-view-false',       // First Time Viewer
    custom_10: 'recommendation-algo-v3' // Recommendation Source
  }
});
```

## Building Custom Dashboards and Monitoring KPIs

With your custom analytics integration in place, you can build dashboards around your specific KPIs using:

### In Mux Dashboard

- Use **Metrics Breakdown** with custom dimensions as filters
- Compare performance across custom dimension values
- Set up alerts on playback failure metrics (excluding business exceptions)

### In Your Data Warehouse

With streaming exports, build dashboards for:

- **Engagement by subscription tier** (using `custom_1`)
- **Partner content performance** (using `custom_2`)
- **Campaign attribution** (using `custom_3`)
- **A/B test results** (using `experiment_name` and `custom_4`)
- **Regional performance** (using `custom_8` or `country`/`region`)
- **Device-specific issues** (using `viewer_device_category`)
- **Error trends** (using `player_error_code` with severity context)

The combination of custom metadata, error categorization, and real-time exports enables comprehensive analytics tailored to your business needs.
