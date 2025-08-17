import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { registerRoutes, initializeRoutes } from './routes';

const app = express();
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';

// Environment-based configuration
const FRONTEND_URL = process.env.FRONTEND_URL || (IS_PRODUCTION ? 'https://your-production-domain.com' : 'http://localhost:3000');

// CORS configuration - dynamic based on environment
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

// Initialize the app
async function initializeApp() {
  if (IS_PRODUCTION) {
    // For Vercel serverless functions, use initializeRoutes
    await initializeRoutes(app);
  } else {
    // For local development, use registerRoutes which starts a server
    const server = await registerRoutes(app);
    const port = parseInt(process.env.PORT || '5000', 10);
    server.listen(port, () => {
      console.log(`🚀 Server running on port ${port} (${NODE_ENV})`);
      console.log(`📡 CORS origins: ${corsOrigins.join(', ')}`);
    });
  }

  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    if (IS_PRODUCTION) {
      console.error('Production error:', err);
    }

    res.status(status).json({ message });
  });
}

// Initialize for both Vercel and local development
initializeApp().catch(console.error);

// For Vercel serverless functions, export the app
export default app;
