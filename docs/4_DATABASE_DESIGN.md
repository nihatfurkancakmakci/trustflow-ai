# Database Design

## 1. Overview
The database uses PostgreSQL with Prisma ORM. It stores off-chain data, while cryptographic proofs reside on the Stellar blockchain.

## 2. Core Entities

### User
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key |
| walletAddress | String | Unique Stellar Public Key |
| role | Enum | CLIENT, FREELANCER |
| trustScore | Int | 0-100 score |
| createdAt | DateTime | |

### Project
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key |
| clientId | UUID | Foreign Key -> User |
| freelancerId | UUID | Foreign Key -> User (Nullable initially) |
| status | Enum | DRAFT, IN_PROGRESS, COMPLETED... |
| createdAt | DateTime | |

### ContractVersion
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key |
| projectId | UUID | Foreign Key -> Project |
| versionNumber | Int | 1, 2, 3... |
| content | JSON | Structured contract details |
| hash | String | SHA-256 hash of content |
| blockchainTxId| String | Stellar Transaction ID |
| status | Enum | PENDING, APPROVED, REJECTED |
| authorId | UUID | Foreign Key -> User |
| createdAt | DateTime | |

### Escrow
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key |
| projectId | UUID | Foreign Key -> Project |
| amount | Decimal | USDC amount |
| status | Enum | PENDING, FUNDED, RELEASED, REFUNDED |
| smartContractId| String | On-chain ID |

### Delivery
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key |
| projectId | UUID | Foreign Key -> Project |
| contractVersionId| UUID | Contract version evaluated against |
| url | String | Repo or asset link |
| aiReport | JSON | AI generated review report |
| status | Enum | SUBMITTED, APPROVED, REJECTED, DISPUTED |

### Dispute
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key |
| projectId | UUID | Foreign Key -> Project |
| deliveryId | UUID | Foreign Key -> Delivery |
| aiEvidenceReport| JSON | AI analysis of the dispute |
| resolution | String | Outcome details |
