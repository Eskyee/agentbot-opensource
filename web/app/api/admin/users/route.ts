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
      take: 1000,
    });

    // Single aggregate query for agent counts (avoids N+1)
    const agentCounts = await prisma.agent.groupBy({
      by: ['userId'],
      _count: { id: true },
    });
    const countMap = new Map(agentCounts.map(a => [a.userId, a._count.id]));

    const enriched = users.map(u => ({
      ...u,
      isAdmin: isAdminEmail(u.email),
      agentCount: countMap.get(u.id) ?? 0,
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
