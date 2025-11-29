import { Express } from 'express';
import { Server } from 'http';
import { createServer } from 'http';
import { pool } from '../db';

// Import route modules
import authRoutes from './authRoutes';
import patentRoutes from './patentRoutes';
import walletRoutes from './walletRoutes';
import { setupHashPackRoutes } from './hashpackRoutes';

// Import legacy routes that haven't been modularized yet
import { setupLegacyRoutes } from './legacyRoutes';

export async function setupRoutes(app: Express): Promise<Server> {
  // Session middleware setup
  const session = await import('express-session');
  const connectPgSimple = await import('connect-pg-simple');
  const pgSession = connectPgSimple.default(session.default);
  
  const IS_PRODUCTION = process.env.NODE_ENV === 'production';
  
  app.use(session.default({
    store: new pgSession({
      pool: pool,
      tableName: 'sessions'
    }),
    secret: process.env.SESSION_SECRET || 'fallback-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: IS_PRODUCTION, // HTTPS only in production
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      sameSite: IS_PRODUCTION ? 'none' : 'lax' // 'none' required for cross-origin in production
    }
  }));

  // Mount modular routes
  app.use('/api/auth', authRoutes);
  app.use('/api/patents', patentRoutes);
  app.use('/api/wallet', walletRoutes);
  
  // Setup HashPack routes
  setupHashPackRoutes(app);
  
  // Setup legacy routes (to be modularized later)
  await setupLegacyRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}
