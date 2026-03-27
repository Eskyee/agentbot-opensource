import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from "@/app/lib/prisma";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { referralCode } = await request.json();

  if (!referralCode) {
    return NextResponse.json({ error: "Missing referral code" }, { status: 400 });
  }

  // userId comes from verified session — never from request body
  const userId = session.user.id;

  const referrer = await prisma.user.findUnique({
    where: { referralCode: referralCode.toUpperCase() },
  });

  if (!referrer) {
    return NextResponse.json({ error: "Invalid referral code" }, { status: 404 });
  }

  if (referrer.id === userId) {
    return NextResponse.json({ error: "Cannot refer yourself" }, { status: 400 });
  }

  // Idempotency: check if this referral has already been applied
  const existing = await prisma.referral.findFirst({
    where: { referrerId: referrer.id, referredId: userId },
  });

  if (existing) {
    return NextResponse.json({ error: "Referral already applied" }, { status: 409 });
  }

  await prisma.referral.create({
    data: {
      referrerId: referrer.id,
      referredId: userId,
      referralCode: referralCode.toUpperCase(),
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { referralCredits: { increment: 10 } },
  });

  return NextResponse.json({ success: true, discount: 10 });
}
