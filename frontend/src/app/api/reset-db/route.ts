import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // 1. Her şeyi sil
    await prisma.milestone.deleteMany({});
    await prisma.proposal.deleteMany({});
    await prisma.job.deleteMany({});

    // 2. Yeni temiz (null korumalı) örnek işler ekle
    const newJob1 = await prisma.job.create({
      data: {
        title: "Build a Cross-Border Remittance Widget on Soroban",
        description: "Looking for an expert to build a fully compliant, self-hosted cross-border remittance widget using Stellar's SEP-31 and Soroban smart contracts. Must handle strict compliance flows.",
        budget: 4500,
        industry: "DeFi / Web3",
        status: "open",
        category: "Smart Contract / Web3",
        scope: "Full-stack development (Next.js + Rust/Soroban)",
        budgetRange: "3000-5000",
        paymentAsset: "USDC (Stellar)",
        timelineAmount: "2",
        timelineUnit: "Months",
        expectedRevisions: "Unlimited (Until Satisfied)",
        expertise: "Senior (Soroban, React, KYC/AML)",
        escrowType: "Milestone-Based Escrow",
        disputePref: "TrustFlow Platform Oracle",
        penaltyPref: "Fixed Fee Deduction",
        ghostingTimelock: "7 Days",
        hostageTimelock: "14 Days",
        clientId: "GCLIENT1234567890" // Dummy ID
      }
    });

    const newJob2 = await prisma.job.create({
      data: {
        title: "Frontend Developer for AI Chatbot (Web & Mobile)",
        description: "Need a talented frontend dev to integrate our internal LLM API into a slick, modern React Native and Next.js interface. Must have experience with real-time streaming.",
        budget: 2500,
        industry: "AI & Machine Learning",
        status: "open",
        category: "Web Development",
        scope: "Frontend architecture and UI implementation",
        budgetRange: "1500-3000",
        paymentAsset: "USDC (Stellar)",
        timelineAmount: "3",
        timelineUnit: "Weeks",
        expectedRevisions: "2 Rounds of Revisions",
        expertise: "Intermediate (React, Next.js, AI APIs)",
        escrowType: "Full Escrow (Completion Release)",
        disputePref: "Multi-Sig Consensus",
        penaltyPref: "Hard Deadline (Auto-Terminate)",
        ghostingTimelock: "3 Days",
        hostageTimelock: "7 Days",
        clientId: "GCLIENT9876543210"
      }
    });

    return NextResponse.json({ success: true, message: "DB Reset & Seeded successfully", jobs: [newJob1, newJob2] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
