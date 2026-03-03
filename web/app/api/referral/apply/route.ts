import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(request: NextRequest) {
  const { referralCode, userId } = await request.json();

  if (!referralCode || !userId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Find the referrer
  const referrer = await prisma.user.findUnique({
    where: { referralCode: referralCode.toUpperCase() },
  });

  if (!referrer) {
    return NextResponse.json({ error: "Invalid referral code" }, { status: 404 });
  }

  if (referrer.id === userId) {
    return NextResponse.json({ error: "Cannot refer yourself" }, { status: 400 });
  }

  // Create referral record
  await prisma.referral.create({
    data: {
      referrerId: referrer.id,
      referredId: userId,
      referralCode: referralCode.toUpperCase(),
    },
  });

  // Give new user £10 discount (store in subscriptionCredits or similar)
  await prisma.user.update({
    where: { id: userId },
    data: { referralCredits: { increment: 10 } },
  });

  return NextResponse.json({ success: true, discount: 10 });
}
