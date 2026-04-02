export interface SupportAlertPayload {
  title: string
  message: string
  metadata?: Record<string, unknown>
}

export async function sendSupportAlert(payload: SupportAlertPayload) {
  const webhookUrl = process.env.SUPPORT_WEBHOOK_URL

  if (!webhookUrl) {
    console.warn('[SupportAlert] SUPPORT_WEBHOOK_URL not configured.', payload)
    return
  }

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: `${payload.title}\n${payload.message}`,
        metadata: payload.metadata,
      }),
    })
  } catch (error: unknown) {
    console.error('[SupportAlert] Failed to send alert', error)
  }
}
