import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { walletAddress } = await req.json();
    
    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet address required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { walletAddress }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create a dummy user
    const dummyId = `dummy_${Date.now()}`;
    const dummyUser = await prisma.user.create({
      data: {
        walletAddress: dummyId,
        role: user.role === 'client' ? 'freelancer' : 'client',
        firstName: "Alice",
        lastName: "Web3",
        email: `alice${Date.now()}@example.com`,
      }
    });

    // Create a dummy job
    const job = await prisma.job.create({
      data: {
        title: "DeFi Smart Contract Audit & Optimization",
        description: "Auditing a Soroban AMM contract.",
        budget: 5000,
        industry: "DeFi & Smart Contracts",
        status: "completed",
        clientId: user.role === 'client' ? user.walletAddress : dummyUser.walletAddress,
        freelancerId: user.role === 'freelancer' ? user.walletAddress : dummyUser.walletAddress,
      }
    });

    // Create a review
    const review = await prisma.review.create({
      data: {
        rating: 5,
        comment: "Outstanding work! Delivered the smart contract audit ahead of schedule. The Soroban optimizations saved us a lot of state rent.",
        jobId: job.id,
        reviewerId: dummyUser.walletAddress, // dummy reviews the user
        revieweeId: user.walletAddress
      }
    });

    // Create another dummy job & review just to have 2
    const dummyUser2 = await prisma.user.create({
      data: {
        walletAddress: `dummy_${Date.now()}_2`,
        role: user.role === 'client' ? 'freelancer' : 'client',
        firstName: "Bob",
        lastName: "Builder",
        email: `bob${Date.now()}@example.com`,
      }
    });

    const job2 = await prisma.job.create({
      data: {
        title: "NFT Marketplace Escrow Module",
        description: "Soroban smart contract for NFT trades.",
        budget: 3500,
        industry: "NFT & Gaming",
        status: "completed",
        clientId: user.role === 'client' ? user.walletAddress : dummyUser2.walletAddress,
        freelancerId: user.role === 'freelancer' ? user.walletAddress : dummyUser2.walletAddress,
      }
    });

    const review2 = await prisma.review.create({
      data: {
        rating: 4,
        comment: "Great communication and solid code. Only docked one star because of a slight delay in the milestone, but overall fantastic.",
        jobId: job2.id,
        reviewerId: dummyUser2.walletAddress,
        revieweeId: user.walletAddress
      }
    });

    return NextResponse.json({ success: true, reviews: [review, review2] }, { status: 201 });
  } catch (error: any) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Failed to seed data" }, { status: 500 });
  }
}
