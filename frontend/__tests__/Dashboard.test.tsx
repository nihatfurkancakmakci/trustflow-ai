import { describe, it, expect, vi } from "vitest";
import { localAnalyze } from "../src/app/api/ai-review/route";

// Mock the dependencies of Dashboard to prevent execution errors
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("../hooks/useEscrowContract", () => ({
  useEscrowContract: () => ({
    initEscrow: vi.fn(),
    submitMilestone: vi.fn(),
    approveMilestone: vi.fn(),
    requestRevision: vi.fn(),
    dispute: vi.fn(),
    isTxPending: false,
    txHash: null,
  }),
}));

vi.mock("../hooks/useStellarWallet", () => ({
  useStellarWallet: () => ({
    address: "GDXKJ37SJS6B22T7A67VZ75HPJVIEUVNIX47ZG2FB2RMQQVU2HHGCYSC",
    userProfile: { role: "freelancer", firstName: "Test" },
    isInitializing: false,
    connect: vi.fn(),
    disconnect: vi.fn(),
    sign: vi.fn(),
  }),
}));

describe("TrustFlow AI - Dashboard & AI Review Engine", () => {
  it("should successfully run the local AI fallback analyzer and score the delivery", () => {
    const review = localAnalyze(
      "Soroban AMM Smart Contract Development",
      "Develop a constant-product AMM in Rust using soroban-sdk. Needs full test coverage.",
      "Milestone 1: Implement pool creation",
      "I implemented the pool creation logic in Rust. All unit tests pass, 100% coverage. Deployed live on testnet. Code is at https://github.com/test/amm.",
      "https://github.com/test/amm"
    );

    expect(review.score).toBeGreaterThanOrEqual(75);
    expect(review.recommendation).toBe("APPROVE");
    expect(review.strengths).toContain("Source code repository linked for full transparency");
    expect(review.requirementsCovered).toContain("Code deliverable provided");
  });

  it("should request revision/reject if delivery notes are too brief", () => {
    const review = localAnalyze(
      "Soroban AMM Smart Contract Development",
      "Develop a constant-product AMM in Rust using soroban-sdk. Needs full test coverage.",
      "Milestone 1: Implement pool creation",
      "done",
      ""
    );

    expect(review.score).toBeLessThan(60);
    expect(review.recommendation).toBe("REJECT");
    expect(review.concerns).toContain("Delivery notes are too brief — more detail would help the client understand the work done");
  });
});
