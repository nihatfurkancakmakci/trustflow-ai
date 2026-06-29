import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { walletAddress: data.walletAddress }
    });
    
    if (existingUser) {
      return NextResponse.json(existingUser, { status: 200 });
    }
    
    // Create new user
    const newUser = await prisma.user.create({
      data: {
        walletAddress: data.walletAddress,
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
    
    return NextResponse.json(newUser, { status: 201 });
  } catch (error: any) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
