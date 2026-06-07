import './env'; // ← MUST be first: loads dotenv before any other module reads process.env
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { setupRoutes } from './routes';
import { initializeDatabase } from './db';

const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';

const app = express();

// Environment-based configuration
const FRONTEND_URL = process.env.FRONTEND_URL || (IS_PRODUCTION ? 'https://patent-hash-webapp.vercel.app' : 'http://localhost:3000');

// CORS configuration - dynamic based on environment
const corsOrigins = [
  'http://localhost:3000',
  'http://localhost:3001', 
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  FRONTEND_URL,
  'https://patent-hash-webapp.vercel.app',
  // Allow the OCI Public IP with any port
  /^http:\/\/130\.162\.228\.97(:\d+)?$/,
  // Allow network access for development (various local IP patterns)
  /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/,
  /^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/,
  /^http:\/\/172\.(1[6-9]|2[0-9]|3[01])\.\d+\.\d+(:\d+)?$/
];

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Set-Cookie']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const path = req.path;
  
  // Debug raw headers
  if (path.startsWith("/api/auth/user") || path.startsWith("/api/dashboard")) {
    console.log(`[Raw Headers] ${req.method} ${path}, Cookie Header: ${req.headers.cookie || 'MISSING'}`);
  }
  
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson: any) {
    capturedJsonResponse = bodyJson;
    return originalResJson.call(this, bodyJson);
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
  
  // Conditionally force HTTPS in production
  if (process.env.FORCE_HTTPS === 'true') {
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.header('x-forwarded-proto') !== 'https') {
        res.redirect(`https://${req.header('host')}${req.url}`);
      } else {
        next();
      }
    });
  }
}

(async () => {
  // Initialize database and run migrations
  await initializeDatabase();
  
  const server = await setupRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    if (IS_PRODUCTION) {
      console.error('Production error:', err);
    }

    res.status(status).json({ message });
  });


  // Health check / root route
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      name: 'Patent Hash API',
      status: 'running',
      version: '1.0.0',
      environment: NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  });

  // API Health check route
  app.get('/api', (_req: Request, res: Response) => {
    res.json({
      message: 'Patent Hash API is active',
      endpoint: '/api',
      status: 'ready'
    });
  });

  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, async () => {
    console.log(`🚀 Server running on port ${port} (${NODE_ENV})`);
    console.log(`💡 Type 'rs' + Enter in this terminal to restart (nodemon)`);

    if (!IS_PRODUCTION) {
      const os = await import('os');
      const networkInterfaces = os.networkInterfaces();
      console.log('\n🌐 Network access URLs:');
      console.log(`   Local: http://localhost:${port}`);

      Object.keys(networkInterfaces).forEach(interfaceName => {
        const interfaces = networkInterfaces[interfaceName];
        if (interfaces) {
          interfaces.forEach(interfaceInfo => {
            if (!interfaceInfo.internal && interfaceInfo.family === 'IPv4') {
              console.log(`   Network: http://${interfaceInfo.address}:${port}`);
            }
          });
        }
      });
    }
  });
})();
