process.env.MUX_TOKEN_ID = 'mux-token-id'
process.env.MUX_TOKEN_SECRET = 'mux-token-secret'

import { deleteMuxAsset, retireMuxLiveStream } from '@/app/lib/basefmMux'

describe('basefmMux', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  test('retires a live stream and deletes recent assets by default', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          data: {
            id: 'stream-1',
            status: 'active',
            recent_asset_ids: ['asset-1', 'asset-2'],
          },
        }),
      })
      .mockResolvedValueOnce({ ok: true, status: 200, text: jest.fn().mockResolvedValue('') })
      .mockResolvedValueOnce({ ok: true, status: 204, text: jest.fn().mockResolvedValue('') })
      .mockResolvedValueOnce({ ok: true, status: 204, text: jest.fn().mockResolvedValue('') })
      .mockResolvedValueOnce({ ok: true, status: 204, text: jest.fn().mockResolvedValue('') })

    const result = await retireMuxLiveStream('stream-1')

    expect(result).toMatchObject({
      ok: true,
      streamId: 'stream-1',
      streamDisabled: true,
      streamDeleted: true,
      deletedAssetIds: ['asset-1', 'asset-2'],
      retainedAssetIds: [],
    })
  })

  test('retires a live stream and keeps archive assets when requested', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          data: {
            id: 'stream-2',
            status: 'active',
            recent_asset_ids: ['asset-keep'],
          },
        }),
      })
      .mockResolvedValueOnce({ ok: true, status: 200, text: jest.fn().mockResolvedValue('') })
      .mockResolvedValueOnce({ ok: true, status: 204, text: jest.fn().mockResolvedValue('') })

    const result = await retireMuxLiveStream('stream-2', { preserveAssets: true })

    expect(result).toMatchObject({
      ok: true,
      streamId: 'stream-2',
      preserveAssets: true,
      deletedAssetIds: [],
      retainedAssetIds: ['asset-keep'],
    })
  })

  test('treats missing assets as already gone', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: jest.fn().mockResolvedValue('not found'),
    })

    const result = await deleteMuxAsset('asset-missing')

    expect(result).toEqual({ ok: true, assetId: 'asset-missing' })
  })
})
