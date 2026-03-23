import { NextResponse } from 'next/server';
import { generateNonce } from 'siwe';

export async function GET() {
  const nonce = generateNonce();
  return NextResponse.json({ nonce });
}

export async function POST() {
  const nonce = generateNonce();
  return NextResponse.json({ nonce });
}
