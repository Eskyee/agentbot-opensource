export interface MuxLiveStream {
  id: string
  status: 'active' | 'idle' | 'disabled'
  playback_ids?: Array<{ id: string; policy?: string }>
  recent_asset_ids?: string[]
}

export interface MuxAssetDeleteResult {
  ok: boolean
  assetId: string
  error?: string
}

export interface MuxRetireLiveStreamResult {
  ok: boolean
  streamId: string
  streamDisabled: boolean
  streamDeleted: boolean
  preserveAssets: boolean
  deletedAssetIds: string[]
  retainedAssetIds: string[]
  errors: string[]
}

export function getMuxCredentials() {
  return {
    tokenId: process.env.MUX_TOKEN_ID,
    tokenSecret: process.env.MUX_TOKEN_SECRET,
  }
}

function getMuxAuthHeader() {
  const { tokenId, tokenSecret } = getMuxCredentials()
  if (!tokenId || !tokenSecret) {
    throw new Error('Mux not configured')
  }

  const auth = Buffer.from(`${tokenId}:${tokenSecret}`).toString('base64')
  return `Basic ${auth}`
}

async function muxRequest(path: string, init?: RequestInit) {
  return fetch(`https://api.mux.com/video/v1${path}`, {
    ...init,
    headers: {
      Authorization: getMuxAuthHeader(),
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  })
}

export async function getMuxLiveStream(streamId: string): Promise<MuxLiveStream | null> {
  const response = await muxRequest(`/live-streams/${streamId}`, { method: 'GET' })

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Mux stream fetch failed: ${response.status} ${errorText}`)
  }

  const payload = await response.json()
  return payload.data || null
}

export async function disableMuxLiveStream(streamId: string) {
  const response = await muxRequest(`/live-streams/${streamId}/disable`, { method: 'PUT' })

  if (response.status === 404) {
    return { ok: true as const }
  }

  if (!response.ok) {
    const errorText = await response.text()
    return { ok: false as const, error: `Mux disable failed: ${response.status} ${errorText}` }
  }

  return { ok: true as const }
}

export async function deleteMuxLiveStream(streamId: string) {
  const response = await muxRequest(`/live-streams/${streamId}`, { method: 'DELETE' })

  if (response.status === 404) {
    return { ok: true as const }
  }

  if (!response.ok) {
    const errorText = await response.text()
    return { ok: false as const, error: `Mux live stream delete failed: ${response.status} ${errorText}` }
  }

  return { ok: true as const }
}

export async function deleteMuxAsset(assetId: string): Promise<MuxAssetDeleteResult> {
  const response = await muxRequest(`/assets/${assetId}`, { method: 'DELETE' })

  if (response.status === 404) {
    return { ok: true, assetId }
  }

  if (!response.ok) {
    const errorText = await response.text()
    return { ok: false, assetId, error: `Mux asset delete failed: ${response.status} ${errorText}` }
  }

  return { ok: true, assetId }
}

export async function retireMuxLiveStream(
  streamId: string,
  options: { preserveAssets?: boolean } = {}
): Promise<MuxRetireLiveStreamResult> {
  const preserveAssets = options.preserveAssets === true
  const errors: string[] = []
  let streamDisabled = false
  let streamDeleted = false
  let retainedAssetIds: string[] = []
  let deletedAssetIds: string[] = []

  try {
    const liveStream = await getMuxLiveStream(streamId)
    retainedAssetIds = liveStream?.recent_asset_ids || []

    if (!liveStream || liveStream.status === 'disabled') {
      streamDisabled = true
    } else {
      const disableResult = await disableMuxLiveStream(streamId)
      if (disableResult.ok) {
        streamDisabled = true
      } else if (disableResult.error) {
        errors.push(disableResult.error)
      }
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Failed to inspect Mux live stream')
  }

  if (!preserveAssets && retainedAssetIds.length > 0) {
    const deletes = await Promise.all(retainedAssetIds.map((assetId) => deleteMuxAsset(assetId)))
    deletedAssetIds = deletes.filter((result) => result.ok).map((result) => result.assetId)
    for (const result of deletes) {
      if (!result.ok && result.error) {
        errors.push(result.error)
      }
    }
    retainedAssetIds = retainedAssetIds.filter((assetId) => !deletedAssetIds.includes(assetId))
  }

  try {
    const deleteResult = await deleteMuxLiveStream(streamId)
    if (deleteResult.ok) {
      streamDeleted = true
    } else if (deleteResult.error) {
      errors.push(deleteResult.error)
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Failed to delete Mux live stream')
  }

  return {
    ok: errors.length === 0,
    streamId,
    streamDisabled,
    streamDeleted,
    preserveAssets,
    deletedAssetIds,
    retainedAssetIds,
    errors,
  }
}
