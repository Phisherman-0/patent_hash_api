# Patent Hash Project Structure (Base)

## Overview
Patent Hash is a decentralized patent management system that leverages the **Base** blockchain (Ethereum Layer-2) and AI for intellectual property protection and analysis.

## Core Stack
- **Frontend**: React (Vite), Tailwind CSS, Shadcn UI, Wagmi/RainbowKit
- **Backend**: Node.js, Express, Drizzle ORM (MySQL)
- **Blockchain**: Base (Solidity Smart Contracts)
- **AI**: Google Gemini API

## Project Directory Structure

### `contracts/`
Contains the Solidity smart contracts and Hardhat configuration.
- `PatentSign.sol`: Core contract for registering and signing patent document hashes.
- `hardhat.config.ts`: Network configuration for Base Sepolia and Base Mainnet.

### `server/` (Backend)
- `controllers/`: Request handlers (Patent, Auth, AI, Blockchain).
- `models/`: Drizzle schema definitions (Modularized).
- `services/`: Core logic (AI, IPFS, Blockchain integration).
- `storage.ts`: Database abstraction layer.
- `db.ts`: Database connection & Drizzle initialization.

### `client/` (Frontend)
- `src/context/Web3Provider.tsx`: Wagmi and RainbowKit configuration for Base.
- `src/pages/patents/`: Patent filing, management, and tracking.
- `src/pages/verification/`: Blockchain verification and ownership tools.
- `src/lib/apiService.ts`: Consolidated API client for the backend.

## Blockchain Integration (Base)
Patent document hashes are registered on the **Base** blockchain using the `PatentSign.sol` smart contract. The backend service (`blockchainService.ts`) connects to:
- **Testnet**: Base Sepolia (`chainId: 84532`, RPC: `https://sepolia.base.org`)
- **Mainnet**: Base (`chainId: 8453`, RPC: `https://mainnet.base.org`)

### Workflow:
1. User uploads patent document.
2. Backend calculates SHA-256 hash.
3. Backend calls `PatentSign.registerDocument(bytes32 docHash)` on Base.
4. Transaction hash is stored in the database for verification.

## Environment Variables
Key variables required for the project:
```
DATABASE_URL=...
BASE_SEPOLIA_RPC_URL=...
PRIVATE_KEY=...
CONTRACT_ADDRESS=...
BASESCAN_API_KEY=...
GEMINI_API_KEY=...
```
