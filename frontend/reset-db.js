const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Starting DB reset...");
  
  // 1. Delete all job-related data
  await prisma.proposal.deleteMany({});
  await prisma.job.deleteMany({});

  console.log("Old jobs and proposals deleted.");

  // 2. Ensure a dummy client exists
  const dummyClientAddress = "G_DUMMY_CLIENT_999";
  
  await prisma.user.upsert({
    where: { walletAddress: dummyClientAddress },
    update: {},
    create: {
      walletAddress: dummyClientAddress,
      role: "client",
      firstName: "Alice",
      lastName: "Crypto",
      title: "DeFi Project Lead",
      bio: "Building next-gen DeFi protocols",
      skills: [],
      hourlyRate: null
    }
  });

  // 3. Create fresh mock jobs
  await prisma.job.create({
    data: {
      title: "Soroban AMM Smart Contract Development",
      description: "Develop a constant-product AMM in Rust using soroban-sdk. Needs full test coverage.",
      budget: 12000,
      industry: "Smart Contract / Web3",
      status: "open",
      category: "Smart Contract / Web3",
      scope: "Develop a constant-product AMM in Rust using soroban-sdk. Needs full test coverage.",
      budgetRange: "8,000 - 12,000",
      paymentAsset: "USDC (Stellar)",
      timelineAmount: "30",
      timelineUnit: "Days",
      expectedRevisions: "1 Round of Revisions",
      expertise: "Rust, Soroban, DeFi",
      escrowType: "Milestone-Based Escrow",
      disputePref: "TrustFlow Platform Oracle",
      penaltyPref: "Hard Deadline (Auto-Terminate)",
      ghostingTimelock: "7 Days",
      hostageTimelock: "14 Days",
      client: { connect: { walletAddress: dummyClientAddress } }
    }
  });

  await prisma.job.create({
    data: {
      title: "Frontend Developer for AI Chatbot (Web & Mobile)",
      description: "Need a talented frontend dev to integrate our internal LLM API into a slick, modern React Native and Next.js interface. Must have experience with real-time streaming.",
      budget: 3000,
      industry: "Web Development",
      status: "open",
      category: "Web Development",
      scope: "Frontend architecture and UI implementation",
      budgetRange: "1500-3000",
      paymentAsset: "USDC (Stellar)",
      timelineAmount: "3",
      timelineUnit: "Weeks",
      expectedRevisions: "2 Rounds of Revisions",
      expertise: "React, Next.js, AI APIs",
      escrowType: "Full Escrow (Completion Release)",
      disputePref: "Multi-Sig Consensus",
      penaltyPref: "Hard Deadline (Auto-Terminate)",
      ghostingTimelock: "3 Days",
      hostageTimelock: "7 Days",
      client: { connect: { walletAddress: dummyClientAddress } }
    }
  });

  console.log("Successfully seeded fresh jobs!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
