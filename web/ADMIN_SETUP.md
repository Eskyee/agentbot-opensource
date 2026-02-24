# Admin Dashboard Setup

## 1. Run Database Migration

Add the `role` field to the User table:

```bash
cd web
npx prisma migrate dev --name add_user_role
```

Or manually run this SQL:

```sql
ALTER TABLE "User" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'user';
```

## 2. Make Yourself Admin

Update your user to admin role:

```sql
UPDATE "User" SET role = 'admin' WHERE email = 'rbasefm@icloud.com';
```

Or use Prisma Studio:

```bash
cd web
npx prisma studio
```

Then find your user and change `role` to `admin`.

## 3. Access Admin Dashboard

Go to: https://agentbot.raveculture.xyz/admin

## 4. Add More Admins

Edit `web/app/api/admin/users/route.ts` and add emails to the `ADMIN_EMAILS` array:

```typescript
const ADMIN_EMAILS = [
  'rbasefm@icloud.com',
  'another-admin@example.com', // Add more here
];
```

## Features

- View all users
- See user emails and verification status
- Delete users (except admins and yourself)
- User statistics

## Security

- Only emails in `ADMIN_EMAILS` can access
- Cannot delete admin users
- Cannot delete yourself
- All actions are logged
