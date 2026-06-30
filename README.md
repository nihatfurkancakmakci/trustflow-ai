<div align="center">
  <h1>🌟 TrustFlow AI</h1>
  <p><strong>Secure. Fast. Decentralized. The Next-Gen Freelance & Project Operating System powered by Stellar & Soroban.</strong></p>

  <div>
    <img src="https://img.shields.io/badge/Stellar-Testnet-blue?style=for-the-badge&logo=stellar" alt="Stellar" />
    <img src="https://img.shields.io/badge/Soroban-Smart_Contracts-orange?style=for-the-badge&logo=rust" alt="Soroban" />
    <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
  </div>
</div>

<br />

> **🏆 Submission for the Stellar Journey to Mastery Program (Level 3 - Orange Belt)**
> This repository represents the fully realized TrustFlow AI ecosystem. We have implemented advanced Soroban escrow and arbitration contracts, a 4-tier hybrid AI code-auditing engine, live GitHub integration parser, a rating/review system stored in PostgreSQL, a comprehensive test suite (Vitest + Cargo), and a CI/CD pipeline.

---

## 🌌 The Vision
TrustFlow AI bridges the gap between freelancers, clients, and decentralized finance. By combining the transaction speeds of the **Stellar Network** with the power of **Soroban Smart Contracts** and **AI-Assisted Deliverable Auditing**, we ensure payments are only released when milestones are truly completed, preventing hostage-funds and ghosting disputes mathematically.

---

## ✨ Key Features (Level 3 - Orange Belt)

- 🔐 **Stellar & Soroban Escrow**: Milestone funds are locked securely in Soroban on-chain smart accounts and released step-by-step.
- ⚖️ **Soroban Arbitration & Dispute Oracle**: Programmable hooks to handle disputes via platforms, split balances, or oracle decisions.
- 🧠 **4-Tier Hybrid AI Delivery Auditor**: A fallback chain that runs dynamically when milestones are submitted:
  1. *Tier 1: LM Studio (Local)*: Fast Qwen2.5-Coder-7B local processing.
  2. *Tier 2: Groq Cloud (Production)*: Llama 3.3 70B cloud evaluation (~8ms).
  3. *Tier 3: Google Gemini (Backup)*: Gemini 2.0 Flash backup model.
  4. *Tier 4: Offline NLP Analyzer (Fallback)*: Local rule-based offline engine.
- 🐙 **GitHub Metadata Parser**: Submitting a GitHub URL dynamically extracts code additions, deletions, commit logs, and file changes to evaluate code quality against requirements.
- ⭐️ **Interactive Feedback & Reviews**: Star rating (1-5) and text feedback modal displayed in the workroom upon contract completion, instantly synced to PostgreSQL.
- 📱 **Mobile Responsive Design**: Fluid mobile layout with dynamic scanner animations during AI audits.
- 🧪 **Continuous Integration**: `.github/workflows/ci.yml` pipeline validating Cargo tests, Vitest runner, and Next.js builds on every push.

---

## 📜 Deployed Smart Contracts

* **Escrow Contract (Stellar Testnet)**:
  `CAYJUZTTDE3IOSJAH6TA4ZJ4QSAXBT2MKV3RGVOFZCVLE43WYP2ZXFD6`
* **Arbitration Contract (Stellar Testnet)**:
  `C...` (Deployable via workspace cargo build pipeline)

---

## 📸 Interactive Showcase
 
### 1. Job Post Board & Creation
Clients specify milestones, payout asset, late penalties, and dispute resolution oracles to launch the job on the public board.
![Job Posting Board](frontend/public/screenshots/Post_Job_Screen.png)
 
### 2. Secure Workroom & Milestones
Once funded by the client, the contract is locked on-chain. Freelancers log commits and submit deliveries.
![Secure Workroom](frontend/public/screenshots/workroom.png)
 
### 3. Live AI Delivery Audit & Code Review
Our 4-tier hybrid AI engine analyzes code changes via GitHub API, checks requirements, and scores the quality.
![AI Audit Raporu](frontend/public/screenshots/AI_Audit_Report.png)
 
### 4. Freelancer Rating & Reviews
Clients star-rate and comment upon job completion, updating the freelancer's public page.
![Profile and Reviews](frontend/public/screenshots/profile.png)
 
### 5. Automated CI/CD Testing & Pipeline
Automated pipeline verifying both smart contracts and frontend builds on every commit.
![CI/CD Pipeline](frontend/public/screenshots/CI_CD.png)

### 6. Passing Test Suites
Verification of Rust smart contracts and Vitest suites running successfully.
![Test Suites](frontend/public/screenshots/test_ekran%C4%B1.png)

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js (v18+)
- [Freighter Wallet](https://freighter.app/) extension (Set to **Testnet**)
- [Rust & Cargo](https://rustup.rs/) (For smart contract builds)

### Installation & Run

1. **Clone the repository**
   ```bash
   git clone https://github.com/nihatfurkancakmakci/trustflow-ai.git
   cd trustflow-ai
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```

3. **Database Migration**
   Setup your `.env` with your PostgreSQL database URL, then run:
   ```bash
   npx prisma db push
   npx prisma generate
   ```

4. **Ignite Local Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Running Tests

### Frontend Unit Tests (Vitest)
Verify the frontend rendering, mock states, and the AI fallback local scoring engine:
```bash
cd frontend
npx vitest run
```

### Smart Contract Tests (Rust Cargo)
Validate the Soroban smart contract logic, milestone creation, and release/dispute signatures:
```bash
cargo test
```

---

<div align="center">
  <p>Built with 💚 for the Stellar Ecosystem.</p>
</div>
