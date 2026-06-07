<div align="center">
<br />
<img src="../client/public/logo.png" width="120" alt="Patent Hash Logo" />

# 📜 Patent Hash - Backend

### **Decentralized Patent Verification on Base Blockchain**

[![Node.js](https://img.shields.io/badge/Node.js-20.16.11-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Base](https://img.shields.io/badge/Base-Sepolia-0052FF?style=for-the-badge&logo=coinbase&logoColor=white)](https://base.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

**Patent Hash** is a decentralized platform for intellectual property protection. This backend handles patent submissions, blockchain interactions via smart contracts on Base, user authentication, and AI-powered insights.

[🚀 Live Demo](https://patenthash.com) • [📖 Documentation](../STRUCTURE.md) • [✨ Frontend Repo](../client)

</div>

---

## 🌟 Overview

This is the **backend API** for Patent Hash, providing RESTful endpoints for patent management, blockchain registration, and secure user data management.

### ✨ Key Features

- 🔐 **Secure Authentication** - Passport.js with session management
- ⛓️ **Base Integration** - Smart contract interaction via Ethers.js
- 🗄️ **PostgreSQL Database** - Reliable data persistence with Drizzle ORM
- 📄 **File Management** - Secure document upload and SHA-256 hashing
- 🤖 **AI Integration** - Google Gemini AI for patent analysis and insights
- 🚀 **Performance** - Built with TypeScript and optimized with esbuild

---

## 💡 How it Works

Patent Hash ensures your ideas are protected by creating an immutable record of your work.

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant Base
    
    User->>Frontend: Upload Patent
    Frontend->>API: Submit Details + Document
    API->>API: Generate SHA-256 Hash
    API->>Base: Register Hash with Smart Contract
    Base-->>API: TX Hash + Receipt
    API->>API: Save Metadata to Database
    API-->>User: Verification Certificate
```

1. **Hashing**: Every patent document is hashed locally and on the server to ensure integrity.
2. **On-Chain Registration**: The hash and owner's wallet address are recorded in a smart contract on the **Base** blockchain.
3. **Immutability**: Once registered, the proof of existence is permanent and globally verifiable.

---

## 🚀 Getting Started

### 📋 Prerequisites

- **Node.js** (v18+)
- **Postgres** Database
- **Base Sepolia RPC URL** (from Alchemy, Infura, or QuickNode)
- **Private Key** for the operator wallet

### 📥 Installation & Setup

1️⃣ **Install dependencies**
```bash
npm install
```

2️⃣ **Configure environment**
Create a `.env` file based on `.env.example`:
```env
PORT=5000
DATABASE_URL=postgresql://user:pass@localhost:5432/patent_hash
SESSION_SECRET=your_secret
BASE_SEPOLIA_RPC_URL=your_rpc_url
PRIVATE_KEY=your_operator_private_key
CONTRACT_ADDRESS=your_deployed_contract_address
```

3️⃣ **Initialize database**
```bash
npm run db:push
```

4️⃣ **Start server**
```bash
npm run dev
```

---

## 📂 Project Structure

```
server/
├── routes.ts           # API route definitions
├── auth.ts             # Passport.js configuration
├── db.ts               # Database connection
├── storage.ts          # Storage implementation (Local/DB)
├── 📁 models/          # Drizzle schema and TS types
├── 📁 controllers/     # Request handlers
├── 📁 services/        # Business logic (Blockchain, AI)
└── 📁 utils/           # Shared helpers
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Create a new account |
| `POST` | `/api/patents` | Register a new patent (On-chain) |
| `GET`  | `/api/patents` | List all your patents |
| `GET`  | `/api/verify/:id` | Verify patent integrity |
| `GET`  | `/api/dashboard/stats` | Get portfolio insights |

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📝 License

Distributed under the **MIT License**. See `LICENSE` for more information.

<div align="center">
Made with ❤️ on Base
</div>
