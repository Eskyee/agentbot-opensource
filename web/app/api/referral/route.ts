export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from '@/app/lib/auth';
import { prisma } from "@/app/lib/prisma";
import { randomBytes } from "crypto";

function generateReferralCode(): string {
  return randomBytes(4).toString("hex").toUpperCase();
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Generate referral code if doesn't exist
  if (!user.referralCode) {
    const code = generateReferralCode();
    await prisma.user.update({
      where: { id: user.id },
      data: { referralCode: code },
    });
  }

  return NextResponse.json({ 
    referralCode: user.referralCode || generateReferralCode() 
  });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  
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

  const referralCount = user.referrals?.length || 0;
  const creditEarned = referralCount * 10;

  return NextResponse.json({
    referralCode: user.referralCode,
    referralCount,
    creditEarned,
  });
}
