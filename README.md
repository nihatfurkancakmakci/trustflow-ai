# TrustFlow AI (Level 1 - White Belt)

TrustFlow AI is an AI-powered Project Operating System designed for freelancers and clients. This repository contains the Level 1 submission for the Stellar Journey to Mastery program.

## Project Overview

In this Level 1 (White Belt) submission, we implemented the core foundations of the TrustFlow AI frontend:
- **Wallet Connection**: Integrated `@stellar/freighter-api` to allow users to connect and disconnect their Freighter wallets.
- **Balance Fetching**: Uses the Stellar Horizon Testnet API to fetch and display the user's native XLM balance in real-time.
- **Transactions**: Built a UI that allows users to send XLM on the Stellar Testnet. It provides immediate feedback upon success and displays the transaction hash linking to Stellar Expert.

## Setup Instructions

To run this project locally:

1. Clone the repository:
   ```bash
   git clone https://github.com/nihatfurkancakmakci/trustflow-ai.git
   cd trustflow-ai/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser. Make sure your Freighter wallet is installed and switched to the **Testnet** network.

## Screenshots

*(Note: Replace these placeholder images with actual screenshots before submitting)*

### Wallet Connected & Balance Displayed
![Wallet Connected](./frontend/public/screenshots/wallet-connected.png)

### Successful Testnet Transaction
![Transaction Success](./frontend/public/screenshots/tx-success.png)
