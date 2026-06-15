import webpush from 'web-push'
import { prisma } from '@/app/lib/prisma'

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY!
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY!
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@agentbot.dev'

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
}

export async function sendPushNotification(
  userId: string,
  payload: { title: string; body: string; url?: string }
) {
  if (!vapidPublicKey || !vapidPrivateKey) return

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  })

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      )
    )
  )

  // Remove expired subscriptions
  const expiredEndpoints: string[] = []
  results.forEach((result, i) => {
    if (result.status === 'rejected' && result.reason?.statusCode === 410) {
      expiredEndpoints.push(subscriptions[i].endpoint)
    }
  })

  if (expiredEndpoints.length > 0) {
    await prisma.pushSubscription.deleteMany({
      where: { endpoint: { in: expiredEndpoints } },
    })
  }

  return results
}
