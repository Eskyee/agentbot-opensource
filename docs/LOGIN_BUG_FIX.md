# Login Bug Fix - Production Database Issues

## Problem

Users couldn't log in to the production app. Error: "Invalid email or password"

## Root Causes

1. **Missing Database Migration** - The `plan` column didn't exist in the production database
2. **No Users in Database** - The user table was empty
3. **Password Hash Issues** - Initial password hash wasn't being set correctly

## Fix Steps

### 1. Set up Node.js on Production Server

```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Fix ownership
sudo chown -R $(whoami) .
```

### 2. Fix Database Permissions & Sync Schema

```bash
cd ~/agentbot/web
export DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-xxx-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Push schema to sync
npx prisma db push
```

### 3. Create/Update User

**Option A: Register via App**
Visit `/register` or use the signup page to create a user.

**Option B: Create via CLI**
```bash
# Generate password hash
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('password123', 12));"

# Insert user (use the hash from above)
npx prisma db execute --stdin <<'EOF'
INSERT INTO "User" (id, email, name, password, role, "storageLimit", plan, "subscriptionStatus")
VALUES ('usr_123', 'email@example.com', 'Name', 'YOUR_HASH_HERE', 'admin', 100, 'starter', 'active')
ON CONFLICT (email) DO NOTHING;
EOF
```

### 4. Make User Admin

```bash
npx prisma db execute --stdin <<'EOF'
UPDATE "User" SET role = 'admin' WHERE email = 'rbasefm@icloud.com';
EOF
```

## Useful Commands

```bash
# Check users
npx prisma db execute --stdin <<'EOF'
SELECT id, email, name, role FROM "User";
EOF

# Delete user
npx prisma db execute --stdin <<'EOF'
DELETE FROM "User" WHERE email = 'user@example.com';
EOF

# Reset password
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('newpassword', 12));"

# Then update with new hash
npx prisma db execute --stdin <<'EOF'
UPDATE "User" SET password = 'NEW_HASH_HERE' WHERE email = 'user@example.com';
EOF
```

## Prevention

- Always run migrations after schema changes: `npx prisma migrate deploy`
- Or use `npx prisma db push` for quick sync in development
- Keep DATABASE_URL in Vercel env vars updated
