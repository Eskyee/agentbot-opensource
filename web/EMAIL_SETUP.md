# Welcome Email Setup

## 1. Get Resend API Key

1. Go to https://resend.com
2. Sign up / Log in
3. Go to API Keys
4. Create a new API key
5. Copy the key (starts with `re_`)

## 2. Add to Vercel Environment Variables

1. Go to your Vercel project settings
2. Go to Environment Variables
3. Add:
   - Name: `RESEND_API_KEY`
   - Value: `re_your_api_key_here`
   - Environment: Production, Preview, Development

## 3. Verify Domain (REQUIRED)

To send from `noreply@agentbot.raveculture.xyz`:

1. In Resend dashboard, go to Domains
2. Add domain: `agentbot.raveculture.xyz`
3. Add the DNS records they provide to Cloudflare:
   - MX record
   - SPF record (TXT)
   - DKIM record (TXT)
   - DMARC record (TXT) - optional but recommended
4. Wait for verification (~5 minutes)

**Important**: Without domain verification, emails will fail to send. The domain must be verified in Resend.

## 4. DNS Records for Cloudflare

Add these records in Cloudflare DNS:

| Type  | Name                    | Value                              |
|-------|-------------------------|------------------------------------|
| MX    | agentbot.raveculture.xyz | mx.sendgrid.net (from Resend)     |
|TXT    | agentbot.raveculture.xyz | v=spf1 include:resend ~all        |
|TXT    | resend._domainkey       | (DKIM key from Resend dashboard)  |

## 5. Test It

1. Sign up a new user
2. Check their email inbox
3. They should receive a welcome email with:
   - Getting started steps
   - Links to marketplace, dashboard, docs
   - What they can build
   - Pro tips

## Email Content

The welcome email includes:
- 🦞 Agentbot branding
- 3-step getting started guide
- Links to marketplace, dashboard, docs
- What you can build (agent examples)
- Pro tip for first agent
- Help resources
- Dark theme (matches brand)

## Customization

Edit `web/lib/email/welcome.ts` to customize:
- Email subject
- From name/email
- HTML content
- Links and copy

## Troubleshooting

**Email not sending?**
- Check RESEND_API_KEY is set in Vercel
- Check Resend dashboard for errors
- Check spam folder
- Verify domain is verified in Resend dashboard

**"Domain not found" error?**
- Add the domain in Resend dashboard
- Add required DNS records in Cloudflare
- Wait for DNS propagation (up to 48 hours)

**Email going to spam?**
- Verify your domain in Resend
- Add SPF, DKIM, DMARC records
- Warm up your domain (send gradually)
