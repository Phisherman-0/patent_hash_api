# OCI Deployment Setup Guide

This document records the steps taken to host the Patent Hash Backend on an Oracle Cloud Infrastructure (OCI) instance.

## 1. Instance Provisioning
- **Shape**: VM.Standard.E2.1.Micro (Always Free)
- **OS**: Ubuntu 22.04
- **Public IP**: `130.162.228.97`

## 2. PostgreSQL Setup (Local)
Instead of using an external provider like Supabase, we installed a local PostgreSQL instance.

### Installation
```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Database & User Creation
```bash
# Enter psql as the postgres superuser
sudo -u postgres psql

# Run these commands inside psql:
CREATE USER patent_user WITH PASSWORD 'your_secure_password';
CREATE DATABASE patent_hash OWNER patent_user;
GRANT ALL PRIVILEGES ON DATABASE patent_hash TO patent_user;
\q
```

### Environment Config
Update `.env.production`:
```env
DATABASE_URL=postgresql://patent_user:your_secure_password@localhost:5432/patent_hash
```

## 3. Network Configuration (Cloud Level)
In the OCI Console (Subnet > Security List):
- **Ingress Rule**: Allow TCP Port `80` (HTTP) from `0.0.0.0/0`
- **Ingress Rule**: Allow TCP Port `443` (HTTPS) from `0.0.0.0/0`
- **Ingress Rule**: Allow TCP Port `5000` (Direct Node.js API) from `0.0.0.0/0`

## 3. Server Firewall (OS Level)
We resolved issues where Apache2 was blocking port 80 and iptables were rejecting new connections.

### Stop Apache2
```bash
sudo systemctl stop apache2
sudo systemctl disable apache2
```

### Open Ports in iptables
```bash
sudo iptables -I INPUT 5 -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

## 4. Reverse Proxy (Nginx)
Nginx is configured to proxy traffic from port 80 to port 5000.
**Config path**: `/etc/nginx/sites-available/patent-hash`
**Link path**: `/etc/nginx/sites-enabled/patent-hash`

## 5. Process Management (PM2)
The app is managed by PM2 for automatic restarts.
**Ecosystem config**: `ecosystem.config.cjs`
**Start command**: `pm2 start ecosystem.config.cjs --env production`

## 6. Automation
A deployment script is provided at `scripts/deploy-oci.sh` to automate the follow-up updates:
1. `git pull`
2. `npm install`
3. `npm run build:prod`
4. `npm run db:push`
5. `pm2 restart`
