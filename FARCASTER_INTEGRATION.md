# Farcaster Integration & $RAVE Token Gating Setup

## Overview

Agentbot integrates with Farcaster frames and implements **$RAVE token gating** on the Base blockchain to restrict access to premium features. Users must hold a minimum of **1 RAVE token** to access gated features.

---

## 📋 Components

### 1. Farcaster Manifest (`web/public/farcaster.json`)
Declares the Farcaster frame configuration including:
- Name, description, and branding
- Token gating requirements
- Authentication endpoints
- Minimum SDK version (2.13.0)

**Location:** `/farcaster.json` (publicly accessible)

### 2. Token Gating API (`/api/auth/token-gating/verify`)
Verifies $RAVE token balance on Base blockchain.

**Endpoints:**
- `POST /api/auth/token-gating/verify` - Verify with FID and address
- `GET /api/auth/token-gating/verify?address=0x...` - Check balance only

**Response:**
```json
{
  "address": "0x...",
  "hasAccess": true,
  "tokenGated": true,
  "minBalance": "1000000000000000000",
  "token": "RAVE",
  "chain": "base",
  "message": "User has sufficient $RAVE balance"
}
```

### 3. Farcaster Authentication (`/api/auth/farcaster/verify`)
Verifies Farcaster user identity and checks token gating.

**Endpoint:** `POST /api/auth/farcaster/verify`

**Request:**
```json
{
  "fidToken": "farcaster_jwt_token",
  "address": "0x..."
}
```

**Response (Success):**
```json
{
  "success": true,
  "sessionToken": "base64_encoded_session",
  "address": "0x...",
  "message": "Farcaster verification successful",
  "tokenGated": true,
  "accessLevel": "premium"
}
```

**Response (Token Gating Failed):**
```json
{
  "error": "Token gating failed",
  "message": "Insufficient $RAVE balance. Minimum 1 RAVE required.",
  "required": "RAVE",
  "minBalance": "1000000000000000000"
}
```

### 4. Token Refresh (`/api/auth/farcaster/refresh`)
Refreshes expired Farcaster session tokens.

**Endpoint:** `POST /api/auth/farcaster/refresh`

**Request:**
```json
{
  "refreshToken": "base64_encoded_refresh_token"
}
```

---

## 🔧 Configuration

### Environment Variables
Add to `.env`:
```bash
# Farcaster
NEXT_PUBLIC_FARCASTER_HUB_URL=https://hub.thirdweb.com

# Token Gating
RAVE_TOKEN_ADDRESS=0x6EE72eEDEfBa8937Ec8c36dEd9B8c1ef9ca7A3db
RAVE_MIN_BALANCE=1000000000000000000  # 1 RAVE (18 decimals)
BASE_RPC_URL=https://mainnet.base.org
```

### Smart Contract Details
- **Token:** RAVE on Base blockchain
- **Contract Address:** `0x6EE72eEDEfBa8937Ec8c36dEd9B8c1ef9ca7A3db`
- **Chain:** Base (mainnet)
- **Minimum Balance:** 1 RAVE (1e18 wei)

---

## 🚀 Usage Examples

### 1. Check Token Balance
```bash
curl -X GET "https://agentbot.raveculture.xyz/api/auth/token-gating/verify?address=0x..." \
  -H "Content-Type: application/json"
```

### 2. Verify Farcaster User
```bash
curl -X POST "https://agentbot.raveculture.xyz/api/auth/farcaster/verify" \
  -H "Content-Type: application/json" \
  -d '{
    "fidToken": "your_farcaster_token",
    "address": "0x..."
  }'
```

### 3. Refresh Token
```bash
curl -X POST "https://agentbot.raveculture.xyz/api/auth/farcaster/refresh" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "base64_encoded_token"
  }'
```

---

## 🔐 Security Considerations

1. **Token Verification:** All Farcaster tokens are verified with the Farcaster Hub
2. **Balance Checking:** Token balance checked on-chain via Base RPC
3. **Rate Limiting:** Token gating checks are rate-limited (60 req/min per IP)
4. **HTTPS Only:** All endpoints require HTTPS in production
5. **Session Expiration:** Session tokens expire after 24 hours
6. **Refresh Flow:** Use refresh tokens to obtain new sessions without re-authentication

---

## 📊 Testing Token Gating

### Test Cases

**Case 1: User with sufficient $RAVE**
```bash
# User has 1+ RAVE
POST /api/auth/farcaster/verify
{
  "fidToken": "valid_token",
  "address": "0x_with_rave"
}
# ✅ Response: 200 OK, accessLevel: "premium"
```

**Case 2: User without $RAVE**
```bash
# User has 0 RAVE
POST /api/auth/farcaster/verify
{
  "fidToken": "valid_token",
  "address": "0x_no_rave"
}
# ❌ Response: 403 Forbidden, error: "Insufficient $RAVE balance"
```

**Case 3: Invalid Token**
```bash
POST /api/auth/farcaster/verify
{
  "fidToken": "invalid_token"
}
# ❌ Response: 401 Unauthorized
```

---

## 🔄 Deployment Flow

1. **Farcaster Manifest Discovery**
   - User opens Farcaster frame
   - Client fetches `/farcaster.json`
   - Identifies token gating requirement

2. **User Authentication**
   - User connects wallet (Base chain)
   - Farcaster auth token obtained
   - Sends both to `/api/auth/farcaster/verify`

3. **Token Balance Check**
   - Backend queries Base RPC for RAVE balance
   - Compares against minimum (1 RAVE)
   - Returns access level

4. **Session Management**
   - If approved: Session token issued (24h expiry)
   - If denied: Redirect to get RAVE prompt
   - Refresh token provided for token renewal

---

## 🛠️ Troubleshooting

### API Returning 404
**Issue:** `/farcaster.json` not found
**Solution:** Ensure `web/public/farcaster.json` exists and is deployed

### Token Balance Check Failing
**Issue:** Base RPC unreachable
**Solution:** 
- Verify `BASE_RPC_URL` is set correctly
- Check network connectivity
- Fallback to backup RPC endpoint

### Farcaster Token Invalid
**Issue:** Verification endpoint returning 401
**Solution:**
- Ensure Farcaster token is valid and not expired
- Verify token format is correct
- Check Farcaster Hub connectivity

### Session Token Expired
**Issue:** Access denied with expired token error
**Solution:**
- Use refresh token to obtain new session
- Implement automatic refresh before expiration
- Clear local storage and re-authenticate

---

## 📚 Resources

- **Farcaster Docs:** https://docs.farcaster.xyz
- **Base Blockchain:** https://base.org
- **Token Contract:** https://basescan.org/token/0x6ee72eedefba8937ec8c36ded9b8c1ef9ca7a3db
- **OnChainKit:** https://docs.coinbase.com/onchainkit
- **Wagmi:** https://wagmi.sh

---

## ✅ Status

- ✅ Farcaster manifest configured
- ✅ Token gating API implemented
- ✅ Farcaster authentication endpoints created
- ✅ Token refresh mechanism implemented
- ✅ Base blockchain integration ready
- ⏳ Testing in progress
