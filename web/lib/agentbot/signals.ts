export async function sendLiveSignal(roomId: string, signal: string): Promise<{ ok: boolean }> {
  const res = await fetch(`/api/live/${roomId}/signal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ signal }),
  })
  if (!res.ok) return { ok: false }
  return res.json() as Promise<{ ok: boolean }>
}
