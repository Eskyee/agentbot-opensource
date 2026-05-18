import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from "@/app/lib/prisma";
import bcrypt from "bcryptjs";
import { checkUserRateLimit } from "@/lib/rate-limit-user";
import { checkPasswordPolicy, isPasswordPwned } from "@/lib/password-policy";


export async function POST(request: NextRequest) {
  const session = await getAuthSession();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const rl = await checkUserRateLimit('pwd', session.user.id, 5, 3600);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many password change attempts. Try again later." },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }

  const { currentPassword, newPassword } = await request.json();

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Current and new password required" }, { status: 400 });
  }

  const policy = checkPasswordPolicy(newPassword);
  if (!policy.ok) {
    return NextResponse.json({ error: policy.error }, { status: 400 });
  }

  if (await isPasswordPwned(newPassword)) {
    return NextResponse.json(
      { error: "This password has appeared in a known data breach. Please choose another." },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (user.password) {
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
    }
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { email: session.user.email },
    data: { password: hashed },
  });

  return NextResponse.json({ success: true });
}
