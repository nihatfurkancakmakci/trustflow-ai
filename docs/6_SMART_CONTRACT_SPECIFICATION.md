# Smart Contract Specification

## 1. Overview
TrustFlow AI utilizes Stellar and Soroban smart contracts for two primary functions: Contract Hash Anchoring and Escrow Management.

## 2. Contract Anchoring (Immutability)
We do not store the full contract text on-chain due to privacy and cost.
- **Process**: Upon creation of Contract Version X, the backend generates a SHA-256 hash of the JSON content.
- **On-Chain Action**: A simple Soroban contract stores the hash mapping: `(ProjectID, VersionNumber) -> Hash`.
- **Validation**: Any party can take the off-chain contract text, hash it, and verify it matches the on-chain hash.

## 3. Escrow Management (Soroban)
- **Asset**: USDC (Stellar native USDC).
- **Functions**:
  - `deposit(client: Address, freelancer: Address, amount: i128)`: Locks funds in the contract.
  - `release(client: Address)`: Client signs to release funds to the freelancer.
  - `refund(freelancer: Address)`: Freelancer signs to refund the client.
  - `resolve_dispute(admin: Address, outcome: Map)`: In case of dispute, the TrustFlow multi-sig admin can distribute funds based on the AI resolution outcome.

## 4. Security Considerations
- The smart contract must not allow funds to be released without the explicit cryptographic signature of the Client (or Admin during a dispute).
- No upgradability for active escrows to prevent malicious modifications of locked funds.
