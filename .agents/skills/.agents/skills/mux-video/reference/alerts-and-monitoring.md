# Alerts and Monitoring

Reference for setting up alerts in Mux Data including anomaly alerts and threshold alerts. Covers alert rules, incident management, notification channels (Email, Slack, PagerDuty), and error categorization.

## Key Terms

- **Rule**: Criteria for when an alert should be triggered based on a metric, threshold, and filter criteria.
- **Incident**: A specific instance when the conditions of an alert Rule are met and an alert is triggered.
- **Start Time**: The timestamp of when a metric initially crosses over an alert rule threshold.
- **End Time**: The timestamp of when a metric crosses out of an alert rule threshold.
- **Trigger Interval**: The time period from when a metric initially crosses over an alert rule threshold to when an alert incident notification occurs.
- **Resolution Interval**: The time period from when a metric crosses out of an alert rule threshold to when an alert incident notification occurs.
- **Incident Duration**: The total length of time spent in an incident, from the start of the open interval to the start of the close interval.

## Alert Types

Mux Data supports two types of alerts: **Anomaly** and **Threshold**.

### Anomaly Alerts

Anomaly alerts are generated automatically when failures are elevated over a historical level. The historical level is determined by measuring the overall failure rate of videos in each organization over the recent past using a moving window.

**Two levels of playback failure detection:**

| Level | Description | Bucket Size |
|-------|-------------|-------------|
| Organization-wide | Failure rate calculated using all video views tracked within the organization | 1000 views |
| Per Video Title | Failure rates calculated using video views of every video title tracked within each environment separately | 100 views per video title |

**How it works:**

1. The anomaly detector groups ongoing views in buckets ordered by time
2. Compares the failure rate of each bucket to the historical organization-wide failure rate
3. If the failure rate is determined to be an extreme outlier, the failed views are flagged as anomalous
4. An incident is opened automatically

**Incident resolution:**
- Incidents are automatically closed when the error rate returns to normal levels
- An incident for a video title or organization that has not received views in the last 8 days will be marked as expired
- No manual threshold configuration is required; outlier determinations are set dynamically based on historical values

### Threshold Alerts

Threshold alerts allow you to define specific criteria for alerts that will trigger incident notifications.

**Note:** Threshold Alerts are available on Mux Data Media plans.

**Supported metrics:**
- Failures
- Rebuffering Percentage
- Video Start Time
- Concurrent Viewers

**Alert rule actions:**
- Edit
- Duplicate
- Delete

#### Filters

Filters are applied to alert definitions to track only specific data. Data can be included or excluded from the following dimensions:

- ASN
- CDN
- Country
- Mux Asset ID
- Mux Live Stream ID
- Mux Playback ID
- Operating System
- Player Name
- Region / State
- Stream Type
- Sub Property ID
- Video Series
- Video Title

#### Threshold Configuration Options

| Option | Description |
|--------|-------------|
| **Value ("trigger if")** | The threshold value the metric must cross for the alert condition to be met |
| **Above/Below ("rises above/falls below")** | For Concurrent Viewers metric, criteria can trigger when metric is above or below threshold. Other metrics trigger when above threshold |
| **Alert Interval ("for at least X minutes")** | Amount of time (1-60 minutes) the threshold criteria needs to be met to open or close an alert incident |
| **Minimum Audience** | Average number of concurrent viewers required to enter or exit an alert incident |

**Important behavior notes:**
- If concurrent viewers fall below the minimum audience during an incident, the incident continues
- Concurrent viewers must be over minimum audience for the incident to close
- If a rule definition is changed, any open incident based on that rule is automatically closed
- A new incident opens after the alert interval time if the updated rule criteria is met

## Incident Management

### Listing Incidents

When alert incidents are generated, they are listed in the "Incidents" tab.

**Filter options:**
- Alert type: Threshold or Anomaly
- Status: Open (default) or All (historical)

### Incident Details

Each incident contains the following information:

| Field | Description |
|-------|-------------|
| **Alert Name** | Name for the alert as defined in the rule definition |
| **Started** | Timestamp when the metric first crossed over the threshold |
| **Ended** | Timestamp when the metric first crossed out of the threshold |
| **Duration** | Length of time the alert was firing |
| **[Metric]** | Value of the metric when the alert incident is triggered |
| **At End** | Value of the metric when the alert incident is resolved |
| **Peak** | Peak value of the metric while the alert is firing |

**Note:** Some data (Closed time, Duration, etc.) is only shown once an alert is closed.

### Incident Charts

Charts and additional details are captured when incidents open and close.

**Incident Start chart includes:**
- Metric value when triggered
- Concurrent viewers count
- Up to 10 minutes before the incident starts and up to 5 minutes after

**Incident Close chart includes:**
- Metric value at resolution
- Concurrent viewers count
- Up to 10 minutes as the incident resolves and 5 minutes after

**Note:** If an incident is open when its rule definition is modified, the incident will be automatically closed. Configuration data (threshold value, filters) reflects the rule configuration as of when the incident was opened.

Incidents can be queried via the List Incidents API.

## Notification Channels

Mux Data sends notifications when alert incidents are opened and closed. Notifications are sent to channels that define the delivery method and address.

**Available channels:**
- Email
- Slack
- PagerDuty

### Setting Up Notification Channels

1. Navigate to the Alerts page in Mux Data Dashboard
2. Select the "Notification Channels" tab
3. Click "Add Channel"
4. Choose the notification channel type
5. Enter the destination address (email, Slack channel, or PagerDuty integration key)
6. Select alert types to receive:
   - **Anomaly**: Only automatically generated Mux Data alerts
   - **Threshold**: Only alerts configured in the environment
   - **All**: All alert notifications

### PagerDuty Integration

#### How the Integration Works

1. Video metrics that cause a new incident in Mux Data send a trigger event to PagerDuty
2. PagerDuty generates a new incident in the configured service or event rule set
3. When an alert incident is resolved in Mux Data, a resolve event is sent to PagerDuty
4. The associated PagerDuty incident is closed

#### Integration Methods

There are two ways to integrate with PagerDuty:

**Option 1: Global Event Routing**

Global Event Routing enables routing events to specific services based on the payload.

1. From the PagerDuty Configuration menu, select Event Rules
2. Click the arrow next to Incoming Event Source
3. Copy your Integration Key
4. Use this key when configuring the Mux Data integration

**Option 2: PagerDuty Service**

1. From PagerDuty Configuration menu, select Services
2. Either add integration to existing service or create new service
3. For existing service: Click service name, select Integrations tab, click New Integration
4. For new service: Follow PagerDuty documentation for creating a new service, selecting "Mux Data" as Integration Type
5. Enter Integration Name (format: `monitoring-tool-service-name`, e.g., "Mux Data-Production")
6. Select "Mux Data" from Integration Type menu
7. Click Add Integration
8. Save the generated Integration Key

#### Configuring PagerDuty in Mux Data

1. From navigation menu, choose Alerts then Notifications
2. Click Add Channel
3. For Service, choose PagerDuty
4. Enter the Integration Key from PagerDuty
5. Select alert types:
   - **Anomaly**: All automatically generated Anomaly alerts
   - **Threshold**: Notifications from explicitly configured alerts
   - **All**: All alert notifications
6. Click Add Channel

#### Removing PagerDuty Integration

1. Navigate to Alerts > Notification Channels tab
2. Find the PagerDuty channel to delete
3. Click the garbage can icon

**Note:** You can create multiple PagerDuty Notification Channels in Mux Data to send alerts to different services or event rules. Each channel can use a different Integration Key.

## Error Categorization

Error Categorization allows you to set custom error metadata to provide more actionable data. This feature helps distinguish between fatal errors and warnings, and classify errors as playback failures or business exceptions.

### Benefits

- **Reduced alert noise**: Errors categorized as warnings or business exceptions are excluded from alerting
- **Accurate health picture**: Only fatal operational failures affect Playback Failure metrics
- **Focused operational response**: Distinguish between critical issues and expected exceptions

### Error Types and Metrics

| Categorization | Included In | Excluded From |
|----------------|-------------|---------------|
| Fatal errors (default) | `Playback Failure Percentage`, `Video Startup Playback Failure Percentage` | - |
| Business exceptions | `Playback Business Exception Percentage`, `Video Startup Business Exception Percentage` | Failure metrics and alerting |
| Warnings | - | Failure metrics and alerting |

**Available dimensions:**
- `Playback Business Exception`
- `Video Startup Business Exception`
- `Playback Failure`
- `Video Startup Failure`

### Configuration Methods

Error categorization can be set from:
1. **Mux Dashboard** (takes precedence)
2. **Individual player SDKs**

Dashboard settings override SDK settings for the same error code.

### Configuring via Dashboard

1. Navigate to Settings page
2. Select "Categorize Errors" tab (admin user required)
3. Click "Add an error code"
4. Select from dropdown of encountered error codes (or type and press Enter for new codes)
5. Press "Add" to create categorization
6. Configure severity and type (default: fatal error severity, playback failure type)

### Configuring via SDKs

#### Web SDKs (HTML5 Video Element)

Requires version 5.2.0 or later.

```js
function errorTranslator (error) {
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
    env_key: 'ENV_KEY', // required
    // ... additional metadata
  }
});
```

#### Android (Java)

Requires Core Java-based SDK v8.0.0 or later.

```java
import com.mux.stats.sdk.core.events.EventBus;
import com.mux.stats.sdk.core.model.CustomerPlayerData;
import com.mux.stats.sdk.muxstats.IPlayerListener;
import com.mux.stats.sdk.events.playback.ErrorEvent;

public class PlayerListener extends EventBus implements IPlayerListener {
    MuxStats muxStats;

    // Dispatches an error event that Mux will categorize as a warning
    public void onPlaybackWarning(String errorCode, String errorMessage, String errorContext) {
        PlayerData playerData = new PlayerData();
        playerData.setErrorCode(errorCode);
        playerData.setErrorMessage(errorMessage);

        ErrorEvent errorEvent = new ErrorEvent(playerData, errorContext, ErrorSeverity.ErrorSeverityWarning);

        dispatch(errorEvent);
    }
}
```

#### iOS/tvOS/visionOS (Objective-C)

Requires Mux AVPlayer integration v4.0.0 or later, or Core Objective-C SDK v5.0.0 or later.

**AVPlayer Integration:**

```objc
- (void)dispatchPlaybackWarningWithPlayerName:(NSString *)playerName
                              playerErrorCode:(NSString *)playerErrorCode
                           playerErrorMessage:(NSString *)playerErrorMessage
                           playerErrorContext:(NSString *)playerErrorContext {
  [MUXSDKStats dispatchError: playerErrorCode,
                 withMessage: playerErrorMessage,
                    severity: MUXSDKErrorSeverityWarning,
                errorContext: playerErrorContext,
                   forPlayer: playerName];
}
```

**Custom Integrations:**

```objc
- (void)dispatchPlaybackWarningWithPlayerName:(NSString *)playerName
                              playerErrorCode:(NSString *)playerErrorCode
                           playerErrorMessage:(NSString *)playerErrorMessage
                           playerErrorContext:(NSString *)playerErrorContext
                           playerPlayheadTime:(NSNumber *)playerPlayheadTime {
  MUXSDKErrorEvent *errorEvent = [[MUXSDKErrorEvent alloc] initWithSeverity:MUXSDKErrorSeverityWarning
                                                                    context:playerErrorContext];

  MUXSDKPlayerData *playerData = [[MUXSDKPlayerData alloc] init];
  [playerData setPlayerErrorCode:playerErrorCode];
  [playerData setPlayerErrorMessagae:playerErrorMessage];
  [playerData setPlayerPlayheadTime: playerPlayheadTime];

  [MUXSDKCore dispatchEvent:errorEvent
                  forPlayer:playerName];
}
```

#### Roku

Requires SDK v2.0.0 or later.

```js
mux.setField("error", {
  player_error_code: errorCode,
  player_error_message: errorMessage,
  player_error_context: errorContext,
  player_error_severity: errorSeverity,
  player_error_business_exception: isBusinessException
})
```

**Possible values for `errorSeverity`:**
- `"warning"`
- `"fatal"`
