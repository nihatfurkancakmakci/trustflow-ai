import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(request: NextRequest, context: { params: any }) {
  try {
    // Await params for Next.js 14+ compatibility
    const resolvedParams = await context.params;
    const idOrJobId = resolvedParams.id;
    const data = await request.json();
    
    // Check if the idOrJobId is a CUID (Prisma default is 25 chars, starts with 'c')
    // If not, we assume it's a jobId and we need to find the proposal first
    let dbId = idOrJobId;
    if (!idOrJobId.startsWith('c') && idOrJobId.length !== 25) {
      const existing = await prisma.proposal.findFirst({
        where: { jobId: idOrJobId },
        orderBy: { createdAt: "desc" }
      });
      if (existing) {
        dbId = existing.id;
      } else {
        return NextResponse.json({ success: false, error: "Proposal not found" }, { status: 404 });
      }
    }
    
    // We only update the fields that can change during negotiation/escrow
    const updatedProposal = await prisma.proposal.update({
      where: { id: dbId },
      data: {
        status: data.status,
        paymentAsset: data.paymentAsset,
        timeLocks: data.timeLocks,
        revisions: data.revisions,
        milestones: data.milestones,
      }
    });

    return NextResponse.json({ success: true, proposal: updatedProposal });
  } catch (error) {
    console.error("Error updating proposal:", error);
    return NextResponse.json({ success: false, error: "Failed to update proposal" }, { status: 500 });
  }
}
