import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { sendWelcomeEmail } from "../../lib/email";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, invitedBy, role } = await request.json();
    
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

    return NextResponse.json({ 
      id: user.id, 
      email: user.email, 
      name: user.name,
      invitedBy: invitedBy || null,
      role: role || 'user'
    });
  } catch (error) {
    console.error('Invite error:', error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const invitedBy = searchParams.get('invitedBy');
  
  if (!invitedBy) {
    return NextResponse.json({ error: "Missing invitedBy parameter" }, { status: 400 });
  }

  const users = await prisma.user.findMany({
    take: 100
  });

  return NextResponse.json({ users });
}
