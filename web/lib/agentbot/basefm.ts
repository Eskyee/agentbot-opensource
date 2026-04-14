// baseFM adapter stub.
// TODO: Wire to baseFM live-room API when integration is available.

export interface LiveRoomMeta {
  roomId: string
  title: string
  isLive: boolean
  listenerCount: number
}

export async function getLiveRoomMeta(roomId: string): Promise<LiveRoomMeta> {
  return {
    roomId,
    title: roomId === 'colony' ? 'Live Colony Room' : `Room: ${roomId}`,
    isLive: false,
    listenerCount: 0,
  }
}
