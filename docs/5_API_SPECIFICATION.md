# API Specification

## 1. Overview
The backend provides a RESTful API built with NestJS to serve the Next.js frontend. All endpoints require authentication via a signed message from a Stellar wallet (JWT token).

## 2. Authentication Endpoints
- `POST /api/v1/auth/nonce`: Get a unique nonce to sign.
- `POST /api/v1/auth/verify`: Verify the signed nonce and return a JWT.

## 3. Project Endpoints
- `POST /api/v1/projects`: Create a new project.
  - Body: `{ description: string, clientId: UUID }`
- `GET /api/v1/projects/:id`: Get project details.
- `GET /api/v1/projects`: List projects for the authenticated user.

## 4. Contract Versioning Endpoints
- `POST /api/v1/contracts`: Generate a new contract version using AI.
  - Body: `{ projectId: UUID, prompt: string }`
- `GET /api/v1/contracts/:projectId`: Get version history for a project.
- `POST /api/v1/contracts/:id/approve`: Approve a specific contract version.

## 5. Escrow Endpoints
- `POST /api/v1/escrow/fund`: Initiate funding (returns XDR for client to sign).
- `GET /api/v1/escrow/:projectId`: Get escrow status.
- `POST /api/v1/escrow/release`: Release funds to freelancer (client only).

## 6. Delivery & Review Endpoints
- `POST /api/v1/deliveries`: Submit work for review.
  - Body: `{ projectId: UUID, url: string }`
- `GET /api/v1/deliveries/:id/report`: Get the AI-generated review report.

## 7. Dispute Endpoints
- `POST /api/v1/disputes`: Open a dispute.
- `GET /api/v1/disputes/:projectId`: Get AI dispute analysis report.
