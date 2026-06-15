# Mux Data Exports

Complete reference for exporting Mux Data including daily CSV exports via the Exports API, streaming exports to Amazon Kinesis Data Streams and Google Cloud Pub/Sub, and monitoring data exports.

## Overview

View data can be exported from Mux Data for aggregation and reporting in your data infrastructure. Mux provides multiple export methods:

- **Daily CSV Exports**: Bulk exports via the Exports API (available for 7 days after generation)
- **Streaming Exports**: Real-time export to Amazon Kinesis Data Streams or Google Cloud Pub/Sub
- **Monitoring Samples Stream**: Near-real-time quality of service data stream

## Daily CSV Exports (Exports API)

Full data exports are available via the Exports API. This API is available for Mux Data customers on Media plans.

### How It Works

- Returns a list of CSV files available for download
- Files are available for **7 days** after generation
- Each CSV file contains a single day of data
- Includes every dimension collected by Mux for each video view

### Best Practice

**Build your file import to use field names rather than ordinal order.** This ensures additional fields can be added without causing errors.

### Export Versions

The Versions column in the data fields table indicates what fields are included in each version. Newer export versions include the latest columns available. From version 2 onward, fields are sorted in alphabetical order. Contact Mux support to change the export version that is generated.

Sample CSV export files are available:
- Version 2
- Version 3
- Version 4

## Streaming Exports

Streaming Exports are available on **Mux Data Media** plans.

Mux Data supports streaming exports of video views to:
- Amazon Kinesis Data Stream
- Google Cloud Pub/Sub topic

### Key Characteristics

- Views are sent as they complete
- Data is available within about **one minute** after the view ends
- Each message is a single view with all metadata, metrics, and event timeline
- Most useful for rolling metrics updates or user-facing application features

### Message Format

Messages are available in either:
- **JSON format**
- **Protobuf (proto2) encoding**

Choose the format when setting up the streaming export in the Mux Dashboard.

For Protobuf encoding, every message uses the `VideoView` message type defined in the export Protobuf spec, available in the [mux-protobuf repository](https://github.com/muxinc/mux-protobuf/tree/main/video_view).

### View Handling

A view can be updated after it has been exported. When this happens, a record of the latest version is emitted to the stream. When processing views:

- Handle multiple or duplicate records for each view ID
- Use `view_id` as a unique primary key for each view record

## Setting Up Amazon Kinesis Data Streams

### Step 1: Add a New Streaming Export

1. Go to **Settings > Streaming Exports** in your Mux dashboard
2. Click **New streaming export**
3. Select:
   - Type of data to export
   - Environment to send data from
   - Export format
   - **Amazon Kinesis Data Streams** as the service

### Step 2: Set Up AWS

1. **Create an Amazon Kinesis data stream** in your AWS account

2. **Create an IAM role** for Mux's AWS account:
   - Choose "AWS account" for Trusted entity type
   - Select "Another AWS account"
   - Enter Mux's AWS account ID (shown in configuration modal)
   - Check "Require external ID"
   - Paste the External ID from the Mux configuration modal

3. **Grant write access** to your data stream with an IAM policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
          "kinesis:ListShards",
          "kinesis:PutRecord",
          "kinesis:PutRecords"
      ],
      "Resource": [
        "arn:aws:kinesis:{region}:{account-id}:stream/{stream-name}"
      ]
    }
  ]
}
```

### Step 3: Finish Setup in Mux

Provide in the configuration modal:
- **Data stream ARN**: `arn:aws:kinesis:{region}:{account-id}:stream/{data-stream-name}`
- **IAM role ARN**: `arn:aws:iam::{account-id}:role/{role-name}`

Click **Enable export** to activate immediately.

## Setting Up Google Cloud Pub/Sub

### Step 1: Add a New Streaming Export

1. Go to **Settings > Streaming Exports** in your Mux dashboard
2. Click **New streaming export**
3. Select:
   - Type of data to export
   - Environment to send data from
   - Export format
   - **Google Cloud Pub/Sub** as the service

### Step 2: Set Up Google Cloud

1. *(Optional)* Create a schema using the Protobuf spec from the [mux-protobuf repository](https://github.com/muxinc/mux-protobuf)

2. **Create a Pub/Sub topic**:
   - If using a schema, set message encoding to **Binary**

3. **Add the Mux service account** (shown in configuration modal) as a Principal with the **Pub/Sub Publisher** role

### Step 3: Finish Setup in Mux

Provide the full Pub/Sub topic name: `projects/{project-id}/topics/{topic-id}`

Click **Enable export** to activate immediately.

## Monitoring Data Exports

The Monitoring Samples Stream is only available on **Mux Custom Media** plans.

### Purpose

Subscribe to a near-real-time, video view-level data stream for:
- Identifying service-level problems (widespread rebuffering, playback failures)
- Integrating with multi-CDN switching platforms
- Custom alerting
- Building internal NOC tools
- Constructing your own version of the Mux Data Monitoring dashboard

### Data Structure

A single Monitoring Samples payload may contain multiple samples:
- Each sample corresponds to a single active video view (different `view_id`)
- A sample can contain multiple records
- Each record contains metrics for a point in time
- Records specify a time period via `start` timestamp plus `duration_ms`
- If `duration_ms` is zero, the record contains instantaneous metrics
- Each record MUST contain at least one metric

### Monitoring Metrics

| Metric | Description |
|--------|-------------|
| `START_LATENCY_MS` | Time To First Frame (TTFF). Measures time viewer waits for video to play after page loads and player is ready. |
| `EXIT_BEFORE_VIDEO_START` | Instantaneous event when playback drop is detected. Sent when intent to play is detected but playback never begins. Has up to 1 minute delay. NOT sent when halted due to PLAYBACK_ERROR. |
| `WATCH_DURATION_MS` | Time viewers spend attempting to watch. Includes loading, rebuffering, seeking. Excludes time paused. |
| `SEEK_LATENCY_MS` | Average time viewers wait for video to resume after seeking. |
| `REBUFFER_DURATION_MS` | Time viewers spend rebuffering during the record window. |
| `REBUFFER_COUNT` | Number of independent rebuffer events in the record time window. |
| `PLAYBACK_ERROR` | Instantaneous event when playback fails due to fatal technical error. Value is playhead timestamp when error occurred. Non-fatal and business errors not included. |

### Setting Up Monitoring Samples Stream

Monitoring Samples streams are enabled by working with the Mux team (not configured in the dashboard).

Setup process:
1. Mux generates AWS account details with the customer
2. Customer creates destination and security artifacts in AWS
3. Customer sends AWS ARNs to Mux
4. Mux enables real-time sample exports to customer Kinesis stream

Data is sent every **30 second interval**.

### Message Format

Messages use either JSON or Protobuf (proto2) encoding. For Protobuf, use the `com.mux.realtime.Samples` message type from the [mux-protobuf repository](https://github.com/muxinc/mux-protobuf/tree/main/monitoring_samples).

## Export Data Fields Reference

### Core Dimensions and Metrics

| Field | Unit | Type | Definition | Versions |
|-------|------|------|------------|----------|
| `asn` | Integer | Dim. | Autonomous System Number uniquely identifying each network | v1+ |
| `asset_id` | Text | Dim. | If Mux Video is used, the Asset Id of the video | v4+ |
| `audio_codec` | Text | Dim. | The codec of the audio that played during the view | v13+ |
| `browser` | Text | Dim. | Browser used for the video view (Safari, Chrome, etc.) | v2+ |
| `browser_version` | Version | Dim. | Browser version (e.g. 66.0.3359.158) | v2+ |
| `cdn` | Text | Dim. | CDN delivering the video view | v1+ |
| `city` | Text | Dim. | City of the viewer | v1+ |
| `client_application_name` | Text | Dim. | Name of customer application viewer is using | v13+ |
| `client_application_version` | Text | Dim. | Version of customer application | v13+ |
| `continent_code` | ISO Code | Dim. | 2-letter ISO code for continent (e.g. NA, EU) | v1+ |
| `country` | ISO Code | Dim. | 2-letter Country Code | v2+ |
| `country_name` | Text | Dim. | Country of the viewer | v1+ |
| `custom_1` through `custom_5` | Text | Dim. | Customer-defined metadata | v2+ |
| `custom_6` through `custom_10` | Text | Dim. | Customer-defined metadata | v5+ |
| `environment_id` | Unique ID | Dim. | Mux Environment ID | v4+ |
| `error_type` | Unique ID | Dim. | Mux-internal ID for error categorization | v2+ |
| `exit_before_video_start` | Boolean | Metric | Viewer abandons video due to slow loading | v1+ |
| `experiment_name` | Text | Dim. | A/B Testing field to separate views | v1+ |
| `latitude` | Degrees | Dim. | Viewer latitude (truncated to 1 decimal) | v1+ |
| `longitude` | Degrees | Dim. | Viewer longitude (truncated to 1 decimal) | v1+ |
| `live_stream_id` | Text | Dim. | If Mux Video, the Live Stream Id | v4+ |
| `live_stream_latency` | Integer | Metric | Average time from ingest to display | v4+ |

### Player Dimensions

| Field | Unit | Type | Definition | Versions |
|-------|------|------|------------|----------|
| `player_autoplay` | Boolean | Dim. | Whether player autoplayed | v1+ |
| `player_captions_enabled` | Boolean | Dim. | If captions were used during view | v13+ |
| `player_error_code` | String | Dim. | Fatal error code | v1+ |
| `player_error_context` | Text | Dim. | Error instance-specific information | v5+ |
| `player_error_message` | Text | Dim. | Error message from player | v1+ |
| `player_height` | Integer | Dim. | Player height in pixels | v1+ |
| `player_width` | Integer | Dim. | Player width in pixels | v1+ |
| `player_instance_id` | Unique ID | Dim. | Instance ID of Player class | v1+ |
| `player_language` | Text | Dim. | Player's text language | v1+ |
| `player_load_time` | Milliseconds | Metric | Deprecated - see player_startup_time | v1+ |
| `player_mux_plugin_name` | Text | Dim. | Mux Integration Plugin name | v1+ |
| `player_mux_plugin_version` | Version | Dim. | Mux Integration Plugin version | v2+ |
| `player_name` | Text | Dim. | Identifies player configurations | v1+ |
| `player_pip_enabled` | Boolean | Dim. | If Picture in Picture was used | v13+ |
| `player_poster` | URL | Dim. | Pre-visualization image before play | v1+ |
| `player_preload` | Boolean | Dim. | If player preloads video on page load | v1+ |
| `player_remote_played` | Boolean | Dim. | If remote played to AirPlay/Chromecast | v2+ |
| `player_software` | Text | Dim. | Player software (Video.js, JW Player, etc.) | v1+ |
| `player_software_version` | Text | Dim. | Player software version | v1+ |
| `player_source_domain` | Text | Dim. | Video source domain | v1+ |
| `player_source_duration` | Milliseconds | Dim. | Video source duration | v1+ |
| `player_source_height` | Integer | Dim. | Source video height in pixels | v1+ |
| `player_source_url` | URL | Dim. | Video source URL | v1+ |
| `player_source_width` | Integer | Dim. | Source video width in pixels | v1+ |
| `player_startup_time` | Milliseconds | Metric | Time from player init to ready | v1+ |
| `player_version` | Text | Dim. | Player version for comparison | v1+ |
| `player_view_count` | Integer | Dim. | View count (1 in exports) | v1+ |

### Video Dimensions

| Field | Unit | Type | Definition | Versions |
|-------|------|------|------------|----------|
| `video_affiliate` | Text | Dim. | Affiliate station associated with viewer | v13+ |
| `video_brand` | Text | Dim. | Brand associated with video | v13+ |
| `video_cdn_trace` | Array | Dim. | Sequential CDN values during view | v14+ |
| `video_codec` | Text | Dim. | Video codec that played | v13+ |
| `video_content_type` | Text | Dim. | Content type (short, movie, episode, etc.) | v1+ |
| `video_creator_id` | Text | Dim. | Unique identifier for video creator | v13+ |
| `video_duration` | Milliseconds | Dim. | Video length from custom metadata | v1+ |
| `video_dynamic_range_type` | Text | Dim. | Dynamic range format | v13+ |
| `video_encoding_variant` | Text | Dim. | Compare different encoding settings | v1+ |
| `video_id` | Unique ID | Dim. | Internal video ID | v1+ |
| `video_language` | Text | Dim. | Audio language of video | v1+ |
| `video_producer` | Text | Dim. | Video producer | v1+ |
| `video_series` | Text | Dim. | Series name | v1+ |
| `video_title` | Text | Dim. | Video title | v1+ |
| `video_variant_id` | Unique ID | Dim. | Internal video variant ID | v1+ |
| `video_variant_name` | Text | Dim. | Monitor issues with specific content versions | v1+ |

### View Metrics

| Field | Unit | Type | Definition | Versions |
|-------|------|------|------------|----------|
| `view_id` | Unique ID | Dim. | Unique view identifier | v1+ |
| `view_start` | Time | Dim. | View start time (UTC) | v1+ |
| `view_end` | Time | Dim. | View end time (UTC) | v1+ |
| `view_playing_time` | Milliseconds | Metric | Time spent playing (excludes joining, rebuffering, seeking) | v3+ |
| `view_content_startup_time` | Milliseconds | Metric | Time from play instruction to first content frame | v10+ |
| `view_content_watch_time` | Milliseconds | Metric | Total content watch time | v10+ |
| `view_seek_count` | Integer | Dim. | Number of seek attempts | v1+ |
| `view_seek_duration` | Milliseconds | Dim. | Time waiting for playback after seeks | v1+ |
| `view_max_playhead_position` | Milliseconds | Dim. | Furthest playhead position | v3+ |
| `view_dropped` | Boolean | Dim. | If view finalized without explicit viewend | v11+ |
| `view_dropped_frame_count` | Integer | Metric | Frames dropped during playback | v5+ |
| `view_has_ad` | Boolean | Metric | If ad played or attempted | v6+ |
| `view_drm_type` | Text | Dim. | DRM type used (widevine, playready) | v5+ |
| `view_drm_level` | Text | Dim. | DRM security level | v13+ |
| `view_cdn_edge_pop` | Text | Dim. | CDN edge POP location | v13+ |
| `view_cdn_origin` | Text | Dim. | Content origin identification | v13+ |
| `view_time_shift_enabled` | Boolean | Dim. | If time shift was enabled | v13+ |

### Quality Metrics

| Field | Unit | Type | Definition | Versions |
|-------|------|------|------------|----------|
| `video_startup_time` | Milliseconds | Metric | Time from play instruction to first frame | v2+ |
| `video_startup_failure` | Boolean | Metric | Error before first frame | v7+ |
| `rebuffer_count` | Integer | Metric | Number of rebuffering events | v2+ |
| `rebuffer_duration` | Milliseconds | Metric | Time spent rebuffering | v2+ |
| `rebuffer_frequency` | Events/ms | Metric | How often rebuffering occurs | v2+ |
| `rebuffer_percentage` | Percentage | Metric | Volume of rebuffering | v1+ |
| `max_downscale_percentage` | Percentage | Metric | Maximum downscale at any point | v2+ |
| `max_upscale_percentage` | Percentage | Metric | Maximum upscale at any point | v2+ |
| `view_downscaling_percentage` | Percentage | Metric | Downscale percentage | v2+ |
| `view_upscaling_percentage` | Percentage | Metric | Upscale percentage | v2+ |
| `weighted_average_bitrate` | bits/sec | Metric | Weighted average bitrate | v2+ |
| `watch_time` | Milliseconds | Dim. | Total watch time | v1+ |

### Quality Scores

| Field | Unit | Type | Definition | Versions |
|-------|------|------|------------|----------|
| `viewer_experience_score` | Decimal | Score | Overall viewer experience | v2+ |
| `video_quality_score` | Decimal | Score | Video quality | v2+ |
| `playback_success_score` | Decimal | Score | Playback success | v2+ |
| `smoothness_score` | Decimal | Score | Smoothness | v2+ |
| `startup_time_score` | Decimal | Score | Startup time | v2+ |

### Viewer Dimensions

| Field | Unit | Type | Definition | Versions |
|-------|------|------|------------|----------|
| `mux_viewer_id` | Unique ID | Dim. | Mux internal viewer ID | v1+ |
| `viewer_user_id` | Unique ID | Dim. | Customer-defined viewer ID (anonymized) | v1+ |
| `viewer_device_category` | Text | Dim. | Device form factor | v1+ |
| `viewer_device_manufacturer` | Text | Dim. | Device brand (Apple, Microsoft, etc.) | v1+ |
| `viewer_device_model` | Text | Dim. | Device model (e.g. iPhone11,2) | v4+ |
| `viewer_device_name` | Text | Dim. | Device name (e.g. iPhone 12) | v1+ |
| `viewer_connection_type` | Text | Dim. | Connection type (cellular, wifi, wired, other) | v2+ |
| `viewer_user_agent` | Text | Dim. | User agent string | v1+ |
| `viewer_application_engine` | Text | Dim. | Browser engine (Gecko, WebKit, etc.) | v1+ |
| `viewer_plan` | Text | Dim. | Customer-specific plan name | v13+ |
| `viewer_plan_category` | Text | Dim. | Subscription plan category | v13+ |
| `viewer_plan_status` | Text | Dim. | Subscription status | v13+ |
| `operating_system` | Text | Dim. | Operating system | v2+ |
| `operating_system_version` | Version | Dim. | OS version | v2 |
| `session_id` | Unique ID | Dim. | Mux session ID | v1+ |
| `view_session_id` | Unique ID | Dim. | ID for correlating with CDN/origin logs | v2+ |

### Ad Metrics and Dimensions

| Field | Unit | Type | Definition | Versions |
|-------|------|------|------------|----------|
| `ad_attempt_count` | Integer | Metric | Ad play attempts | v8+ |
| `ad_break_count` | Integer | Metric | Ad break entries | v8+ |
| `ad_break_error_count` | Integer | Metric | Ad break errors | v8+ |
| `ad_break_error_percentage` | Percentage | Metric | Percentage with ad break errors | v8+ |
| `ad_error_count` | Integer | Metric | Total ad errors | v8+ |
| `ad_error_percentage` | Percentage | Metric | Percentage with ad errors | v8+ |
| `ad_impression_count` | Integer | Metric | Ad playback starts | v8+ |
| `ad_startup_error_count` | Integer | Metric | Ad startup errors | v8+ |
| `ad_startup_error_percentage` | Percentage | Metric | Percentage with startup errors | v8+ |
| `ad_exit_before_start_count` | Integer | Metric | Exits before ad started | v8+ |
| `ad_exit_before_start_percentage` | Percentage | Metric | Percentage with ad exit before start | v8+ |
| `ad_playback_failure_error_type_id` | Unique ID | Dim. | Ad playback failure ID | v10+ |
| `ad_preroll_startup_time` | Milliseconds | Metric | Time to first preroll ad frame | v10+ |
| `ad_watch_time` | Milliseconds | Metric | Total ad watch time | v10+ |
| `preroll_ad_asset_hostname` | Hostname | Dim. | Preroll ad asset hostname | v1+ |
| `preroll_ad_tag_hostname` | Hostname | Dim. | Preroll ad tag hostname | v1+ |
| `preroll_played` | Boolean | Dim. | Preroll ad successfully played | v1+ |
| `preroll_requested` | Boolean | Dim. | Preroll ad was requested | v1+ |
| `requests_for_first_preroll` | Integer | Metric | Ad requests before preroll playback | v1+ |
| `video_startup_preroll_load_time` | Milliseconds | Metric | Startup time loading preroll asset | v1+ |
| `video_startup_preroll_request_time` | Milliseconds | Metric | Startup time making preroll requests | v1+ |

### Request-level Metrics

| Field | Unit | Type | Definition | Versions |
|-------|------|------|------------|----------|
| `max_request_latency` | Milliseconds | Metric | Maximum TTFB for media request | v2+ |
| `request_latency` | Milliseconds | Metric | Average TTFB for media requests | v2+ |
| `request_throughput` | bits/sec | Metric | Average throughput for media requests | v2+ |

### Error Fields

| Field | Unit | Type | Definition | Versions |
|-------|------|------|------------|----------|
| `playback_business_exception_error_type_id` | Unique ID | Dim. | Playback business exception ID | v9+ |
| `playback_failure_error_type_id` | Unique ID | Dim. | Playback failure ID | v9+ |
| `video_startup_business_exception_error_type_id` | Unique ID | Dim. | Video startup business exception ID | v9+ |

## Streaming Export Versioning

### Backward Compatibility

The Streaming Export schema is backward compatible. Each version guarantees compatibility with future upgrades. No breaking changes will occur.

### When to Upgrade

When Mux adds new fields, the schema version is upgraded. Without action:
- Existing fields continue working normally
- New fields are not sent

To receive new fields, you must manually upgrade.

### How to Upgrade

#### Google Cloud Pub/Sub

**Schematized topics:**
1. Create a new topic with the upgraded schema
2. Point Mux Data Streaming Export to the new topic
3. Go to Mux Dashboard -> Settings -> Streaming Export -> Click Upgrade

**Schemaless topics (required for JSON):**
- No need to create new topics
- Go to Mux Dashboard -> Settings -> Streaming Export -> Click Upgrade

#### Amazon Kinesis

1. If using protobuf, get the latest definition from the [mux-protobuf repository](https://github.com/muxinc/mux-protobuf/tree/main/video_view)
2. Go to Mux Dashboard -> Settings -> Streaming Export -> Click Upgrade

### Monitoring Samples Versioning

The schema is backward compatible. When Mux adds new fields:
- **JSON**: New fields automatically included
- **Protobuf**: New fields available after upgrading to latest proto definition

## Unit Reference

| Unit | Description |
|------|-------------|
| Time | Timestamps in UTC |
| Milliseconds | Duration in milliseconds |
| Percentage | Percentage value |
| bits/sec | Bitrate in bits per second |
| Integer | Whole number |
| Boolean | True/false value |
| Text | String value |
| URL | URL string |
| Hostname | Domain hostname |
| Unique ID | Identifier string |
| ISO Code | ISO standard code |
| Version | Version string |
| Decimal | Decimal number |
| Degrees | Geographic coordinates |

## Plan Requirements

| Feature | Plan Required |
|---------|---------------|
| Daily CSV Exports (Exports API) | Mux Data Media |
| Streaming Exports | Mux Data Media |
| Monitoring Samples Stream | Mux Custom Media |
