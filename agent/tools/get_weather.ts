import { defineTool } from 'eve/tools'
import { never } from 'eve/tools/approval'
import { z } from 'zod'

export default defineTool({
  needsApproval: never(),
  description: 'Gets the current weather for a named location.',
  inputSchema: z.object({
    location: z.string(),
  }),
  async execute({ location }) {
    const geo = (await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`
    ).then((r) => r.json())) as {
      results?: { latitude: number; longitude: number; name: string }[]
    }
    const place = geo.results?.[0]
    if (!place) {
      return { error: `No location found for "${location}".` }
    }
    const weather = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,apparent_temperature,wind_speed_10m,weather_code`
    ).then((r) => r.json())
    return { place: place.name, weather }
  },
})
