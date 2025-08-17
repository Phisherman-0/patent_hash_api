# Vercel + Supabase Deployment Guide

This guide will help you deploy your patent hash middleware to Vercel with Supabase as the database.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
3. **GitHub Repository**: Your code should be in a GitHub repository

## Step 1: Set up Supabase Database

1. Create a new project in Supabase
2. Go to **Settings > Database**
3. Copy your connection string (it looks like: `postgresql://postgres:[password]@[host]:[port]/[database]`)
4. In Supabase SQL Editor, run your database migrations:
   ```sql
   -- Run your existing schema from shared/schema.ts
   -- You can use drizzle-kit push or manually create tables
   ```

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Set **Root Directory** to `backend`
5. Vercel will auto-detect the Node.js framework

### Option B: Deploy via Vercel CLI
```bash
npm i -g vercel
cd backend
vercel
```

## Step 3: Configure Environment Variables

In your Vercel project dashboard, go to **Settings > Environment Variables** and add:

### Required Variables
```
DATABASE_URL=postgresql://postgres:[password]@[host]:[port]/[database]?sslmode=require
NODE_ENV=production
SESSION_SECRET=your-super-secure-production-session-secret
GEMINI_API_KEY=your-gemini-api-key
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

### Optional Variables (if using)
```
HEDERA_ACCOUNT_ID=0.0.6554099
HEDERA_PRIVATE_KEY=your-hedera-private-key
HEDERA_NETWORK=testnet
USE_REPLIT_AUTH=false
```

## Step 4: Database Migration

After deployment, run database migrations:

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Link your project
vercel link

# Run database push
vercel env pull .env.local
npm run db:push
```

## Step 5: Update Frontend Configuration

Update your frontend's API endpoint to point to your Vercel deployment:
```
VITE_API_URL=https://your-backend-deployment.vercel.app
```

## Local Development (Unchanged)

Your local development setup remains the same:
```bash
npm run dev
```

The database configuration automatically detects the environment and uses appropriate settings.

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Ensure your Supabase connection string includes `?sslmode=require`
   - Check that your Supabase project is not paused

2. **Build Errors**
   - Ensure all TypeScript types are properly defined
   - Check that all imports use correct paths

3. **CORS Issues**
   - Update `FRONTEND_URL` environment variable
   - Ensure your frontend domain is correct

4. **Function Timeout**
   - Vercel functions have a 30-second timeout (configured in vercel.json)
   - Optimize long-running operations

### Logs and Debugging

View deployment logs:
```bash
vercel logs [deployment-url]
```

View function logs in real-time:
```bash
vercel logs --follow
```

## Production Checklist

- [ ] Database connection string configured with SSL
- [ ] All environment variables set in Vercel
- [ ] Frontend URL updated to production domain
- [ ] Database migrations applied
- [ ] Session secret is secure and unique
- [ ] API keys are valid and have proper permissions
- [ ] CORS origins include your frontend domain

## Monitoring

- Monitor your Supabase database usage in the Supabase dashboard
- Check Vercel function metrics in the Vercel dashboard
- Set up alerts for database connection limits

## Cost Considerations

- **Vercel**: Free tier includes 100GB bandwidth, 1000 serverless function invocations
- **Supabase**: Free tier includes 500MB database, 2GB bandwidth
- Monitor usage to avoid unexpected charges
