# Content Security Policy for Mux

Security reference for configuring Content Security Policy (CSP) to work with Mux Video and Data services.

## Understanding CSP with Mux

Content Security Policy (CSP) is a security feature that helps protect your web application from cross-site scripting (XSS) attacks and other code injection attacks. CSP works by restricting the resources (such as scripts, stylesheets, images, and network connections) that a web page can load.

When integrating Mux Video and Mux Data into your application, you need to configure your CSP to allow connections to Mux services.

## Basic CSP Configuration

For most applications, the simplest approach is to use a basic CSP that allows all Mux services. This configuration ensures compatibility with all current and future Mux features:

```
Content-Security-Policy: default-src 'self' *.mux.com *.litix.io storage.googleapis.com
```

This CSP directive allows your application to:

- Load resources from your own domain (`'self'`)
- Connect to all Mux Video services (`*.mux.com`)
- Connect to all Mux Data services (`*.litix.io`)
- Connect to Google Cloud Storage (`storage.googleapis.com`) - needed for Direct Uploads

**Note:** The wildcard approach for `mux.com` and `litix.io` is recommended because Mux utilizes multiple CDNs and subdomains to provide optimal performance globally. These hostnames may change without notice as Mux optimizes infrastructure.

## Granular CSP Configuration

If your security requirements call for a more restrictive CSP, you can use specific directives instead of the broad `default-src` approach:

```
Content-Security-Policy:
  connect-src 'self' https://*.mux.com https://*.litix.io https://storage.googleapis.com;
  media-src 'self' blob: https://*.mux.com;
  img-src 'self' https://image.mux.com https://*.litix.io;
  script-src 'self' https://src.litix.io;
  worker-src 'self' blob:
```

**Important:** The above configuration must be merged with your existing CSP directives. Each directive should combine values from both your current policy and the Mux requirements.

## Upload and Media Handling

If your application uploads media files to Mux via Direct Uploads, you need additional CSP directives to handle binary data and file uploads:

```
Content-Security-Policy:
  connect-src 'self' https://*.mux.com https://*.litix.io https://storage.googleapis.com;
  media-src 'self' blob: https://*.mux.com;
  img-src 'self' https://image.mux.com https://*.litix.io;
  script-src 'self' https://src.litix.io;
  worker-src 'self' blob:;
  form-action 'self' https://*.mux.com https://storage.googleapis.com
```

### Key Upload Directives

| Directive | Purpose |
| :-------- | :------ |
| `https://storage.googleapis.com` in `connect-src` | Allows uploads to Google Cloud Storage endpoints used by Mux |
| `form-action` directive | Permits form submissions and PUT/POST requests to upload endpoints |
| `blob:` in `media-src` and `worker-src` | Enables handling of binary file data during upload processing |

## Product-Specific Requirements

Different Mux features have specific CSP requirements.

### Mux Video Playback

For video playback functionality, you **must** include:

```
connect-src https://*.mux.com;
media-src blob: https://*.mux.com;
worker-src blob:
```

This is required because:

- HLS manifests and video segments are delivered via `https://stream.mux.com` and other `*.mux.com` subdomains
- Video players use web workers and blob URLs for optimal performance
- Mux uses multiple CDNs with different hostnames for global performance

### Video Thumbnails and Storyboards

If you are displaying video thumbnails or timeline hover previews, include:

```
img-src https://image.mux.com;
connect-src https://image.mux.com
```

The `connect-src` directive is needed for dynamic thumbnail loading in timeline hover previews, while `img-src` covers standard image embedding.

### Mux Data Integration

For Mux Data analytics, you **must** allow:

```
connect-src https://*.litix.io;
img-src https://*.litix.io
```

This covers:

- Data collection endpoints across multiple subdomains
- Fallback beacon loading through image tags
- Various monitoring and analytics endpoints

**Environment-specific restriction:** For tighter security, you can replace `https://*.litix.io` with `https://img.litix.io` and `https://<env_key>.litix.io` where `<env_key>` is your Mux environment key. However, the wildcard approach is recommended for maximum compatibility.

### Hosted Mux Data Integrations

If you are loading pre-built Mux Data integrations from the hosted domain (rather than installing via NPM), add:

```
script-src https://src.litix.io
```

This is not required if you bundle the Mux Data SDK directly into your application code.

## Complete Example

A complete CSP that supports all Mux features including uploads:

```
Content-Security-Policy:
  default-src 'self';
  connect-src 'self' https://*.mux.com https://*.litix.io https://storage.googleapis.com;
  media-src 'self' blob: https://*.mux.com;
  img-src 'self' https://image.mux.com https://*.litix.io;
  script-src 'self' https://src.litix.io;
  worker-src 'self' blob:;
  form-action 'self' https://*.mux.com https://storage.googleapis.com
```

## CSP Directives Summary

| Directive | Required Domains | Purpose |
| :-------- | :--------------- | :------ |
| `connect-src` | `*.mux.com`, `*.litix.io`, `storage.googleapis.com` | API calls, video streaming, uploads, analytics |
| `media-src` | `blob:`, `*.mux.com` | Video and audio playback |
| `img-src` | `image.mux.com`, `*.litix.io` | Thumbnails, storyboards, analytics beacons |
| `script-src` | `src.litix.io` | Hosted Mux Data SDK (if not bundled) |
| `worker-src` | `blob:` | Web workers for video playback |
| `form-action` | `*.mux.com`, `storage.googleapis.com` | Direct upload form submissions |

## Testing

After implementing your CSP, test all Mux functionality in your application including:

- Video playback
- File uploads
- Thumbnails and storyboards
- Analytics data collection
