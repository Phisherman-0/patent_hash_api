# OCI Deployment & Project Structure

## Project Overview

Patent Hash is a decentralized patent management system built on the **Base** blockchain (Ethereum Layer-2). It uses AI to assist with intellectual property protection and analysis.

### Core Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), Tailwind CSS, Shadcn UI, Wagmi/RainbowKit |
| Backend | Node.js, Express, Drizzle ORM, PostgreSQL |
| Blockchain | Base L2 (Solidity Smart Contracts via Ethers.js) |
| AI | Google Gemini API |
| Process Manager | PM2 |
| Reverse Proxy | Nginx |

### Project Directory Structure

```
patent_hash/
├── contracts/              # Solidity smart contracts + Hardhat config
│   ├── PatentSign.sol      # Core contract: register & sign patent hashes
│   └── hardhat.config.ts   # Network config for Base Sepolia & Mainnet
│
├── server/                 # Node.js/Express backend
│   ├── controllers/        # Request handlers (Patent, Auth, AI, Blockchain)
│   ├── models/             # Drizzle schema definitions
│   ├── routes/             # Route files per domain
│   ├── services/           # Core logic (AI, IPFS, blockchain integration)
│   ├── middleware/         # Auth and role middleware
│   ├── utils/              # Shared helpers
│   ├── scripts/            # Deployment and maintenance scripts
│   ├── storage.ts          # Database abstraction layer
│   ├── db.ts               # Database connection & Drizzle initialization
│   ├── index.ts            # Express app entry point
│   └── ecosystem.config.cjs # PM2 configuration
│
└── client/                 # React frontend
    ├── src/context/Web3Provider.tsx  # Wagmi & RainbowKit config for Base
    ├── src/pages/patents/            # Patent filing, management, tracking
    ├── src/pages/verification/      # Blockchain verification & ownership
    └── src/lib/apiService.ts        # Consolidated API client
```

### Blockchain Integration

Patent document hashes are registered on **Base** using the `PatentSign.sol` contract.

- **Testnet**: Base Sepolia (`chainId: 84532`, RPC: `https://sepolia.base.org`)
- **Mainnet**: Base (`chainId: 8453`, RPC: `https://mainnet.base.org`)

**Workflow:**
1. User uploads a patent document.
2. Backend calculates a SHA-256 hash of the document.
3. Backend calls `PatentSign.registerDocument(bytes32 docHash)` on Base.
4. Transaction hash is stored in the database for later verification.

---

## OCI Server Setup

The backend is hosted on an **Oracle Cloud Infrastructure (OCI)** Always Free compute instance.

### Instance Details

| Field | Value |
|---|---|
| Shape | VM.Standard.E2.1.Micro (Always Free) |
| OS | Ubuntu 22.04 |
| Public IP | `130.162.228.97` |

---

## 1. Initial Server Preparation

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential
```

Install **Node.js** (via nvm):

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
```

Install **PM2** globally:

```bash
npm install -g pm2
```

---

## 2. PostgreSQL Setup

A local PostgreSQL instance is used instead of an external provider.

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Database & User Creation

```bash
sudo -u postgres psql
```

Inside `psql`:

```sql
CREATE USER patent_user WITH PASSWORD 'your_secure_password';
CREATE DATABASE patent_hash OWNER patent_user;
GRANT ALL PRIVILEGES ON DATABASE patent_hash TO patent_user;
\q
```

### Environment Config

Set the following in `.env.production`:

```env
DATABASE_URL=postgresql://patent_user:your_secure_password@localhost:5432/patent_hash
```

---

## 3. Network Configuration

### OCI Console (Subnet > Security List)

Add the following ingress rules:

| Protocol | Port | Source |
|---|---|---|
| TCP | 80 | 0.0.0.0/0 |
| TCP | 443 | 0.0.0.0/0 |
| TCP | 5000 | 0.0.0.0/0 (direct API, optional) |

### OS-Level Firewall (iptables)

Stop Apache2 if it is running and blocking port 80:

```bash
sudo systemctl stop apache2
sudo systemctl disable apache2
```

Open ports in iptables:

```bash
sudo iptables -I INPUT 5 -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

---

## 4. Nginx Reverse Proxy

Install Nginx and configure it to proxy traffic from port 80 to the Node.js app on port 5000.

```bash
sudo apt install -y nginx
sudo nano /etc/nginx/sites-available/patent-hash
```

Paste the following configuration:

```nginx
server {
    listen 80;
    server_name your_domain_or_ip;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site and reload Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/patent-hash /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### HTTPS with Let's Encrypt (Certbot)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your_domain.com
```

Certbot will automatically update the Nginx config for HTTPS and set up auto-renewal.

---

## 5. Cloning & Building the App

```bash
git clone https://github.com/your-username/patent_hash.git
cd patent_hash/server
npm install
```

Copy and configure your environment file:

```bash
cp .env.example .env.production
nano .env.production
```

Required environment variables:

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://patent_user:your_secure_password@localhost:5432/patent_hash
SESSION_SECRET=a_long_random_secret_string
GEMINI_API_KEY=your_gemini_api_key
FRONTEND_URL=https://your_frontend_domain.com
BASE_SEPOLIA_RPC_URL=your_rpc_url
PRIVATE_KEY=your_operator_wallet_private_key
CONTRACT_ADDRESS=your_deployed_contract_address
```

Run database migrations:

```bash
npm run db:push
```

Build for production:

```bash
npm run build:prod
```

---

## 6. Process Management (PM2)

Start the app using the PM2 ecosystem config:

```bash
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup
```

The last command will print a command to run to enable PM2 to auto-start on reboot. Run that command.

**Useful PM2 commands:**

```bash
pm2 status           # View running processes
pm2 logs patent-hash # View live logs
pm2 restart patent-hash
pm2 stop patent-hash
```

---

## 7. Deployment Updates

A helper script at `scripts/deploy-oci.sh` automates follow-up deployments on the server:

```bash
bash scripts/deploy-oci.sh
```

This script runs:
1. `git pull`
2. `npm install`
3. `npm run build:prod`
4. `npm run db:push`
5. `pm2 restart patent-hash`

---

## 8. Production Checklist

- [ ] PostgreSQL running and accessible locally
- [ ] `.env.production` fully configured with all required variables
- [ ] Database migrations applied (`npm run db:push`)
- [ ] Nginx configured and serving traffic on port 80/443
- [ ] SSL certificate issued via Certbot
- [ ] PM2 process running and set to auto-start on reboot (`pm2 startup && pm2 save`)
- [ ] OCI security list rules allow ports 80 and 443
- [ ] iptables rules persisted via `netfilter-persistent`
- [ ] `SESSION_SECRET` is a strong, unique value
