// Wristband gating stub.
// TODO: Wire to Wristband API when platform integration is available.

export async function checkWristband(_userId: string): Promise<{ hasAccess: boolean }> {
  return { hasAccess: false }
}
