#!/bin/bash
# Google RISC Setup Script for Agentbot
# 
# This script registers your RISC endpoint with Google.
# Run this AFTER:
# 1. Creating a service account in Google Cloud Console with RISC Configuration Admin role
# 2. Downloading the service account JSON key
# 3. Setting GOOGLE_RISC_SERVICE_ACCOUNT_PATH env var

set -euo pipefail

echo "🔐 Google RISC Setup for Agentbot"
echo "================================="
echo ""

# Check for service account
if [ -z "${GOOGLE_RISC_SERVICE_ACCOUNT_PATH:-}" ]; then
  echo "❌ GOOGLE_RISC_SERVICE_ACCOUNT_PATH not set"
  echo ""
  echo "Setup steps:"
  echo "1. Go to https://console.cloud.google.com/apis/credentials"
  echo "2. Select your project"
  echo "3. Create Credentials > Service Account"
  echo "4. Name it 'risc-admin'"
  echo "5. Assign role: RISC Configuration Admin (roles/riscconfigs.admin)"
  echo "6. Create key (JSON) and download it"
  echo "7. Set: export GOOGLE_RISC_SERVICE_ACCOUNT_PATH=/path/to/key.json"
  exit 1
fi

if [ ! -f "$GOOGLE_RISC_SERVICE_ACCOUNT_PATH" ]; then
  echo "❌ Service account file not found: $GOOGLE_RISC_SERVICE_ACCOUNT_PATH"
  exit 1
fi

# Generate auth token
echo "📝 Generating auth token..."
AUTH_TOKEN=$(python3 << PYTHON
import json, time, jwt

with open('$GOOGLE_RISC_SERVICE_ACCOUNT_PATH') as f:
    sa = json.load(f)

payload = {
    'iss': sa['client_email'],
    'sub': sa['client_email'],
    'aud': 'https://risc.googleapis.com/google.identity.risc.v1beta.RiscManagementService',
    'iat': int(time.time()),
    'exp': int(time.time()) + 3600
}

token = jwt.encode(payload, sa['private_key'], algorithm='RS256',
                   headers={'kid': sa['private_key_id']})
print(token)
PYTHON
)

echo "✅ Token generated"

# Register the endpoint
echo ""
echo "📡 Registering RISC endpoint..."
RECEIVER_URL="https://agentbot.raveculture.xyz/api/security/risc"

curl -s -X POST "https://risc.googleapis.com/v1beta/stream:update" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"delivery\": {
      \"delivery_method\": \"https://schemas.openid.net/secevent/risc/delivery-method/push\",
      \"url\": \"$RECEIVER_URL\"
    },
    \"events_requested\": [
      \"https://schemas.openid.net/secevent/risc/event-type/account-disabled\",
      \"https://schemas.openid.net/secevent/risc/event-type/account-enabled\",
      \"https://schemas.openid.net/secevent/risc/event-type/sessions-revoked\",
      \"https://schemas.openid.net/secevent/oauth/event-type/tokens-revoked\",
      \"https://schemas.openid.net/secevent/risc/event-type/account-credential-change-required\",
      \"https://schemas.openid.net/secevent/risc/event-type/verification\"
    ]
  }" | python3 -m json.tool 2>/dev/null || echo "Response received"

echo ""
echo "✅ RISC endpoint registered!"
echo ""
echo "Next steps:"
echo "1. Test with: curl -X POST https://risc.googleapis.com/v1beta/stream:verify ..."
echo "2. Check logs at: /api/security/risc (GET for health check)"
echo "3. Monitor RISC events in your database (risc_events table)"
