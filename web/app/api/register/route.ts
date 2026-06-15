import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sendWelcomeEmail } from '@/app/lib/email'
import { prisma } from "@/app/lib/prisma";
import { isRateLimited, getClientIP } from "@/app/lib/security-middleware";
import { alertNewUser } from "@/app/lib/alerts";
import { checkPasswordPolicy, isPasswordPwned } from "@/lib/password-policy";
import { createUserSession, attachSessionCookie } from '@/app/lib/session';

export async function POST(request: NextRequest) {
  // BotID protection
  try {
    const { checkBotId } = await import('botid/server')
    const { isBot } = await checkBotId()
    if (isBot) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }
  } catch (e) {
    // BotID not configured - continue in dev
  }

  const ip = getClientIP(request);
  if (await isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { email, password, name, referralCode } = await request.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
  }
  const policy = checkPasswordPolicy(password);
  if (!policy.ok) {
    return NextResponse.json({ error: policy.error }, { status: 400 });
  }
  if (await isPasswordPwned(password)) {
    return NextResponse.json(
      { error: "This password has appeared in a known data breach. Please choose another." },
      { status: 400 },
    );
  }
  if (referralCode && (referralCode.length > 20 || !/^[a-zA-Z0-9-]+$/.test(referralCode))) {
    return NextResponse.json({ error: "Invalid referral code" }, { status: 400 });
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "User already exists" }, { status: 409 });
  }
  const hashed = await bcrypt.hash(password, 12);
  
  const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now

  const user = await prisma.user.create({
    data: {
      email,
      password: hashed,
      name: name || email,
      trialEndsAt,
    },
  });

  // Handle referral
  if (referralCode) {
    const referrer = await prisma.user.findUnique({
      where: { referralCode: referralCode.toUpperCase() },
    });

    if (referrer && referrer.id !== user.id) {
      // Atomic: referral record + both credit grants succeed or fail together
      await prisma.$transaction([
        prisma.referral.create({
          data: {
            referrerId: referrer.id,
            referredId: user.id,
            referralCode: referralCode.toUpperCase(),
            discountApplied: true,
          },
        }),
        prisma.user.update({
          where: { id: user.id },
          data: { referralCredits: { increment: 10 } },
        }),
        prisma.user.update({
          where: { id: referrer.id },
          data: { referralCredits: { increment: 10 } },
        }),
      ]);
    }
  }

  sendWelcomeEmail(email, user.name || 'there').catch(console.error);
  alertNewUser(email, 'email').catch((err) => console.error('[Register] alertNewUser failed:', err));

  // Auto-login after signup — no redirect to login page
  const sessionToken = await createUserSession(user.id);
  const response = NextResponse.json({ id: user.id, email: user.email, name: user.name });
  attachSessionCookie(response, sessionToken);
  return response;
}
