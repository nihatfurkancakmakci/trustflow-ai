# AI System Design

## 1. Overview
The AI system is powered by free-tier AI APIs (such as Google Gemini 1.5 Flash or Groq Llama-3) and acts as the structural brain of TrustFlow AI. It performs three main tasks: Contract Generation, Delivery Verification, and Dispute Assistance.

## 2. AI Contract Generator
- **Goal**: Convert natural language intent into a structured, enforceable format.
- **System Prompt Context**: "You are an expert legal and technical project manager. Convert the user's project description into a structured JSON contract containing: deliverables, milestones, budget, deadline, and acceptance criteria."
- **Input**: User prompt + any previous contract version history.
- **Output Validation**: Backend verifies the response matches a strict JSON Schema before saving to DB.

## 3. AI Delivery Review
- **Goal**: Objectively compare submitted work against the approved contract version.
- **Mechanism**:
  - If a GitHub URL is provided, the backend fetches the commit tree/README/code snippets.
  - The AI is prompted with the Contract Acceptance Criteria and the fetched Delivery Data.
- **Output**: JSON object containing:
  - `completionPercentage`: 0-100.
  - `missingDeliverables`: Array of strings.
  - `evidenceReport`: Detailed markdown explanation.

## 4. AI Dispute Assistant
- **Goal**: Provide neutral, evidence-based recommendations during conflicts.
- **Input Context**:
  - Full history of contract versions.
  - Chat logs / Revision requests.
  - AI Delivery Review reports.
- **Output**: A comprehensive summary of what was promised vs. what was delivered, highlighting areas where scope creep occurred or requirements were missed. It does NOT make the final financial decision, but provides the undeniable facts.
