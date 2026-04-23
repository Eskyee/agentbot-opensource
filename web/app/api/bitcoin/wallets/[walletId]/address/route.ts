import { proxyBitcoinRequest } from '@/app/api/bitcoin/lib/backend'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ walletId: string }> }
) {
  const { walletId } = await params
  return proxyBitcoinRequest(`/api/underground/bitcoin/wallets/${walletId}/address/unused`)
}
