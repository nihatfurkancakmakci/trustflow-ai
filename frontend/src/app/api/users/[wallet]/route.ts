import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ wallet: string }> }) {
  try {
    const { wallet } = await params;
    const user = await prisma.user.findUnique({
      where: { walletAddress: wallet }
    });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    return NextResponse.json(user, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ wallet: string }> }) {
  try {
    const { wallet } = await params;
    const data = await req.json();
    
    const user = await prisma.user.update({
      where: { walletAddress: wallet },
      data: {
        role: data.role,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone || null,
        location: data.location || null,
        bio: data.bio || null,
        skills: data.skills || null,
        website: data.website || null,
      }
    });
    
    return NextResponse.json(user, { status: 200 });
  } catch (error: any) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
