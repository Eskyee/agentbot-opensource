import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { sendWelcomeEmail } from "@/lib/email/welcome";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  const { email, password, name } = await request.json();
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
      password_hash: hashed,
      name: name || email,
    },
  });

  sendWelcomeEmail(email, user.name || 'there').catch(console.error);

  return NextResponse.json({ id: user.id, email: user.email, name: user.name });
}
