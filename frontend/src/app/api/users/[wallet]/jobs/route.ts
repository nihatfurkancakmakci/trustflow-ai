import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ wallet: string }> }) {
  try {
    const { wallet } = await params;
    
    // Check if user exists and is a client
    const user = await prisma.user.findUnique({
      where: { walletAddress: wallet },
      include: {
        clientJobs: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    if (user.role !== 'client') {
      return NextResponse.json({ error: "User is not a client" }, { status: 400 });
    }
    
    const activeJobs = user.clientJobs.filter(job => job.status === 'open' || job.status === 'in_progress');
    const pastJobs = user.clientJobs.filter(job => job.status === 'completed' || job.status === 'disputed' || job.status === 'cancelled');

    return NextResponse.json({
      activeJobs,
      pastJobs,
      totalActive: activeJobs.length,
      totalPast: pastJobs.length
    }, { status: 200 });
    
  } catch (error: any) {
    console.error("Error fetching client jobs:", error);
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }
}
