export async function generateXDraft(sourceText: string, tone: string) {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return `Draft (${tone}): ${sourceText.slice(0, 180)}`
  }

  const prompt = [
    'You write short X posts for an operator-grade social agent workflow.',
    'Rules:',
    '- No emojis',
    '- No hashtags in the body',
    '- Keep it sharp and high-signal',
    '- One idea per post',
    '- Max 280 characters',
    `Tone: ${tone}`,
    `Source: ${sourceText}`,
    'Return only the draft text.',
  ].join('\n')

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openrouter/xiaomi/mimo-v2-pro',
      messages: [{ role: 'user', content: prompt }],
      stream: false,
      max_tokens: 160,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Draft generation failed: ${response.status} ${errorText}`)
  }

  const payload = await response.json()
  const text = String(payload?.choices?.[0]?.message?.content || '').trim()
  return text.slice(0, 280)
}
