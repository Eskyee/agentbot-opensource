#!/bin/bash
# Run this to migrate production database

echo "Running Prisma migration on production database..."
cd ~/Documents/GitHub/agentbot/web
npx prisma migrate deploy

echo "Making your email admin..."
npx prisma db execute --stdin <<SQL
UPDATE "User" SET role = 'admin' WHERE email = 'YOUR_ADMIN_EMAIL_2';
SQL

echo "Done! Check https://agentbot.raveculture.xyz/admin"
