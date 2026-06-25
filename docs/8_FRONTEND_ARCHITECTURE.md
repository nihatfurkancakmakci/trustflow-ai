# Frontend Architecture

## 1. Overview
The frontend is built with Next.js (App Router) for SEO, performance, and seamless server-side rendering where necessary.

## 2. Technology Stack
- **Framework**: Next.js 14+
- **Styling**: Tailwind CSS, Shadcn UI components.
- **State Management**: React Query (for API state), Zustand (for local UI state).
- **Web3**: `@stellar/freighter-api` for wallet connections.

## 3. Folder Structure (App Router)
- `/app/layout.tsx`: Main layout, wallet provider.
- `/app/page.tsx`: Landing page.
- `/app/dashboard/`: Protected dashboard for Client/Freelancer.
- `/app/project/[id]/`: Project details, contract viewer, escrow status.
- `/components/ui/`: Shadcn UI generic components.
- `/components/project/`: Domain-specific components (e.g., `ContractVersionDiff`, `EscrowStatusCard`).
- `/lib/api/`: Axios / Fetch wrappers for backend communication.
- `/lib/stellar/`: Utility functions for interacting with Soroban and Freighter.

## 4. Key UI Components
- **Contract Diff Viewer**: A specialized component that highlights changes between V1 and V2 of a contract (similar to GitHub's PR diff view).
- **Escrow Timeline**: A visual stepper showing the current state of the project (Draft -> Funded -> Delivered -> Completed).
- **AI Chat Interface**: For the initial project creation phase where the client talks to the AI to generate the contract.

## 5. Design Aesthetics
- **Theme**: Premium, dark-mode preferred by default.
- **Vibe**: "GitHub meets Stripe". Clean typography, high contrast, subtle micro-animations for interactions.
