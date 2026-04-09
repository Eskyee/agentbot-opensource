import { sendSupportAlert } from './support-alert'

export function logTokenSanitization(source: string, raw: string | null | undefined, trimmed: string | null | undefined) {
  if (!raw || !trimmed) {
    const message = `[Token] ${source} missing gateway token`
    console.error(message)
    sendSupportAlert({ title: 'Gateway token missing', message, metadata: { source } }).catch(() => {})
    return
  }

  if (raw !== trimmed) {
    console.warn(`[Token] ${source} trimmed whitespace from gateway token`)
    sendSupportAlert({
      title: 'Gateway token sanitized',
      message: `[Token] ${source} trimmed whitespace from gateway token`,
      metadata: { source },
    }).catch(() => {})
  }

  if (!trimmed) {
    const message = `[Token] ${source} provided an empty token after trimming`
    console.error(message)
    sendSupportAlert({ title: 'Gateway token empty after trim', message, metadata: { source } }).catch(() => {})
  }
}
