import { proxyBitcoinRequest } from '@/app/api/bitcoin/lib/backend'

export const dynamic = 'force-dynamic'

export async function GET() {
  return proxyBitcoinRequest('/api/underground/bitcoin/backend/info')
}
