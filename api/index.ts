import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import session from 'express-session';
import pgSession from 'connect-pg-simple';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { storage } from '../storage';
import { requireAuth, register, login, logout, getCurrentUser } from '../auth';
import { aiService } from '../services/aiService';
import { hederaService } from '../services/hederaService';
import { pool } from '../db';
import { insertPatentSchema } from '../shared/schema';

const app = express();
const NODE_ENV = process.env.NODE_ENV || 'production';
const IS_PRODUCTION = NODE_ENV === 'production';

// Environment-based configuration
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://your-production-domain.com';

// CORS configuration
const corsOrigins = IS_PRODUCTION 
  ? [FRONTEND_URL]
  : [
      'http://localhost:3000',
      'http://localhost:3001', 
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001'
    ];

app.use(cors({
  origin: corsOrigins,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(logLine);
    }
  });

  next();
});

// Production security middleware
if (IS_PRODUCTION) {
  app.set('trust proxy', 1);
  
  // Force HTTPS in production
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// Session middleware setup
const pgSessionStore = pgSession(session);

app.use(session({
  store: new pgSessionStore({
    pool: pool,
    tableName: 'sessions'
  }),
  secret: process.env.SESSION_SECRET || 'fallback-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: IS_PRODUCTION, // HTTPS only in production
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    sameSite: IS_PRODUCTION ? 'strict' : 'lax'
  }
}));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes
app.post('/api/auth/register', register);
app.post('/api/auth/login', login);
app.post('/api/auth/logout', logout);
app.get('/api/auth/user', getCurrentUser);

// Get user settings endpoint
app.get('/api/auth/user/settings', requireAuth, async (req: any, res) => {
  try {
    const user = await storage.getUserById(req.user!.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json(user.settings || {});
  } catch (error) {
    console.error("Error fetching user settings:", error);
    res.status(500).json({ message: "Failed to fetch settings" });
  }
});

// Update user settings endpoint
app.put('/api/auth/user/settings', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user!.id;
    const { settings } = req.body;
    
    // Get current user
    const user = await storage.getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Merge new settings with existing ones
    const currentSettings = user.settings || {};
    const updatedSettings = { ...currentSettings, ...settings };
    
    // Update user settings
    await storage.updateUserSettings(userId, updatedSettings);
    
    res.json({ message: "Settings updated successfully", settings: updatedSettings });
  } catch (error) {
    console.error("Error updating user settings:", error);
    res.status(500).json({ message: "Failed to update settings" });
  }
});

// Dashboard routes
app.get('/api/dashboard/stats', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const stats = await storage.getUserStats(userId);
    res.json(stats);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ message: "Failed to fetch dashboard stats" });
  }
});

app.get('/api/dashboard/activities', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit as string) || 10;
    const activities = await storage.getUserActivities(userId, limit);
    res.json(activities);
  } catch (error) {
    console.error("Error fetching activities:", error);
    res.status(500).json({ message: "Failed to fetch activities" });
  }
});

app.get('/api/dashboard/category-stats', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const categoryStats = await storage.getPatentCategoryStats(userId);
    res.json(categoryStats);
  } catch (error) {
    console.error("Error fetching category stats:", error);
    res.status(500).json({ message: "Failed to fetch category stats" });
  }
});

// Patent routes
app.get('/api/patents', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const patents = await storage.getPatentsByUser(userId);
    res.json(patents);
  } catch (error) {
    console.error("Error fetching patents:", error);
    res.status(500).json({ message: "Failed to fetch patents" });
  }
});

app.get('/api/patents/:id', requireAuth, async (req: any, res) => {
  try {
    const patent = await storage.getPatent(req.params.id);
    if (!patent) {
      return res.status(404).json({ message: "Patent not found" });
    }
    
    // Check if user owns this patent
    if (patent.userId !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    res.json(patent);
  } catch (error) {
    console.error("Error fetching patent:", error);
    res.status(500).json({ message: "Failed to fetch patent" });
  }
});

app.post('/api/patents', requireAuth, upload.array('documents'), async (req: any, res) => {
  try {
    const userId = req.user.id;
    const patentData = insertPatentSchema.parse({
      ...req.body,
      userId,
    });

    // Create the patent
    const patent = await storage.createPatent(patentData);

    // Process uploaded files
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        // Calculate file hash
        const fileBuffer = fs.readFileSync(file.path);
        const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

        // Create document record
        await storage.createPatentDocument({
          patentId: patent.id,
          userId,
          fileName: file.originalname,
          filePath: file.path,
          fileType: file.mimetype,
          fileSize: file.size,
          hashValue: hash,
        });
      }

      // Store patent hash on Hedera blockchain
      try {
        const hederaResult = await hederaService.storePatentHash(patent.id, req.files[0].path);
        
        // Update patent with Hedera information
        await storage.updatePatent(patent.id, {
          hederaTopicId: hederaResult.topicId,
          hederaMessageId: hederaResult.messageId,
          hashValue: hederaResult.hash,
        });

        // Create blockchain transaction record
        await storage.createBlockchainTransaction({
          patentId: patent.id,
          transactionType: 'hash_storage',
          hederaTopicId: hederaResult.topicId,
          hederaMessageId: hederaResult.messageId,
          status: 'confirmed',
        });
      } catch (hederaError) {
        console.error("Hedera storage error:", hederaError);
        // Continue even if blockchain storage fails
      }
    }

    // Create activity record
    await storage.createPatentActivity({
      patentId: patent.id,
      userId,
      activityType: 'created',
      description: `Patent "${patent.title}" created`,
    });

    res.status(201).json(patent);
  } catch (error) {
    console.error("Error creating patent:", error);
    res.status(500).json({ message: "Failed to create patent" });
  }
});

// Error handling middleware (must be last)
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  console.error('API Error:', err);
  res.status(status).json({ message });
});

// Catch-all handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

export default app;
