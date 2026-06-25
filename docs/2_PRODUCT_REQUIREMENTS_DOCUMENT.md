# Product Requirements Document (PRD)

## 1. Introduction
This document defines the functional and non-functional requirements for the TrustFlow AI MVP.

## 2. User Personas
### 2.1 The Client
- **Needs**: Security for funds, guarantee of delivery, clear scope management.
- **Pain Points**: Freelancers disappearing, poor quality work, scope misunderstandings.
### 2.2 The Freelancer
- **Needs**: Guarantee of payment, protection against scope creep, fair dispute resolution.
- **Pain Points**: Non-paying clients, endless revisions, ambiguous requirements.

## 3. Core MVP Features
### 3.1 Wallet Authentication
- Web3 wallet integration (Stellar compatible, e.g., Freighter) for login and identity verification.
- User profile creation linked to wallet address.

### 3.2 AI Contract Generation & Versioning
- **Input**: Natural language prompt describing the project.
- **Output**: Structured contract (Deliverables, Milestones, Timeline, Budget, Acceptance Criteria).
- **Versioning**: Every modification creates a new immutable version (V1, V2, V3...).

### 3.3 Blockchain Anchoring (Stellar)
- SHA-256 hash generation for every contract version.
- On-chain storage of contract hashes using Stellar (for auditability and immutability).

### 3.4 Smart Escrow Management
- Escrow states: `DRAFT`, `NEGOTIATING`, `APPROVED`, `FUNDED`, `IN_PROGRESS`, `DELIVERED`, `UNDER_REVIEW`, `COMPLETED`, `DISPUTED`, `CANCELLED`.
- Funding mechanisms via USDC on the Stellar network.

### 3.5 AI Delivery Review
- Ability for freelancers to submit URLs, GitHub repos, or file archives.
- AI comparison of submitted work against the latest contract version.
- Output: Completion percentage, missing items, and evidence report.

### 3.6 Trust Score System
- Dynamic scoring algorithm (0-100).
- Automatic updates post-project based on delivery timeliness, dispute occurrence, and AI review scores.

## 4. Out of Scope for MVP
- Freelancer discovery/Marketplace features.
- In-app messaging or video calls.
- DAO or governance features.
- NFT minting.

## 5. Non-Functional Requirements
- **Performance**: Contract generation under 10 seconds. AI review under 30 seconds.
- **Security**: Secure handling of escrow state, prevention of unauthorized contract modifications.
- **Reliability**: Fallbacks for AI API timeouts or Blockchain network congestion.
