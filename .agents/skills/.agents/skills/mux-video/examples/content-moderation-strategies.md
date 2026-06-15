# Content Moderation Strategies

Comprehensive guide to moderating user-generated video content on your platform. Covers both technical strategies (secure video playback, high delivery webhooks, AI-based moderation, Mux Data monitoring) and operational strategies (content policies, contact mechanisms, user signup flow modifications).

## Overview

If your platform accepts user-generated content in any form, users will upload everything and anything. For video this can be particularly high stakes, with the potential for users to upload anything from popular media content to inappropriate footage.

You do not need an army to implement content moderation strategies. This guide covers technical and operational strategies that platforms can use to keep their content libraries healthy.

## Technical Strategies

### Secure Video Playback

Mux secure video playback tools help make it more difficult for bad actors to use your videos for their own purposes.

When first testing out Mux, it is common to set a video's playback policy to `public` for easy viewing via a public URL. Once testing is done, UGC platforms should switch to using signed playback policies to help curb abuse.

Key capabilities:
- **Signed playback policies**: Use a JWT to time-limit requests for your content
- **Playback restrictions**: Specify which referring domains can serve your content

### High Delivery Webhook

For certain platforms, Mux offers an internal feature that sends notifications via webhook when high delivery traffic is detected on an asset. This helps catch unauthorized content quickly, before it results in increased spend or risk to your platform.

To get this feature enabled for your account, contact Mux Support.

### Alert Forwarding

The Mux Trust and Safety team contacts all administrators on your account in the event of account usage or content that violates the Terms of Service. The team may take actions including:
- Deletion of assets
- Disabling of live streams
- Disabling of environments (in rare cases)

Because bad actors often repeatedly upload the same unauthorized content, ensure these messages reach you right away so you can take appropriate actions to address the source (such as closing the user's account).

**Recommendation**: Add an email group or paging service email as an admin on your Mux account. For example, PagerDuty supports email routing for this purpose.

### AI-Based Content Moderation

A basic content moderation flow should take information about the video asset (sample still frames, audio transcript, metadata) and evaluate it based on algorithmic rules to escalate potentially troublesome content.

#### Using @mux/ai for Automated Moderation

The `@mux/ai` library provides prebuilt workflows for common video AI tasks, including content moderation. It works with LLM providers like OpenAI, Anthropic, or Google.

**Installation:**

```bash
npm install @mux/ai
```

**Configuration (environment variables):**

```bash
# Required
MUX_TOKEN_ID=your_mux_token_id
MUX_TOKEN_SECRET=your_mux_token_secret
# You only need the API key for the provider you're using
OPENAI_API_KEY=your_openai_api_key # OR
HIVE_API_KEY=your_hive_api_key
```

**Basic Usage:**

```javascript
import { getModerationScores } from "@mux/ai/workflows";

const result = await getModerationScores("your-mux-asset-id", {
  provider: "openai", // or "hive"
  thresholds: {
    sexual: 0.7,   // Flag content with 70%+ confidence
    violence: 0.8  // Flag content with 80%+ confidence
  }
});

console.log(result.exceedsThreshold); // true if content flagged
console.log(result.maxScores.sexual);  // Highest sexual content score
console.log(result.maxScores.violence); // Highest violence score
```

**Response Structure:**

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
    // ... more thumbnails
  ]
}
```

#### Moderation Providers

The library supports two moderation providers:

| Provider | Model | Description |
|----------|-------|-------------|
| OpenAI (default) | `omni-moderation-latest` | Multi-modal moderation with vision support |
| Hive | Specialized content safety models | Visual moderation using Hive APIs |

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

#### Configuring Thresholds

Thresholds use a 0-1 scale where higher values mean stricter moderation:

```javascript
const result = await getModerationScores("your-mux-asset-id", {
  thresholds: {
    sexual: 0.7,   // Flag content with 70%+ confidence of sexual content
    violence: 0.8  // Flag content with 80%+ confidence of violence
  }
});
```

Adjust thresholds based on your content policies and user base. Lower thresholds catch more content but may increase false positives.

#### Webhook Integration for Automated Moderation

Trigger moderation scores from the `video.asset.ready` webhook for automated moderation when videos are uploaded:

```javascript
export async function handleWebhook(req, res) {
  const event = req.body;

  if (event.type === 'video.asset.ready') {
    const result = await getModerationScores(event.data.id, { thresholds: { sexual: 0.7, violence: 0.8 } });
    if (result.exceedsThreshold) {
      await mux.video.assets.deletePlaybackId(event.data.id, event.data.playback_ids[0].id);
    }
  }
}
```

#### How AI Moderation Works

Under the hood, `@mux/ai` handles:

1. **Thumbnail extraction**: Selects representative frames based on video duration
   - Videos under 50 seconds: 5 evenly-spaced thumbnails
   - Longer videos: One thumbnail every 10 seconds
2. **Concurrent analysis**: Sends all thumbnails to the moderation API in parallel
3. **Score aggregation**: Tracks the highest scores across all thumbnails
4. **Threshold evaluation**: Compares max scores against configured thresholds
5. **Error handling**: Gracefully handles API failures and returns partial results

#### Data Sources for Moderation

Many customers grab images from their content via Mux APIs to feed into third-party services that provide object detection and specialized content classification. Key tools include:

- **Thumbnail API**: Extract still frames from videos
- **Auto-generated captions/transcripts**: Analyze audio content
- **Timeline hover previews**: Helpful for human reviewers
- **MP4 downloads**: For services that prefer video over thumbnails

Results from these services can trigger automated workflows using tools like n8n, Slack, PagerDuty, or Opsgenie. Simple cases can be actioned automatically while edge cases are escalated to human reviewers.

### Mux Data Monitoring

If high-risk content ends up on a page where you control the player, integrate Mux Data for visibility into viewing sessions and engagement tracking (including unwanted engagement).

**Capabilities:**
- Aggregate Views to gain insights into platforms and devices streaming your content
- Set up alerting based on concurrent viewership (Media tier)
- Create custom dimensions to supplement built-in metrics
- Export data via CSV files or Streaming Exports for external analysis

**Note**: The High Delivery Webhook "delivery rate" is different from "Views" tracked by Mux Data. Both can be used for telemetry, but they look at different parts of the video pipeline.

## Operational Strategies

### Content Policy

Make sure your content policies are clear. These rules can be in your Terms of Service, Acceptable Use Policy, Community Guidelines, or a separate content policy.

**Recommended Policy Topics:**

Users represent and warrant that:
- They will provide and maintain accurate account information
- They have the necessary licenses, rights, and permissions to upload content (including rights to third-party music, images, or footage)
- They will not use the service for unlawful purposes or in violation of applicable laws, rules, and regulations
- They will not upload content that infringes on copyright, trademark, or other intellectual property rights

Users will not upload content that is:
- False or misleading, including impersonation or defamation
- Violent, harmful, illegal, or dangerous, including content harmful to children
- Hateful, abusive, offensive, racist, sexist, or otherwise inappropriate
- Graphic, sexually explicit, or mature in nature

Additional terms:
- Users agree not to create undue burden or impact service to other users
- Users agree not to circumvent security or moderation features
- Platform may take action at its discretion for violations, including removing content and restricting or terminating accounts

You can also share details of how the policy is enforced, such as a strikes-based system.

If you have a legal advisor, discuss any obligations that may apply (such as under DMCA) and include coverage of those.

### Contact Mechanisms

Incorporate third-party reporting into your approach in addition to active moderation measures.

**Minimum Requirements:**
- Dedicated email address for complaints (such as `copyright@yourdomain.com` or `abuse@yourdomain.com`)
- Simple intake form that creates support tickets
- Ensure incoming messages route to someone trained to handle them appropriately

**Additional Considerations:**
- Evaluate whether your contact info should be listed in the US DMCA Agent Directory
- Implement in-product reporting capabilities allowing users to report videos that may violate content policies
- Consult your legal advisor, as some copyright safe harbor laws include specific requirements around contact details and response turnaround times

### User Signup Flow Modifications

If your platform sees patterns of abuse, consider altering the signup flow to disincentivize bad actors:

| Strategy | Purpose |
|----------|---------|
| Collect additional personal information (full name) | Increase sense of accountability |
| Send verification link to email | Verify authenticity before allowing video posts |
| Add buffer time before new users can post | Slow down rapid abuse |
| Add viewership limit for videos from new users | Limit reach of potentially problematic content |
| Require payment info before free trial | Add friction for bad actors on paid services |

## AI Moderation Best Practices

- Maintain a database of automated moderation actions to fine-tune thresholds
- Add notifications to users or moderators when content is flagged
- Implement manual review queues for borderline content
- Use transcriptions or captions for additional moderation beyond visual analysis
- Be mindful of AI API rate limits and implement moderation queueing if needed

## Related Mux Features

- Mux Thumbnail API for extracting frames for moderation analysis
- Webhooks for triggering moderation automatically
- Auto-generated captions and transcripts
- Timeline hover previews for human review
- Mux Data for monitoring and alerting

## External Resources

- [@mux/ai GitHub Repository](https://github.com/muxinc/ai)
- [OpenAI Moderation API](https://platform.openai.com/docs/guides/moderation)
- [DMCA Agent Directory](https://www.copyright.gov/dmca-directory/)
