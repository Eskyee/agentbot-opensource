// Guestlist gating stub.
// TODO: Wire to Guestlist API when platform integration is available.

export async function checkGuestlist(_userId: string, _roomId: string): Promise<{ onList: boolean }> {
  return { onList: false }
}
