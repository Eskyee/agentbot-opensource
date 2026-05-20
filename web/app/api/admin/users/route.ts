import { NextResponse } from 'next/server';
import { getAuthSession } from '@/app/lib/getAuthSession'
import { isAdminEmail } from '@/app/lib/admin'
import { prisma } from '@/app/lib/prisma';


// GET - List all users
export async function GET() {
  try {
    const session = await getAuthSession();

    if (!isAdminEmail(session?.user?.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        role: true,
        image: true,
        plan: true,
        subscriptionStatus: true,
        subscriptionEndDate: true,
        storageLimit: true,
        openclawInstanceId: true,
      },
      orderBy: {
        email: 'asc',
      },
    });

    // Enrich with admin status and agent count
    const enriched = await Promise.all(users.map(async (u) => {
      const agentCount = await prisma.agent.count({ where: { userId: u.id } });
      return {
        ...u,
        isAdmin: isAdminEmail(u.email),
        agentCount,
      };
    }));

    return NextResponse.json({ users: enriched });
  } catch (error) {
    console.error('Admin API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a user
export async function DELETE(request: Request) {
  try {
    const session = await getAuthSession();

    if (!isAdminEmail(session?.user?.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Prevent deleting yourself
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, role: true },
    });

    if (userToDelete?.email && userToDelete.email === session?.user?.email) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
    }

    // Prevent deleting other admins
    if (userToDelete?.role === 'admin') {
      return NextResponse.json({ error: 'Cannot delete admin users' }, { status: 400 });
    }

    // Delete user and all related data
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
