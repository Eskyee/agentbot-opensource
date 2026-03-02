# AgentBot Private Mode - Invite-Only Access

## Overview

AgentBot is configured as a **completely private platform** with invite-only access. Only users with valid invite codes can create accounts and access the platform.

---

## Configuration

### Environment Variables

```bash
# Enable private mode
PRIVATE_MODE=true
INVITE_REQUIRED=true
NEXT_PUBLIC_APP_URL=http://localhost:3000 (or your production URL)
```

When enabled:
- Public signup is disabled
- Only invited users can access
- All routes require authentication
- Admin can manage invites

---

## Features

### 1. Invite System
- Generate unique invite codes
- Share via email
- Track usage
- One-time use or reusable codes
- Expiration dates

### 2. Admin Dashboard
- `/admin/invites` - Manage all invites
- Create new invites
- View active/used/expired
- Copy shareable links
- Track who joined

### 3. Join Page
- `/join?code=XXXX` - User joins with code
- Simple one-step signup
- Email verification
- Automatic redirect to dashboard

### 4. Access Control
- All API endpoints require authentication
- Private routes protected
- Dashboard accessible only to members
- Admin functions locked

---

## How It Works

### Step 1: Admin Creates Invite
```bash
POST /api/admin/invites
{
  "email": "user@example.com"
}

Response:
{
  "code": "invite-abc123xyz",
  "inviteUrl": "https://agentbot.yourcompany.xyz/join?code=invite-abc123xyz"
}
```

### Step 2: Admin Shares Link
Send the invite URL to the user:
```
https://agentbot.yourcompany.xyz/join?code=invite-abc123xyz
```

### Step 3: User Joins
1. Click link
2. Enter email
3. Create account
4. Access dashboard

### Step 4: User Can Deploy Agents
- Full platform access
- Deploy OpenClaw agents
- Manage settings
- Monitor dashboards

---

## Admin Interface

### Access Admin Panel
```
/admin/invites
```

### Create Invite
1. Enter user email
2. Click "Create Invite"
3. Get shareable link
4. Send to user

### Monitor Invites
- View all created invites
- See status (active/used/expired)
- Track creation date
- Copy links anytime

---

## API Endpoints

### Create Invite (Admin)
```
POST /api/admin/invites
Authorization: Bearer [ADMIN_TOKEN]
Content-Type: application/json

{
  "email": "user@example.com"
}

Response: 201 Created
{
  "success": true,
  "code": "invite-...",
  "email": "user@example.com",
  "inviteUrl": "https://..."
}
```

### Verify Invite
```
POST /api/invites/verify
Content-Type: application/json

{
  "code": "invite-abc123xyz"
}

Response: 200 OK
{
  "valid": true,
  "message": "Invite code is valid"
}
```

### Get All Invites (Admin)
```
GET /api/admin/invites
Authorization: Bearer [ADMIN_TOKEN]

Response: 200 OK
{
  "invites": [...],
  "total": 10,
  "active": 8
}
```

---

## User Experience

### New User Flow
1. **Receive Invite** via email with link
2. **Click Link** → `/join?code=XXXX`
3. **Enter Email**
4. **Create Account** (one click)
5. **Access Dashboard** (immediate)
6. **Deploy Agents** (ready to go)

### Returning User Flow
1. **Visit** agentbot.yourcompany.xyz
2. **Login** with credentials
3. **Access Dashboard**
4. **Manage Agents**

---

## Security

### Authentication
- All routes require login or invite code
- Sessions managed via authentication
- API keys required for endpoints
- Rate limiting enabled

### Invite Codes
- Unique 20+ character codes
- One-time use (configurable)
- Expiration (configurable)
- Email verification
- IP tracking (optional)

### Access Control
- Private routes hidden
- API routes protected
- Admin functions locked
- Data isolation per user

---

## Configuration Options

### Private Mode Settings
```bash
# Enable/disable private mode
PRIVATE_MODE=true|false

# Require invites for all signups
INVITE_REQUIRED=true|false

# Admin API key for creating invites
ADMIN_API_KEY=xxxxx

# Invite expiration (days)
INVITE_EXPIRATION_DAYS=30

# One-time use (remove after first use)
INVITE_ONE_TIME_USE=true|false

# Max invites per admin
MAX_INVITES_PER_ADMIN=100
```

---

## Transitioning to Public

When ready to go public:

1. **Update .env**
   ```bash
   PRIVATE_MODE=false
   INVITE_REQUIRED=false
   ```

2. **Restart Services**
   ```bash
   docker compose restart frontend
   ```

3. **Public Access Enabled**
   - Public signup available
   - No invite codes required
   - Anyone can join

---

## Support

### For Users
- Direct support email: support@agentbot.raveculture.xyz
- Discord community (private)
- Documentation portal
- Help center

### For Admins
- Invite management dashboard
- User tracking
- Usage analytics
- Support tools

---

## Best Practices

✅ **DO**
- Vet users before sending invites
- Track who has access
- Regular security audits
- Monitor for abuse
- Keep admin credentials secure

❌ **DON'T**
- Share admin credentials
- Create unlimited invites
- Disable authentication
- Expose invite codes publicly
- Allow public API access

---

## Troubleshooting

### Invite Code Not Working
- Check code is correct
- Verify code hasn't expired
- Check email hasn't changed
- Request new invite

### Can't Access Dashboard
- Verify you're logged in
- Check browser cookies
- Clear cache and retry
- Contact support

### Admin Can't Create Invites
- Verify admin credentials
- Check API key is valid
- Ensure PRIVATE_MODE=true
- Check server logs

---

## Summary

✅ **AgentBot is now completely private**
- Invite-only access
- Admin control
- Secure by default
- Easy to transition to public

Start with Phase 1 closed beta (50-100 invited users) and expand from there!

