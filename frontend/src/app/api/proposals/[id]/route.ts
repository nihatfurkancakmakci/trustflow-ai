import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const data = await request.json();
    
    // We only update the fields that can change during negotiation/escrow
    const updatedProposal = await prisma.proposal.update({
      where: { id },
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
