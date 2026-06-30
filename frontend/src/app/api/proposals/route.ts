import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const proposals = await prisma.proposal.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, proposals });
  } catch (error) {
    console.error("Error fetching proposals:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch proposals" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Ensure the freelancer user exists (fallback if they logged in but their row wasn't created)
    let user = await prisma.user.findUnique({
      where: { walletAddress: data.freelancerAddress }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          walletAddress: data.freelancerAddress,
          role: "freelancer",
          firstName: "Unknown",
          lastName: "User",
          email: `${data.freelancerAddress}@trustflow.local`,
        }
      });
    }

    const proposal = await prisma.proposal.create({
      data: {
        jobId: data.jobId,
        freelancerAddress: data.freelancerAddress,
        status: data.status,
        hashAnchor: data.hashAnchor,
        paymentAsset: data.paymentAsset,
        milestones: data.milestones,
        timeLocks: data.timeLocks,
        acceptanceCriteria: data.acceptanceCriteria,
        revisions: data.revisions,
        reporting: data.reporting,
        escrowInit: data.escrowInit,
        arbitration: data.arbitration,
        killSwitch: data.killSwitch,
        ghostingClause: data.ghostingClause,
        hostageClause: data.hostageClause,
      }
    });

    return NextResponse.json({ success: true, proposal });
  } catch (error) {
    console.error("Error creating proposal:", error);
    return NextResponse.json({ success: false, error: "Failed to create proposal" }, { status: 500 });
  }
}
