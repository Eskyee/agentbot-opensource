# Mux Video Pricing Overview

Mux Video pricing is split into three categories: **input**, **storage**, and **delivery**. You are charged by how much video you upload each month, how much video you store, and how much video your users stream.

Mux charges by **minute of video** (inputted, stored, and delivered) rather than by bytes. This applies to exact seconds - there is no minimum or rounding to the nearest minute.

## Video Quality Levels

Mux supports three configurable video quality levels that affect pricing across all categories:

| Quality Level | Description | Use Case | Live Support |
|---------------|-------------|----------|--------------|
| **Basic** | Reduced encoding ladder with lower target quality. Free encoding. | Social/user-generated content, simpler streaming needs | On-demand only |
| **Plus** | AI-powered per-title encoding for consistent high quality | Professional or branded content | Up to 1080p |
| **Premium** | Optimized for premium media presentation with superior quality | Studio or cinematic projects | Up to 1080p |

The default video quality level for new accounts is **basic**. You can configure the default in dashboard Settings or override per-asset at creation time.

## Input Pricing

When video is uploaded to Mux, it is processed and encoded into a high-quality, standardized version.

### Basic Quality Input

Free for all resolutions and volumes (on-demand video only).

| Resolution | Price |
|------------|-------|
| Up to 720p | Free |
| 1080p | Free |
| 1440p (2K) | Free |
| 2160p (4K) | Free |
| Audio-only | Free |

### Plus Quality Input

Live video supported up to 1080p, on-demand video up to 4K. Price per minute:

| Monthly Volume | Up to 720p | 1080p | 1440p (2K) | 2160p (4K) | Audio-only |
|----------------|------------|-------|------------|------------|------------|
| First 5,000 min | $0.025000 | $0.031250 | $0.050000 | $0.100000 | $0.002500 |
| Next 10,000 min | $0.023750 | $0.029688 | $0.047500 | $0.095000 | $0.002375 |
| Next 10,000 min | $0.023125 | $0.028906 | $0.046250 | $0.092500 | $0.002313 |
| Over 25,000 min | $0.022500 | $0.028125 | $0.045000 | $0.090000 | $0.002250 |

### Premium Quality Input

Live video supported up to 1080p, on-demand video up to 4K. Price per minute:

| Monthly Volume | Up to 720p | 1080p | 1440p (2K) | 2160p (4K) | Audio-only |
|----------------|------------|-------|------------|------------|------------|
| First 5,000 min | $0.037500 | $0.046875 | $0.075000 | $0.150000 | $0.002500 |
| Next 10,000 min | $0.035625 | $0.044531 | $0.071250 | $0.142500 | $0.002375 |
| Next 10,000 min | $0.034688 | $0.043359 | $0.069375 | $0.138750 | $0.002313 |
| Over 25,000 min | $0.033750 | $0.042188 | $0.067500 | $0.135000 | $0.002250 |

## Storage Pricing

Mux creates and stores only one version of your video (unlike traditional providers that store multiple versions). Storage is calculated by minute of video stored, prorated by percentage of month stored.

Storage includes: primary audio, metadata, captions, transcoding/transmuxing, thumbnails, and API/dashboard access.

### Basic and Plus Quality Storage

- **Basic**: Minimum storage charge of one month, prorated thereafter. On-demand only, up to 4K.
- **Plus**: No minimum storage charge. Live up to 1080p, on-demand up to 4K.

Price per minute per month:

| Monthly Volume | Up to 720p | 1080p | 1440p (2K) | 2160p (4K) | Audio-only |
|----------------|------------|-------|------------|------------|------------|
| First 50,000 min | $0.002400 | $0.003000 | $0.004800 | $0.009600 | $0.000240 |
| Next 100,000 min | $0.002320 | $0.002900 | $0.004640 | $0.009280 | $0.000232 |
| Next 100,000 min | $0.002280 | $0.002850 | $0.004560 | $0.009120 | $0.000228 |
| Over 250,000 min | $0.002240 | $0.002800 | $0.004480 | $0.008960 | $0.000224 |

### Premium Quality Storage

Live video up to 1080p, on-demand up to 4K. Price per minute per month:

| Monthly Volume | Up to 720p | 1080p | 1440p (2K) | 2160p (4K) | Audio-only |
|----------------|------------|-------|------------|------------|------------|
| First 50,000 min | $0.003600 | $0.004500 | $0.007200 | $0.014400 | $0.000240 |
| Next 100,000 min | $0.003480 | $0.004350 | $0.006960 | $0.013920 | $0.000232 |
| Next 100,000 min | $0.003420 | $0.004275 | $0.006840 | $0.013680 | $0.000228 |
| Over 250,000 min | $0.003360 | $0.004200 | $0.006720 | $0.013440 | $0.000224 |

### Automatic Cold Storage

Mux automatically transitions infrequently accessed assets to cheaper storage tiers:

| Last Viewed | Storage Tier | Discount |
|-------------|--------------|----------|
| Less than 30 days | Frequent | Standard rate |
| 30+ days ago | Infrequent | 40% discount |
| 90+ days ago | Cold | 60% discount |

New assets instantly enter the Cold tier until first played.

**Basic/Plus Cold Storage Rates** (per minute per month):

| Storage Tier | Up to 720p | 1080p | 1440p (2K) | 2160p (4K) | Audio-only |
|--------------|------------|-------|------------|------------|------------|
| Infrequent | $0.001440 | $0.001800 | $0.002880 | $0.005760 | $0.000144 |
| Cold | $0.000960 | $0.001200 | $0.001920 | $0.003840 | $0.000096 |

**Premium Cold Storage Rates** (per minute per month):

| Storage Tier | Up to 720p | 1080p | 1440p (2K) | 2160p (4K) | Audio-only |
|--------------|------------|-------|------------|------------|------------|
| Infrequent | $0.002160 | $0.002700 | $0.004320 | $0.008640 | $0.000144 |
| Cold | $0.001440 | $0.001800 | $0.002880 | $0.005760 | $0.000096 |

## Delivery Pricing

Mux uses "just-in-time encoding" to deliver video in the optimal bitrate and resolution for each viewer. Delivery includes CDN partners, HTTP-based streaming (HLS), and Mux Data (Startup plan) for monitoring.

**The first 100,000 minutes delivered each month are free** (regardless of quality or resolution).

Cost is per minute of video delivered. Note: if video is buffered/preloaded but not watched, it is still charged.

### Basic and Plus Quality Delivery

Basic supports on-demand only up to 4K. Plus supports live up to 1080p, on-demand up to 4K.

| Monthly Volume | Up to 720p | 1080p | 1440p (2K) | 2160p (4K) | Audio-only |
|----------------|------------|-------|------------|------------|------------|
| First 500,000 min | $0.000800 | $0.001000 | $0.001600 | $0.003200 | $0.000080 |
| Next 500,000 min | $0.000760 | $0.000950 | $0.001520 | $0.003040 | $0.000076 |
| Next 1M min | $0.000720 | $0.000900 | $0.001440 | $0.002880 | $0.000072 |
| Next 4M min | $0.000670 | $0.000838 | $0.001340 | $0.002680 | $0.000067 |
| Next 4M min | $0.000610 | $0.000763 | $0.001220 | $0.002440 | $0.000061 |
| Over 10M min | $0.000560 | $0.000700 | $0.001120 | $0.002240 | $0.000056 |

### Premium Quality Delivery

Live video up to 1080p, on-demand up to 4K.

| Monthly Volume | Up to 720p | 1080p | 1440p (2K) | 2160p (4K) | Audio-only |
|----------------|------------|-------|------------|------------|------------|
| First 500,000 min | $0.001200 | $0.001500 | $0.002400 | $0.004800 | $0.000080 |
| Next 500,000 min | $0.001140 | $0.001425 | $0.002280 | $0.004560 | $0.000076 |
| Next 1M min | $0.001080 | $0.001350 | $0.002160 | $0.004320 | $0.000072 |
| Next 4M min | $0.001005 | $0.001256 | $0.002010 | $0.004020 | $0.000067 |
| Next 4M min | $0.000915 | $0.001144 | $0.001830 | $0.003660 | $0.000061 |
| Over 10M min | $0.000840 | $0.001050 | $0.001680 | $0.003360 | $0.000056 |

## Resolution-Based Pricing Tiers

Resolution tiers apply to encoding, storage, and delivery:

| Pricing Tier | Pixels | Typical Resolution |
|--------------|--------|-------------------|
| Up to 720p | Up to 921,600 | 1280x720 |
| 1080p | 921,601 to 2,073,600 | 1920x1080 |
| 1440p (2K) | 2,073,601 to 4,194,304 | 2560x1440 |
| 2160p (4K) | 4,194,305 to 8,294,400 | 3840x2160 |

2K and 4K resolutions are available for on-demand assets only.

## Add-On Features and Pricing

### Static Renditions (MP4s)

- **Standard static renditions**: Free to generate
- **Advanced static renditions**: Charged per minute of preparation
- **Storage**: Billed per rendition, per month, based on resolution
- **Delivery**: Each minute downloaded counts as a minute streamed

**Basic/Plus Advanced Static Rendition Preparation** (per minute):

| Monthly Volume | Up to 720p | 1080p | 1440p (2K) | 2160p (4K) |
|----------------|------------|-------|------------|------------|
| First 5,000 min | $0.008000 | $0.010000 | $0.016000 | $0.032000 |
| Over 25,000 min | $0.007200 | $0.009000 | $0.014400 | $0.028800 |

**Basic/Plus Static Rendition Storage** (per minute per month):

| Up to 720p | 1080p | 1440p (2K) | 2160p (4K) | Audio-only |
|------------|-------|------------|------------|------------|
| $0.000600 | $0.000750 | $0.001200 | $0.002400 | $0.000060 |

### Auto-Generated Live Captions

- First 6,000 minutes per month: Free
- Additional minutes: $0.024 per minute

### Live Simulcasting

- $0.020 per minute per simulcast target

### Digital Rights Management (DRM)

- $100/month access fee
- $0.003 per license
- Volume discounts available

### Multi-Track Audio

Primary audio track is included with video cost. Additional audio tracks are charged at audio-only rates.

### Audio-Only Assets

All audio-only assets and alternate audio tracks are calculated at 1/10th the cost of 720p basic video for encoding, storage, and delivery.

## Estimating Costs

### Converting Gigabytes to Minutes

| Resolution | Estimated Minutes per GB |
|------------|-------------------------|
| 720p (3.5Mbps) | 40 minutes |
| 1080p (5Mbps) | 25 minutes |
| 1440p (2K, 8Mbps) | 15 minutes |
| 2160p (4K, 12Mbps) | 10 minutes |

### Delivery Considerations

- **Views vs. minutes**: 1 person watching 10 minutes equals 10 people watching 1 minute each (both are 10 minutes delivered)
- **Minutes delivered, not watched**: If a player buffers 6 minutes but viewer watches 5, you are charged for 6 minutes
- **Looping videos**: Short videos may cache in the browser and not incur repeated charges; videos over 60 seconds likely will

### User-Generated Content Platforms

For UGC platforms with power-law distribution (small percentage of content gets most views):
- Use **basic video quality level** (free encoding)
- Leverage **Automatic Cold Storage** for rarely-viewed assets

### Estimating with Scenarios

For new products, create three estimates:
- **Low end**: Conservative user count and engagement
- **Middle**: Expected typical adoption
- **Moonshot**: Best-case scenario

## Volume Discounts

Volume discounts are applied per quality level and resolution tier. Example for 300,000 stored minutes:

- 5,000 basic 720p minutes: First tier rate (within first 50,000)
- 55,000 basic 1080p minutes: 50,000 at first tier, 5,000 at second tier
- 100,000 plus 1080p minutes: 50,000 at first tier, 50,000 at second tier
- 140,000 plus 4K minutes: 50,000 at first tier, 90,000 at second tier

## Billing and Reporting

The Mux dashboard provides a **Billing Breakdown** with:
- Last 6 billing cycles visualization
- Committed charges, overages, credits applied, and taxes
- Breakdown by product area (Video, Data)

### Video Billing Categories

- **Input VOD**: Recorded asset encoding
- **Input Live**: Live stream encoding
- **Advanced Static Rendition Generation**
- **Storage**: All assets excluding static renditions
- **Static Rendition Storage**
- **Delivery**: All delivery including live, VOD, and static renditions
- **Other**: DRM, simulcasting, auto-generated live captions

## Plans and Credits

### Pay As You Go

Standard usage-based pricing with no commitment.

### Pre-Pay Credits

- **Launch credits**: $100 of monthly usage for $20/month
- **Scale credits**: $1,000 of monthly usage for $500/month
- Credits reset at the beginning of each billing cycle
- Usage above credit amount billed at pay-as-you-go rates

### Custom/Contract Pricing

Available for scaling and enterprise customers starting at $3,000/month.

## FAQs

**Do I pay for every quality/bitrate delivered?**
No. A two-minute video costs two minutes regardless of how many formats or qualities are delivered.

**Is Low-Latency Live Streaming more expensive?**
No. Standard and low-latency live streaming have the same pricing.

**Is support included?**
Yes. Engineering support via email and chat is included. Slack and phone support packages are available.

**Is Mux Data included?**
Yes. Mux Data Startup plan is included with Mux Video for engagement and quality of experience monitoring.

**Are non-profit discounts available?**
One-time credits are available for non-profit customers. Contact Mux sales for details.
