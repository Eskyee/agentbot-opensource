import { NextResponse } from 'next/server';
import { issueWalletNonce } from '@/app/lib/wallet-nonce';

export async function GET() {
  const nonce = await issueWalletNonce();
  return NextResponse.json({ nonce });
}

export async function POST() {
  const nonce = await issueWalletNonce();
  return NextResponse.json({ nonce });
}
