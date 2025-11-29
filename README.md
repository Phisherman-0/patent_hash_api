<div align="center">

# 📜 Patent Hash - Backend

### **Decentralized Patent Verification on Hedera Hashgraph**

[![Node.js](https://img.shields.io/badge/Node.js-20.16.11-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-4.21.2-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Latest-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Hedera](https://img.shields.io/badge/Hedera-2.70.0-000000?style=for-the-badge&logo=hedera&logoColor=white)](https://hedera.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

**Patent Hash Backend** is the server-side application powering the decentralized patent verification platform. It handles patent submissions, Hedera blockchain interactions, user authentication, and data persistence.

*Built for the **Hedera Africa Hackathon** 🌍*

[🚀 API Docs](#) • [📖 Documentation](#) • [🐛 Report Bug](#) • [✨ Request Feature](#)

</div>

---

## 🌟 Overview

This is the **backend API** for Patent Hash, providing RESTful endpoints for patent management, blockchain integration, and user authentication.

### ✨ Key Features

- 🔐 **Secure Authentication** - Passport.js with session management
- ⛓️ **Hedera Integration** - Direct blockchain interaction via Hedera SDK
- 🗄️ **PostgreSQL Database** - Reliable data persistence with Drizzle ORM
- 📄 **File Management** - Secure document upload and storage
- 🔒 **Hash Generation** - SHA-256 hashing for patent verification
- 🤖 **AI Integration** - Google Generative AI for enhanced features
- 🚀 **Production Ready** - Optimized build with esbuild
- 📊 **Real-time Updates** - WebSocket support for live notifications

---

## 🎯 Problem Statement

Traditional patenting systems suffer from:

- ⏳ **Slow processing times** - Months or years of waiting
- 💰 **Expensive legal fees** - Thousands of dollars in costs
- 🌍 **Region restrictions** - Limited to specific jurisdictions
- 🔒 **Weak timestamp validation** - Central authority dependency

**Creators need a global, affordable, tamper-proof way to prove inventorship.**

---

## 💡 Solution: Patent Hash Backend

The backend leverages **Hedera Hashgraph** to provide:

### 🔄 API Workflow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Database
    participant Hedera
    
    Client->>API: Submit Patent
    API->>API: Generate SHA-256 Hash
    API->>Hedera: Store Hash on Blockchain
    Hedera-->>API: Transaction ID + Timestamp
    API->>Database: Save Patent Record
    Database-->>API: Confirmation
    API-->>Client: Patent Certificate
```

1. **Client submits** patent data via REST API
2. **Server generates** SHA-256 hash of content
3. **Hash is stored** on Hedera network
4. **Timestamp proof** is recorded
5. **Database stores** patent metadata
6. **Client receives** verification certificate

> 🔐 **Security**: All sensitive operations are authenticated and encrypted

---

## 🧱 Tech Stack

<div align="center">

| Category | Technologies |
|----------|-------------|
| **Runtime** | ![Node.js](https://img.shields.io/badge/-Node.js-339933?style=flat-square&logo=node.js&logoColor=white) ![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white) |
| **Framework** | ![Express](https://img.shields.io/badge/-Express-000000?style=flat-square&logo=express&logoColor=white) |
| **Database** | ![PostgreSQL](https://img.shields.io/badge/-PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white) ![Drizzle ORM](https://img.shields.io/badge/-Drizzle_ORM-C5F74F?style=flat-square) |
| **Blockchain** | ![Hedera SDK](https://img.shields.io/badge/-Hedera_SDK-000000?style=flat-square&logo=hedera&logoColor=white) |
| **Authentication** | ![Passport](https://img.shields.io/badge/-Passport.js-34E27A?style=flat-square&logo=passport&logoColor=white) ![bcrypt](https://img.shields.io/badge/-bcrypt-338033?style=flat-square) |
| **File Upload** | ![Multer](https://img.shields.io/badge/-Multer-FF6600?style=flat-square) |
| **AI** | ![Google AI](https://img.shields.io/badge/-Google_AI-4285F4?style=flat-square&logo=google&logoColor=white) |
| **Build Tool** | ![esbuild](https://img.shields.io/badge/-esbuild-FFCF00?style=flat-square&logo=esbuild&logoColor=black) |
| **WebSocket** | ![ws](https://img.shields.io/badge/-WebSocket-010101?style=flat-square) |

</div>

---

## 🚀 Getting Started

### 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v14 or higher) - [Download](https://www.postgresql.org/)
- **npm** or **yarn** - Comes with Node.js
- **Hedera Testnet Account** - [Create Account](https://portal.hedera.com/)

### 📥 Installation

1️⃣ **Clone the repository**

```bash
git clone https://github.com/Phisherman-0/patent_hash_api.git
cd patent_hash_api
```

2️⃣ **Install dependencies**

```bash
npm install
```

3️⃣ **Configure environment variables**

Create a `.env` file in the backend directory:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/patent_hash

# Hedera Configuration
HEDERA_NETWORK=testnet
HEDERA_OPERATOR_ID=0.0.xxxxx
HEDERA_OPERATOR_KEY=302e020100300506032b657004220420...

# Session Configuration
SESSION_SECRET=your-super-secret-session-key-change-this

# Google AI (Optional)
GOOGLE_AI_API_KEY=your-google-ai-api-key

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
```

> 💡 **Tip**: Copy `.env.example` to `.env` and update the values

4️⃣ **Set up the database**

```bash
# Push database schema
npm run db:push

# (Optional) Open Drizzle Studio to view database
npm run db:studio
```

5️⃣ **Start the development server**

```bash
npm run dev
```

6️⃣ **Verify the server is running**

Navigate to: **http://localhost:5000** 🎉

You should see: `{"status": "ok", "message": "Patent Hash API is running"}`

---

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | 🚀 Start development server with hot reload (tsx watch) |
| `npm run build` | 🏗️ Build for production (TypeScript + esbuild) |
| `npm run build:prod` | 🏗️ Type-check and build for production |
| `npm start` | ▶️ Start production server |
| `npm run start:prod` | ▶️ Start production server with .env.production |
| `npm run check` | ✅ Type-check TypeScript files |
| `npm run db:push` | 📊 Push database schema changes |
| `npm run db:studio` | 🎨 Open Drizzle Studio (database GUI) |

---

## 📂 Project Structure

```
backend/
├── 📁 controllers/         # Request handlers
│   ├── patentController.ts
│   ├── userController.ts
│   └── verificationController.ts
├── 📁 routes/              # API route definitions
│   ├── patentRoutes.ts
│   ├── userRoutes.ts
│   └── index.ts
├── 📁 services/            # Business logic
│   ├── hederaService.ts    # Hedera blockchain integration
│   ├── hashService.ts      # SHA-256 hashing
│   └── aiService.ts        # AI integration
├── 📁 shared/              # Shared utilities
│   ├── db/                 # Database schema (Drizzle)
│   └── types/              # Shared TypeScript types
├── 📁 scripts/             # Utility scripts
├── 📁 uploads/             # File upload directory
├── 📁 types/               # TypeScript type definitions
├── 📄 index.ts             # Main entry point
├── 📄 auth.ts              # Authentication logic
├── 📄 db.ts                # Database connection
├── 📄 storage.ts           # File storage logic
├── 📄 routes.ts            # Route aggregator
├── 📄 package.json         # Dependencies
├── 📄 tsconfig.json        # TypeScript configuration
└── 📄 drizzle.config.ts    # Drizzle ORM configuration
```

---

## 🔌 API Endpoints

### 🔐 Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login user |
| `POST` | `/api/auth/logout` | Logout user |
| `GET` | `/api/auth/me` | Get current user |

### 📄 Patents

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/patents` | Submit new patent |
| `GET` | `/api/patents` | Get all user patents |
| `GET` | `/api/patents/:id` | Get patent by ID |
| `PUT` | `/api/patents/:id` | Update patent |
| `DELETE` | `/api/patents/:id` | Delete patent |

### ✅ Verification

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/verify` | Verify patent hash |
| `GET` | `/api/verify/:hash` | Get verification details |

### 📊 Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/analytics/stats` | Get user statistics |
| `GET` | `/api/analytics/recent` | Get recent activity |

---

## 🔗 Hedera Integration

### Key Features

- **Transaction Creation** - Create and submit Hedera transactions
- **Hash Storage** - Store patent hashes on the Hedera network
- **Timestamp Verification** - Retrieve consensus timestamps
- **Account Management** - Manage Hedera accounts
- **Fee Calculation** - Estimate transaction costs

### Example: Storing a Patent Hash

```typescript
import { Client, TopicMessageSubmitTransaction } from "@hashgraph/sdk";

async function storePatentHash(hash: string) {
  const client = Client.forTestnet();
  client.setOperator(operatorId, operatorKey);

  const transaction = await new TopicMessageSubmitTransaction()
    .setTopicId(topicId)
    .setMessage(hash)
    .execute(client);

  const receipt = await transaction.getReceipt(client);
  const timestamp = receipt.consensusTimestamp;

  return {
    transactionId: transaction.transactionId.toString(),
    timestamp: timestamp.toString(),
    hash
  };
}
```

---

## 🗄️ Database Schema

### Users Table

```typescript
{
  id: serial,
  username: varchar(255),
  email: varchar(255),
  password: varchar(255), // bcrypt hashed
  hederaAccountId: varchar(50),
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Patents Table

```typescript
{
  id: serial,
  userId: integer,
  title: varchar(500),
  description: text,
  hash: varchar(64), // SHA-256
  hederaTransactionId: varchar(100),
  hederaTimestamp: timestamp,
  status: enum('pending', 'verified', 'rejected'),
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Verifications Table

```typescript
{
  id: serial,
  patentId: integer,
  verifiedBy: integer,
  result: boolean,
  timestamp: timestamp
}
```

---

## 🌍 Why Hedera?

<div align="center">

| Feature | Benefit |
|---------|---------|
| ⚡ **High Throughput** | 10,000+ TPS for fast processing |
| 💲 **Low Fees** | Predictable costs (~$0.0001 per transaction) |
| 📅 **Trusted Timestamps** | Consensus-based, immutable timestamps |
| ♻️ **Carbon Negative** | Environmentally sustainable |
| 🔒 **Enterprise Grade** | Bank-level security |
| 🌐 **Global Network** | Decentralized, worldwide access |

</div>

These advantages make Hedera ideal for next-generation patent systems.

---

## 🔒 Security Features

- 🔐 **Password Hashing** - bcrypt with salt rounds
- 🍪 **Session Management** - Secure, HTTP-only cookies
- 🛡️ **CORS Protection** - Configurable origin whitelist
- 📝 **Input Validation** - Zod schema validation
- 🔑 **Environment Variables** - Sensitive data protection
- 🚫 **Rate Limiting** - API abuse prevention (planned)
- 🔍 **SQL Injection Prevention** - Parameterized queries via Drizzle ORM

---

## 🎯 Features Roadmap

### ✅ Implemented

- [x] User authentication & authorization
- [x] Patent submission & storage
- [x] Hedera blockchain integration
- [x] Hash generation & verification
- [x] File upload handling
- [x] PostgreSQL database with Drizzle ORM
- [x] RESTful API endpoints

### 🚧 In Progress

- [ ] Ownership transfer API
- [ ] Patent NFT minting
- [ ] Multi-owner patent support
- [ ] Advanced analytics

### 📋 Planned

- [ ] GraphQL API
- [ ] Rate limiting & throttling
- [ ] Email notifications
- [ ] Webhook support
- [ ] API versioning
- [ ] Comprehensive API documentation (Swagger/OpenAPI)

---

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- patentController.test.ts
```

---

## 🤝 Contributing

Contributions are what make the open-source community amazing! Any contributions you make are **greatly appreciated**.

1. 🍴 Fork the Project
2. 🌿 Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. ✍️ Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. 📤 Push to the Branch (`git push origin feature/AmazingFeature`)
5. 🎉 Open a Pull Request

### Coding Standards

- Use **TypeScript** for type safety
- Follow **ESLint** rules
- Write **meaningful commit messages**
- Add **tests** for new features
- Update **documentation** as needed

---

## 📝 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

## 💬 Acknowledgements

<div align="center">

- 🏆 **Hedera Africa Hackathon** team
- 👥 **Hedera Developer Community**
- 💡 Inspired by real-world debates about idea originality
- 🗄️ **Drizzle ORM** for excellent database tooling
- ⚡ **esbuild** for lightning-fast builds
- 🔐 **Passport.js** for authentication

</div>

---

## 📞 Support

Need help? Reach out:

- 📧 Email: phisherman.exe@gmail.com
- 💬 X: [@phisherman](https://x.com/phisherman_)
- 📖 Docs: [Documentation](#)

---

<div align="center">

### 🌟 Star this repo if you find it helpful!

**Made with ❤️ for the Hedera Africa Hackathon**

[⬆ Back to Top](#-patent-hash---backend)

</div>
