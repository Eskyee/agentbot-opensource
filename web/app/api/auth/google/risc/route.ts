import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error: 'Deprecated endpoint',
      detail: 'Use /api/security/risc for verified Google RISC events.',
    },
    { status: 410 }
  );
}
