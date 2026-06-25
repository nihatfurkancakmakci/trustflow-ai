# User Flows

## 1. Client Onboarding & Project Creation
1. Client connects Freighter Wallet.
2. Clicks "Create Project".
3. Enters natural language prompt: "I need a landing page for my SaaS with Stripe integration."
4. System AI processes prompt and returns a structured Contract V1.
5. Client reviews V1.
6. Client shares Project URL with a specific Freelancer.

## 2. Freelancer Onboarding & Negotiation
1. Freelancer receives URL and connects Freighter Wallet.
2. Freelancer reviews Contract V1.
3. Freelancer requests change: "Add $500 for Stripe integration."
4. System AI generates Contract V2.
5. V2 hash is anchored to Stellar.
6. Client approves V2.

## 3. Escrow Funding & Project Start
1. Client clicks "Fund Escrow".
2. Freighter wallet pops up to sign transaction (sending USDC to Soroban contract).
3. Transaction confirmed.
4. Project status changes to `IN_PROGRESS`.

## 4. Delivery & AI Review
1. Freelancer completes work.
2. Freelancer submits GitHub Repo URL.
3. System AI analyzes repo against Contract V2 deliverables.
4. System AI generates Delivery Report (e.g., "95% match, missing dark mode").
5. Client reviews report and work.

## 5. Approval & Payment
1. Client clicks "Approve".
2. Freighter wallet pops up to sign the release transaction.
3. Smart contract releases USDC to Freelancer's wallet.
4. Trust scores updated for both users.
5. Project status changes to `COMPLETED`.

## 6. Dispute Workflow
1. Client clicks "Reject" and provides reason.
2. Freelancer disagrees and clicks "Dispute".
3. System AI generates Dispute Evidence Report analyzing all versions and deliveries.
4. TrustFlow Admin uses the multi-sig to resolve based on evidence (split funds, full refund, or release).
