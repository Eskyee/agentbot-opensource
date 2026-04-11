#!/usr/bin/env bash
# Solana Holder Monitor — snapshots Token-2022 holder data daily
# Token: 9V4m199eohMgy7bB7MbXhDacUur6NzpgZVrhfux5pump
# Program: TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb (Token-2022)

set -euo pipefail

TOKEN_MINT="9V4m199eohMgy7bB7MbXhDacUur6NzpgZVrhfux5pump"
RPC_URL="${SOLANA_RPC_URL:-https://api.mainnet-beta.solana.com}"
DATA_DIR="/Users/raveculture/agentbot/data/solana-holders"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
DATE=$(date -u +"%Y-%m-%d")
OUTPUT_FILE="${DATA_DIR}/${DATE}.json"

mkdir -p "$DATA_DIR"

echo "🔍 Querying Solana RPC for Token-2022 holders of ${TOKEN_MINT}..."
echo "   RPC: ${RPC_URL}"
echo "   Time: ${TIMESTAMP}"

# Step 1: Get all token accounts for this mint using getTokenAccountsByOwner is not feasible
# Instead we use getProgramAccounts on the Token-2022 program filtered by mint
# Token-2022 account layout: mint is at offset 0 (32 bytes)

# Encode the mint as base58 filter — we use dataSize + memcmp on mint field
# Token-2022 account size varies, but mint is always at offset 0

ACCOUNTS_JSON=$(curl -s -X POST "$RPC_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getProgramAccounts",
    "params": [
      "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
      {
        "encoding": "jsonParsed",
        "filters": [
          {
            "memcmp": {
              "offset": 0,
              "bytes": "'"${TOKEN_MINT}"'",
              "encoding": "base58"
            }
          }
        ]
      }
    ]
  }')

# Check for RPC errors
ERROR=$(echo "$ACCOUNTS_JSON" | jq -r '.error // empty')
if [ -n "$ERROR" ]; then
  echo "❌ RPC Error: $ERROR"
  exit 1
fi

# Step 2: Parse accounts and extract holder data
ACCOUNT_COUNT=$(echo "$ACCOUNTS_JSON" | jq '.result | length')
echo "   Found ${ACCOUNT_COUNT} token accounts"

# Build holders array with wallet + balance
HOLDERS=$(echo "$ACCOUNTS_JSON" | jq -r '
  [.result[] | {
    wallet: .account.data.parsed.info.owner,
    balance: (.account.data.parsed.info.tokenAmount.uiAmount // 0),
    balanceRaw: .account.data.parsed.info.tokenAmount.amount
  }] | sort_by(-.balance)
')

# Calculate stats
TOTAL_HOLDERS=$(echo "$HOLDERS" | jq 'length')
TOTAL_SUPPLY=$(echo "$HOLDERS" | jq '[.[].balance] | add // 0')
TOP_10=$(echo "$HOLDERS" | jq '.[0:10]')

# Step 3: Write snapshot
jq -n \
  --arg ts "$TIMESTAMP" \
  --arg mint "$TOKEN_MINT" \
  --argjson holders "$TOTAL_HOLDERS" \
  --argjson supply "$TOTAL_SUPPLY" \
  --argjson top10 "$TOP_10" \
  '{
    timestamp: $ts,
    token_mint: $mint,
    total_holders: $holders,
    total_supply_held: $supply,
    top_10_wallets: $top10
  }' > "$OUTPUT_FILE"

echo ""
echo "✅ Snapshot saved: ${OUTPUT_FILE}"
echo "   Total holders: ${TOTAL_HOLDERS}"
echo "   Total supply held: ${TOTAL_SUPPLY}"
echo "   Top 10 wallets captured"
