import { proxyBitcoinRequest } from '@/app/api/bitcoin/lib/backend'


export async function GET() {
  return proxyBitcoinRequest('/api/underground/bitcoin/backend/info')
}
