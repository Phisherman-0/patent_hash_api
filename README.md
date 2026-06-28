# Patent Hash - Backend

The backend API for [Patent Hash](https://patenthash.com), a decentralized platform for intellectual property protection built on the **Base** blockchain.

It handles patent submission, SHA-256 document hashing, on-chain registration via smart contracts, user authentication, and AI-powered patent analysis using the Google Gemini API.

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL via Drizzle ORM
- **Blockchain**: Base (Ethers.js)
- **AI**: Google Gemini API
- **Build**: esbuild

## Getting Started

**1. Install dependencies**
```bash
npm install
```

**2. Configure environment**

Copy `.env.example` to `.env` and fill in the values:
```env
PORT=5000
DATABASE_URL=postgresql://user:pass@localhost:5432/patent_hash
SESSION_SECRET=your_secret
BASE_SEPOLIA_RPC_URL=your_rpc_url
PRIVATE_KEY=your_operator_private_key
CONTRACT_ADDRESS=your_deployed_contract_address
GEMINI_API_KEY=your_gemini_api_key
```

**3. Run database migrations**
```bash
npm run db:push
```

**4. Start the development server**
```bash
npm run dev
```

## Deployment

The server is hosted on an Oracle Cloud Infrastructure (OCI) instance and managed with PM2 behind an Nginx reverse proxy. See [OCI_SETUP.md](./OCI_SETUP.md) for the full setup and deployment guide.

## License

MIT
