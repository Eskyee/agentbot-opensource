# Privacy, Compliance, and Configuration

This reference covers privacy compliance (GDPR, CCPA, VPPA), data collection practices, custom domain configuration for beacon collection, and CDN detection setup for Mux Data.

## Privacy Compliance

### Regulatory Compliance

Mux Data is compliant with major privacy regulations:

| Regulation | Status | Description |
|------------|--------|-------------|
| GDPR | Compliant | General Data Protection Regulation (EU) |
| CCPA | Compliant | California Consumer Privacy Act |
| VPPA | Compliant | Video Privacy Protection Act |
| Data Privacy Framework (DPF) | Certified | EU-U.S. data transfer framework |

Mux provides a [Data Processing Addendum (DPA)](https://mux.com/dpa/) that details compliance measures. The DPF certification enables lawful transfers of personal data from the EU to the U.S.

### Data Erasure Requests

For GDPR or CCPA data erasure requests, contact gdpr@mux.com. Mux does not knowingly store personally identifiable information, but requests will be processed and you will receive confirmation.

### EU Data Processing

Mux Data offers an EU ingest location for processing video views:

- Full IP addresses are processed only at the Germany location
- Post-processed view data (with truncated IP addresses) is sent to the United States for aggregation and reporting
- Contact sales@mux.com to enable EU processing

## Data Collection Practices

### What Mux Data Collects

Mux Data collects non-personally identifiable information about the viewer experience:

| Data Type | Collection Details |
|-----------|-------------------|
| **IP Address** | Processed for coarse location lookup and bot detection. Pseudonymized by truncating to /24 for IPv4. Only the pseudonymized value is stored. |
| **Geographic Location** | Country and state-level information derived from IP. No fine-grained latitude/longitude or device geo-location access. |
| **ASN** | Autonomous Systems Number for network identification. |
| **Viewer ID** | Unique, random identifier generated if none provided. Not associated with advertising profiles. |
| **Device Information** | Model, device type, operating system, and browser. |
| **Video Content Details** | Stream type (live/VOD), video format, autoplay status, and optional metadata. |

### What Mux Data Does NOT Collect

- Email addresses
- Names
- Built-in device identifiers (e.g., IDFA on iOS)
- Fine-grained location data
- Advertising profile data

### Data Retention

Pseudonymized video view data is stored for up to 100 days and then deleted.

### HTTP Cookies

By default, Mux plugins for HTML5-based players use a first-party cookie to track playback across page views. The cookie is set on the customer's domain (e.g., if the player is on `http://example.com/demo.html`, the cookie is set on `example.com`).

**Cookie Contents:**

| Cookie Field | Purpose |
|--------------|---------|
| `mux_viewer_id` | Randomly generated viewer ID used as default anonymous Viewer ID |
| `msn` | Random value for sampling decisions |
| `sid` | Randomly generated anonymous session ID |
| `sst` | Session start time |
| `sex` | Session expiration time |

Cookies can be disabled if needed (e.g., for children's apps). Refer to your specific SDK documentation for disabling cookies.

### iOS App Tracking

Mux does not access the Identifier for Advertisers (IDFA), so Apple's AppTrackingTransparency (ATT) framework does not require a tracking permission request.

**SDK Updates:**
- Mux Data for AVPlayer SDK (v2.4.2+): Uses a random unique identifier instead of IDFV
- AVPlayer SDK (v3.6.1+) and Objective-C Core SDK (v4.7.1+, v5.0.1+): Include privacy manifest files for Apple's third-party SDK requirements

### Android Hardware ID

Mux Data for ExoPlayer SDK (v2.4.1+) generates a random unique identifier on the device for the default Viewer ID. No hardware IDs are accessed.

### Children's Applications

Mux Data is appropriate for applications targeted to children:

- No personally identifiable data is stored
- Viewer data is not used for advertising
- User identifiable data is not sold
- SDKs can receive app store approval for children's apps

**Important:** Disable cookies for apps targeted to children under 13.

## Custom Domain Configuration

Custom domains allow you to submit Mux Data beacons from a domain you control instead of the default Mux domain.

### Use Cases

- Bypass school or network firewall restrictions via a known domain
- Zero-rating analytics traffic
- Improve tracking when ad blockers are in place

### Availability

Custom Domains for Mux Data are available on select plans, such as **Mux Data Media**. Contact help@mux.com for access.

### Setup Steps

#### 1. Configure DNS Records

After selecting your custom domain, create CNAME records with your DNS provider. Mux will provide the specific `{KEY}` value after you contact your Customer Success Manager.

```
subdomain.yourdomain.com 300 IN CNAME ${KEY}.customdomains.litix.io
_acme-challenge.subdomain.yourdomain.com 300 IN CNAME ${KEY}.validations.customdomains.litix.io
```

Notify Mux after creating these records so TLS certificates can be issued.

#### 2. Verify Domain

Test the domain using curl:

```bash
curl https://subdomain.yourdomain.com -s -w "%{http_code}"
# Expected output: 200%
```

Note: DNS propagation may take time before this request succeeds.

#### 3. Configure SDK Integration

Set the `beaconCollectionDomain` property in your SDK configuration. Ensure you are using the latest SDK versions for Custom Domains to function correctly.

**JavaScript:**

```javascript
mux.monitor('#my-player', {
  debug: false,
  beaconCollectionDomain: 'CUSTOM_DOMAIN',
  data: {
    env_key: 'ENV_KEY', //required
    // ...
  }
});
```

**Swift:**

```swift
let playerBinding = MUXSDKStats.monitorAVPlayerViewController(
  self,
  withPlayerName: "mainPlayer",
  customerData: customerData,
  automaticErrorTracking: true,
  beaconCollectionDomain: "CUSTOM_DOMAIN"
)
```

**Objective-C:**

```objc
_playerBinding = [MUXSDKStats monitorAVPlayerViewController:_avplayerController
                                            withPlayerName:@"mainPlayer"
                                              customerData:customerData
                                    automaticErrorTracking:YES
                                    beaconCollectionDomain:@"CUSTOM_DOMAIN"];
```

**Kotlin (ExoPlayer):**

```kotlin
val customOptions = CustomOptions().apply {
  beaconCollectionDomain = "CUSTOM_DOMAIN"
}
muxStatsExoPlayer = exoPlayer.monitorWithMuxData(
  context = requireContext(),
  envKey = "YOUR_ENV_KEY_HERE",
  playerView = playerView,
  customerData = customerData,
  customOptions = customOptions
)
```

**BrightScript (Roku):**

```brightscript
m.mux = m.top.CreateNode("mux")
m.mux.setField("video", m.video)
muxConfig = {
  env_key: "ENV_KEY",
  beaconCollectionDomain: "CUSTOM_DOMAIN"
}
m.mux.setField("config", muxConfig)
m.mux.control = "RUN"
```

## Automatic CDN Detection

Mux can track network requests made by the player to expose metrics like throughput and latency, and auto-detect the CDN serving content by inspecting response headers.

### Supported Player SDKs

**Web:**
- HLS.js
- Dash.js
- Video.js
- Shaka player

**Android:**
- ExoPlayer
- AndroidX Media3

For platforms without automatic detection (e.g., iOS, Roku), pass the CDN value manually via SDK metadata.

### CDN Configuration

Configure each CDN to expose two headers:

| Header | Description |
|--------|-------------|
| `X-CDN` | Custom header added to all responses. Value should be a lowercase name with underscores replacing spaces (e.g., `fastly`, `cloudfront`, `level3`). |
| `Access-Control-Expose-Headers` | Comma-separated string of headers to expose to the client. Include at minimum `X-CDN`. Also recommended: `X-Cache`, `X-Served-By`, `Via`, and similar headers. |

### Mid-Stream CDN Switching

When CDN switching occurs mid-stream:

- All detected CDN values are placed in the `CDN Trace` dimension in sequential order
- A `cdn_change` event is created when the SDK detects a CDN update

## Environment Configuration

### Environment Keys

Each Mux Data environment has a client-side key for SDK integration:

- Find keys on the Environments page or in "Get Started with Data" from the Overview page
- Environment keys are not secret
- Keys associate collected views with the correct environment
- Contact Mux support to change an environment key

### Environment Best Practices

- Keep development and production data separate
- Multiple sites/apps can share the same environment and key
- Use the same environment for web and mobile players to compare metrics across platforms
- When using Mux Video, use the same environment for Mux Data to automatically populate video identifiers

## Additional Resources

- [Data Processing Addendum (DPA)](https://mux.com/dpa/)
- [Data Privacy Framework Certification](https://www.dataprivacyframework.gov/list)
- [Data Pricing](https://mux.com/data/#DataPricing)
- [Technical Specs](https://mux.com/data/#TechSpecs) - tracked metrics, filters, and supported players
