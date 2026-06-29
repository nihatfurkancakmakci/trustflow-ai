import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ wallet: string }> }) {
  try {
    const { wallet } = await params;
    
    const user = await prisma.user.findUnique({
      where: { walletAddress: wallet },
      include: {
        reviewsReceived: {
          include: {
            reviewer: {
              select: {
                firstName: true,
                lastName: true,
                walletAddress: true,
                role: true
              }
            },
            job: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    const reviews = user.reviewsReceived;
    const averageRating = reviews.length > 0 
      ? reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length 
      : 0;

    return NextResponse.json({
      reviews,
      averageRating,
      totalReviews: reviews.length
    }, { status: 200 });
    
  } catch (error: any) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}
