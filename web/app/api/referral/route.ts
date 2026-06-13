import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from "@/app/lib/prisma";
import { randomBytes } from "crypto";


function generateReferralCode(): string {
  return randomBytes(4).toString("hex").toUpperCase();
}

export async function POST(request: NextRequest) {
  const session = await getAuthSession();
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Generate + persist a referral code if the user doesn't have one,
  // and return the SAME code we persisted (not a fresh random one).
  let referralCode = user.referralCode;
  if (!referralCode) {
    referralCode = generateReferralCode();
    await prisma.user.update({
      where: { id: user.id },
      data: { referralCode },
    });
  }

  return NextResponse.json({ referralCode });
}

export async function GET() {
  const session = await getAuthSession();
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      referrals: {
        include: {
          referred: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Ensure the user always has a referral code so the link is never empty.
  let referralCode = user.referralCode;
  if (!referralCode) {
    referralCode = generateReferralCode();
    await prisma.user.update({
      where: { id: user.id },
      data: { referralCode },
    });
  }

  const referralCount = user.referrals?.length || 0;
  const creditEarned = referralCount * 10;

  return NextResponse.json({
    referralCode,
    referralCount,
    creditEarned,
  });
}
