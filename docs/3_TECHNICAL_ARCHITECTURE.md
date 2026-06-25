# Technical Architecture

## 1. System Overview
TrustFlow AI follows a modern, decoupled architecture leveraging Web3 and AI infrastructure.

## 2. High-Level Components
### 2.1 Frontend (Client Layer)
- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS, Shadcn UI
- **Wallet Integration**: Stellar SDK / Freighter integration for Web3 Auth

### 2.2 Backend (Application Layer)
- **Framework**: NestJS
- **Language**: TypeScript
- **Responsibilities**: 
  - Business logic and state management.
  - Interacting with the AI models.
  - Interacting with the Stellar network.

### 2.3 Database (Data Layer)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Data Stored**: Users, Projects, Contract text (off-chain), Deliverables, AI Reports.

### 2.4 Blockchain Layer
- **Network**: Stellar / Soroban
- **Purpose**: Immutability, Proof of Agreement, and Escrow (USDC).
- **Data Stored**: Contract SHA-256 hashes, timestamps, Escrow balances, and states.

### 2.5 AI Layer
- **Provider**: Google Gemini API (Free Tier) or Groq (Llama-3) / Ollama (Local)
- **Use Cases**:
  - Contract structuring (parsing natural language to JSON/Markdown).
  - Delivery verification (analyzing code/text against requirements).
  - Dispute resolution (generating objective summary reports).

## 3. Architecture Diagram (Conceptual)
```text
[ Web Frontend (Next.js) ] <--> [ Wallet (Freighter) ]
          |
     REST / GraphQL API
          |
[ Backend API (NestJS) ] ----> [ OpenAI API ]
          |
   +------+------+
   |             |
[ PostgreSQL ] [ Stellar Network / Soroban ]
(Prisma ORM)   (Smart Contracts / Escrow)
```

## 4. Key Architectural Decisions
- **Off-chain Storage for Contracts**: Full contract text is stored in PostgreSQL to save gas and maintain privacy. Only the SHA-256 hash is stored on Stellar to prove the contract existed at a specific time and was untampered.
- **NestJS for Backend**: Enforces strict architecture, dependency injection, and scalable modularity required for handling complex financial and AI workflows.
- **Free Tier AI for Review**: AI logic is kept external. The backend acts as a prompt orchestrator, managing context windows and parsing AI JSON responses using free APIs (Gemini/Groq) or local models (Ollama).
