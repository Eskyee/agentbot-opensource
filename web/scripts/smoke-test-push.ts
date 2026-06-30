/**
 * Smoke test: send a push notification to the admin user.
 *
 * Usage:
 *   DATABASE_URL="postgresql://..." node scripts/smoke-test-push.ts
 *   # or with tsx:
 *   DATABASE_URL="postgresql://..." npx tsx scripts/smoke-test-push.ts
 */

import { PrismaClient } from '@prisma/client'
import webpush from 'web-push'

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2] || 'YOUR_ADMIN_EMAIL_1'

  const user = await prisma.user.findFirst({
    where: { email },
    select: { id: true, email: true },
  })

  if (!user) {
    console.error(`User not found: ${email}`)
    process.exit(1)
  }

  console.log(`User: ${user.email} (${user.id})`)

  const subs = await prisma.pushSubscription.findMany({
    where: { userId: user.id },
  })

  console.log(`Push subscriptions: ${subs.length}`)

  if (subs.length === 0) {
    console.log('No subscriptions. Enable push in Settings > Notifications first.')
    process.exit(0)
  }

  const vk = process.env.VAPID_PUBLIC_KEY
  const sk = process.env.VAPID_PRIVATE_KEY
  if (!vk || !sk) {
    console.error('VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY required')
    process.exit(1)
  }

  webpush.setVapidDetails('mailto:admin@agentbot.sh', vk, sk)

  let sent = 0
  let failed = 0

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({
          title: 'Agentbot Smoke Test',
          body: 'Push notifications are working!',
          url: '/dashboard',
        })
      )
      sent++
      console.log(`  ✓ ${sub.id}`)
    } catch (err: any) {
      failed++
      console.log(`  ✗ ${sub.id}: ${err.message}`)
      if (err.statusCode === 410) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } })
        console.log('    Cleaned up expired subscription')
      }
    }
  }

  console.log(`\nDone: ${sent} sent, ${failed} failed`)
  await prisma.$disconnect()
}

main()
