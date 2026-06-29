import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const freelancerId = searchParams.get("freelancerId");
    
    const whereClause: any = {};
    if (clientId) whereClause.clientId = clientId;
    if (freelancerId) whereClause.freelancerId = freelancerId;

    const jobs = await prisma.job.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc"
      }
    });

    return NextResponse.json(jobs);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title, description, budget, industry, status,
      category, scope, budgetRange, paymentAsset, timelineAmount, timelineUnit,
      expectedRevisions, expertise, escrowType, disputePref, penaltyPref,
      ghostingTimelock, hostageTimelock, clientId
    } = body;

    if (!clientId) {
      return NextResponse.json({ error: "clientId is required" }, { status: 400 });
    }

    const job = await prisma.job.create({
      data: {
        title: title || "Untitled Job",
        description: description || scope || "",
        budget: budget || null,
        industry: industry || category || "Other",
        status: status || "open",
        category,
        scope,
        budgetRange,
        paymentAsset,
        timelineAmount,
        timelineUnit,
        expectedRevisions,
        expertise,
        escrowType,
        disputePref,
        penaltyPref,
        ghostingTimelock,
        hostageTimelock,
        client: {
          connect: { walletAddress: clientId }
        }
      }
    });

    return NextResponse.json(job);
  } catch (error) {
    console.error("Error creating job:", error);
    return NextResponse.json({ error: "Failed to create job" }, { status: 500 });
  }
}
