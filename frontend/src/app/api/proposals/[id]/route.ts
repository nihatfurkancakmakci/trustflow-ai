import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(request: NextRequest, context: { params: any }) {
  try {
    const data = await request.json();
    
    // Determine the dbId
    let dbId = data.id;
    if (!dbId) {
      if (!data.jobId) {
        return NextResponse.json({ success: false, error: "Missing both id and jobId" }, { status: 400 });
      }
      
      const existing = await prisma.proposal.findFirst({
        where: { jobId: data.jobId },
        orderBy: { createdAt: "desc" }
      });
      
      if (existing) {
        dbId = existing.id;
      } else {
        return NextResponse.json({ success: false, error: "Proposal not found for this jobId" }, { status: 404 });
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
