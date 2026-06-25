# MVP Roadmap

## Phase 1: Foundation (Weeks 1-2)
- Set up monorepo (Next.js + NestJS).
- Configure PostgreSQL and Prisma.
- Implement Wallet Authentication (Freighter + JWT).
- Design basic UI shells and routing.

## Phase 2: AI & Contracts (Weeks 3-4)
- Integrate Free AI Provider (Gemini API or Groq).
- Implement Contract Generation flow (Prompt -> JSON -> Markdown).
- Implement Versioning System and DB schema.
- Integrate Stellar SDK to hash and anchor contract versions on Testnet.

## Phase 3: Smart Escrow (Weeks 5-6)
- Write Soroban Smart Contract in Rust.
- Deploy to Stellar Testnet.
- Build frontend flows for "Deposit", "Release", and "Refund".
- Link backend states to blockchain events.

## Phase 4: Delivery & Review (Weeks 7-8)
- Build URL/GitHub repo parsing in the backend.
- Implement AI Delivery Review logic.
- Create UI for Delivery Submission and Review Reports.
- Build Dispute flagging system.

## Phase 5: Polish & Launch (Weeks 9-10)
- Trust score calculation engine.
- End-to-end testing (Unit + E2E with Cypress/Playwright).
- Security audits on smart contract and API endpoints.
- Deploy to Production (Mainnet).
