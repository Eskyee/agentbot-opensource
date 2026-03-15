import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sendWelcomeEmail } from "@/lib/email/welcome";
import { prisma } from "@/app/lib/prisma";
import { isRateLimited, getClientIP } from "@/app/lib/security-middleware";
import { alertNewUser } from "@/app/lib/alerts";

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  if (await isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { email, password, name, referralCode } = await request.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "User already exists" }, { status: 409 });
  }
  const hashed = await bcrypt.hash(password, 10);
  
  const user = await prisma.user.create({
    data: {
      email,
      password: hashed,
      name: name || email,
    },
  });

  // Handle referral
  if (referralCode) {
    const referrer = await prisma.user.findUnique({
      where: { referralCode: referralCode.toUpperCase() },
    });

    if (referrer && referrer.id !== user.id) {
      // Create referral record
      await prisma.referral.create({
        data: {
          referrerId: referrer.id,
          referredId: user.id,
          referralCode: referralCode.toUpperCase(),
          discountApplied: true,
        },
      });

      // Give new user £10 discount credit
      await prisma.user.update({
        where: { id: user.id },
        data: { referralCredits: { increment: 10 } },
      });

      // Give referrer £10 credit
      await prisma.user.update({
        where: { id: referrer.id },
        data: { referralCredits: { increment: 10 } },
      });
    }
  }

  sendWelcomeEmail(email, user.name || 'there').catch(console.error);
  alertNewUser(email, 'email').catch(() => {});

  return NextResponse.json({ id: user.id, email: user.email, name: user.name });
}
