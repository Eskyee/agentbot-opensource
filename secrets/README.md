# Docker Secrets Setup - Production

This directory contains sensitive production secrets. **NEVER commit these to git**.

## Files Required

1. `db_password.txt` - PostgreSQL password
2. `stripe_secret_key.txt` - Stripe live secret key (sk_live_...)
3. `stripe_public_key.txt` - Stripe live public key (pk_live_...)
4. `internal_api_key.txt` - Internal API key for service-to-service auth
5. `nextauth_secret.txt` - NextAuth secret (random 32+ char string)

## Setup

```bash
# On GCP VM, create secrets directory
mkdir -p ~/agentbot/secrets
cd ~/agentbot/secrets

# Create each secret file (one secret per file)
echo "your_db_password" > db_password.txt
echo "sk_live_YOUR_STRIPE_SECRET" > stripe_secret_key.txt
echo "pk_live_YOUR_STRIPE_PUBLIC" > stripe_public_key.txt
echo "your_internal_api_key_here" > internal_api_key.txt
echo "generate_random_32_char_string_here" > nextauth_secret.txt

# Secure permissions (readable by docker only)
chmod 600 *.txt
ls -la
```

## Generate NextAuth Secret

```bash
openssl rand -base64 32 > nextauth_secret.txt
```

## Deploy with Secrets

```bash
cd ~/agentbot
docker-compose -f docker-compose.production.yml up -d --build
```

## Verify Secrets Loaded

```bash
docker exec agentbot-frontend env | grep -i secret
docker exec agentbot-postgres psql -U agentbot -d agentbot_db -c "SELECT 1;"
```

## Security Notes

✅ Secrets never exposed in docker-compose.yml
✅ Secrets never logged or visible in containers
✅ File permissions: 600 (read-only by owner)
✅ Not committed to git (.gitignore includes /secrets/)
✅ Separate from environment variables
