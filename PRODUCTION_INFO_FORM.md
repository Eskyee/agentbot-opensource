# Production Deployment - Information Needed

Please provide the following information from your Stripe account:

## Stripe Live API Keys

From: https://dashboard.stripe.com/apikeys

Secret Key (Live):
```
sk_live_________________________________
```

Publishable Key (Live):
```
pk_live_________________________________
```

---

## Stripe Product Price IDs

From: https://dashboard.stripe.com/products

Click each product to find the Price ID:

**Starter Plan** Price ID:
```
price_________________________________
```

**Pro Plan** Price ID:
```
price_________________________________
```

**Scale Plan** Price ID:
```
price_________________________________
```

**Enterprise Plan** Price ID:
```
price_________________________________
```

**White Glove Plan** Price ID:
```
price_________________________________
```

---

## Production Server Details

**Server IP/Domain:**
```
_________________________________
```

**SSH User:**
```
_________________________________
```

**SSH Key Path** (local machine):
```
_________________________________
```

**OS:**
```
[ ] Ubuntu 22.04
[ ] Ubuntu 20.04
[ ] Debian 12
[ ] Other: _________________
```

**Installed Services:**
```
[ ] Docker
[ ] Docker Compose
[ ] Node.js
[ ] PostgreSQL
[ ] Redis
```

---

## Optional Configuration

**Email Provider** (for sending payment receipts):

```
Provider:
[ ] Resend (recommended)
[ ] SendGrid
[ ] AWS SES
[ ] Custom SMTP
[ ] None (skip emails for now)

API Key/Credentials:
_________________________________
```

**Internal API Key** (for backend auth):

Generate a random key or use:
```
_________________________________
```

---

## Once You Provide This Information, I Will:

1. ✓ Create production .env file
2. ✓ Configure webhook in Stripe dashboard
3. ✓ Deploy docker-compose.yml to your server
4. ✓ Start all services
5. ✓ Run verification tests
6. ✓ Test live payment flow
7. ✓ Monitor first transactions

**Total time: ~30-45 minutes**

---

**Please copy this form and fill it in with your Stripe details!**
