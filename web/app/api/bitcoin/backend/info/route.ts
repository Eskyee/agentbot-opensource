import { proxyBitcoinRequest } from '@/app/api/bitcoin/lib/backend'

export const dynamic = 'force-dynamic'

export async function GET() {
  return proxyBitcoinRequest('/api/autonomous/bitcoin/backend/info')
}
