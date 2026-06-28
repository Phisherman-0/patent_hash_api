# OCI Deployment & Project Structure

## Project Overview

Patent Hash is a decentralized patent management system built on the **Base** blockchain (Ethereum Layer-2). It uses AI to assist with intellectual property protection and analysis.

### Core Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), Tailwind CSS, Shadcn UI, Wagmi/RainbowKit |
| Backend | Node.js, Express, Drizzle ORM, MySQL |
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
│   ├── models/             # Drizzle schema definitions (MySQL dialect)
│   ├── routes/             # Route files per domain
│   ├── services/           # Core logic (AI, IPFS, blockchain integration)
│   ├── middleware/         # Auth and role middleware
│   ├── utils/              # Shared helpers
│   ├── scripts/            # Deployment and maintenance scripts
│   │   └── deploy-oci.sh   # Manual deployment script
│   ├── storage.ts          # Database abstraction layer
│   ├── db.ts               # MySQL connection (mysql2) & Drizzle initialization
│   ├── drizzle.config.ts   # Drizzle Kit config (mysql dialect)
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
| App directory | `/github/patent_hash_api` |

---

## 1. Initial Server Preparation

SSH into the server, then run:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential
```

Install **Node.js** via nvm:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
node -v  # confirm
```

Install **PM2** globally:

```bash
npm install -g pm2
```

---

## 2. MySQL Setup

```bash
sudo apt install -y mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

Secure the installation:

```bash
sudo mysql_secure_installation
```

### Database & User Creation

```bash
sudo mysql -u root -p
```

Inside the MySQL shell:

```sql
CREATE DATABASE patent_hash CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'patent_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON patent_hash.* TO 'patent_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Environment Config

Set in `.env.production`:

```env
DATABASE_URL=mysql://patent_user:your_secure_password@localhost:3306/patent_hash
```

---

## 3. Network Configuration

### OCI Console (Subnet > Security List)

Add the following ingress rules in the OCI Console under **Networking > Virtual Cloud Networks > Subnet > Security List**:

| Protocol | Port | Source |
|---|---|---|
| TCP | 80 | 0.0.0.0/0 |
| TCP | 443 | 0.0.0.0/0 |

### OS-Level Firewall (iptables)

Stop Apache2 if it is running:

```bash
sudo systemctl stop apache2
sudo systemctl disable apache2
```

Open ports in iptables and persist the rules:

```bash
sudo iptables -I INPUT 5 -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -p tcp --dport 443 -j ACCEPT
sudo apt install -y iptables-persistent
sudo netfilter-persistent save
```

---

## 4. Nginx Reverse Proxy

```bash
sudo apt install -y nginx
sudo nano /etc/nginx/sites-available/patent-hash
```

Paste:

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

Enable and reload:

```bash
sudo ln -s /etc/nginx/sites-available/patent-hash /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### HTTPS with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your_domain.com
```

Certbot updates the Nginx config automatically and sets up auto-renewal.

---

## 5. First-Time Deployment

### Clone the repository

```bash
sudo mkdir -p /github
sudo chown $USER:$USER /github
cd /github
git clone https://github.com/your-username/patent_hash.git patent_hash_api
cd patent_hash_api/server
```

### Configure environment

```bash
cp .env.example .env.production
nano .env.production
```

Required variables:

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=mysql://patent_user:your_secure_password@localhost:3306/patent_hash
SESSION_SECRET=a_long_random_secret_string
GEMINI_API_KEY=your_gemini_api_key
FRONTEND_URL=https://your_frontend_domain.com
BASE_SEPOLIA_RPC_URL=your_rpc_url
PRIVATE_KEY=your_operator_wallet_private_key
CONTRACT_ADDRESS=your_deployed_contract_address
```

### Install, build, migrate

```bash
npm install
npm run build:prod
npm run db:push
```

### Start with PM2

```bash
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup   # run the printed command to enable auto-start on reboot
```

---

## 6. Manual Deployment

After the first-time setup, subsequent deployments can be done by SSH-ing into the server and running:

```bash
cd /github/patent_hash_api/server
bash scripts/deploy-oci.sh
```

The script runs: `git pull` → `npm install` → `npm run build:prod` → `npm run db:push` → `pm2 restart`.

---

## 7. CI/CD with GitHub Actions

GitHub Actions is used to automatically deploy to the OCI server on every push to the `main` branch.

### How it works

```
Push to main
    └── GitHub Actions runner
            ├── SSH into OCI server
            └── Run scripts/deploy-oci.sh
```

### Step 1 — Generate an SSH key pair for GitHub Actions

On your **local machine** (or the server), generate a dedicated key pair:

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy_key -N ""
```

This creates:
- `~/.ssh/github_deploy_key` — private key (goes into GitHub Secrets)
- `~/.ssh/github_deploy_key.pub` — public key (goes onto the OCI server)

### Step 2 — Authorize the key on the OCI server

SSH into the server and add the public key:

```bash
cat ~/.ssh/github_deploy_key.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### Step 3 — Add GitHub Secrets

In your GitHub repository, go to **Settings > Secrets and variables > Actions** and add:

| Secret Name | Value |
|---|---|
| `OCI_HOST` | Your server's public IP (e.g. `130.162.228.97`) |
| `OCI_USER` | Your SSH username (e.g. `ubuntu`) |
| `OCI_SSH_KEY` | The full contents of `~/.ssh/github_deploy_key` (private key) |
| `OCI_SSH_PORT` | `22` (or your custom port if changed) |

### Step 4 — Create the workflow file

Create the file `.github/workflows/deploy.yml` in the **root** of your repository:

```yaml
name: Deploy to OCI

on:
  push:
    branches:
      - main

jobs:
  deploy:
    name: SSH Deploy
    runs-on: ubuntu-latest

    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.OCI_HOST }}
          username: ${{ secrets.OCI_USER }}
          key: ${{ secrets.OCI_SSH_KEY }}
          port: ${{ secrets.OCI_SSH_PORT }}
          script: |
            cd /github/patent_hash_api/server
            bash scripts/deploy-oci.sh
```

### Step 5 — Verify

Push a commit to `main`. Go to **Actions** in your GitHub repository to watch the workflow run. A green checkmark means the deployment succeeded.

To view live logs on the server after a deployment:

```bash
pm2 logs patent-hash-backend
```

---

## 8. PM2 Reference

```bash
pm2 status                          # View all processes
pm2 logs patent-hash-backend        # Live logs
pm2 restart patent-hash-backend     # Restart the app
pm2 stop patent-hash-backend        # Stop the app
pm2 monit                           # CPU/memory monitor
```

---

## 9. Production Checklist

- [ ] MySQL running and accessible locally
- [ ] `.env.production` fully configured with all required variables
- [ ] Database created and migrations applied (`npm run db:push`)
- [ ] Nginx configured and serving traffic on port 80/443
- [ ] SSL certificate issued via Certbot
- [ ] PM2 process running and persisted (`pm2 startup && pm2 save`)
- [ ] OCI security list allows inbound TCP on ports 80 and 443
- [ ] iptables rules persisted via `netfilter-persistent`
- [ ] `SESSION_SECRET` is a strong, unique value
- [ ] GitHub Actions `deploy.yml` workflow in place and tested
- [ ] `OCI_HOST`, `OCI_USER`, `OCI_SSH_KEY`, `OCI_SSH_PORT` secrets set in GitHub
