import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { setupRoutes } from './routes/index';
import { DatabaseStorage } from './storage';
import dotenv from 'dotenv';

const app = express();
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';

// Environment-based configuration
const FRONTEND_URL = process.env.FRONTEND_URL || (IS_PRODUCTION ? 'https://patent-hash-webapp.vercel.app' : 'http://localhost:3000');

// CORS configuration - dynamic based on environment
const corsOrigins = IS_PRODUCTION 
  ? [FRONTEND_URL, 'https://patent-hash-webapp.vercel.app']
  : [
      'http://localhost:3000',
      'http://localhost:3001', 
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      // Allow network access for development
      'http://192.168.1.72:3000',
      'http://192.168.1.*:3000',
      // Generic network access patterns
      /^http:\/\/192\.168\.\d+\.\d+:3000$/,
      /^http:\/\/10\.\d+\.\d+\.\d+:3000$/,
      /^http:\/\/172\.(1[6-9]|2[0-9]|3[01])\.\d+\.\d+:3000$/
    ];

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const path = req.path;
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
  
  // Force HTTPS in production
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}

(async () => {
  const server = await setupRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    if (IS_PRODUCTION) {
      console.error('Production error:', err);
    }

    res.status(status).json({ message });
  });


  const port = parseInt(process.env.PORT || '5000', 10);
  const serverInstance = server.listen({
    port,
    host: "0.0.0.0", // Listen on all interfaces
    reusePort: true,
  }, async () => {
    console.log(`🚀 Server running on port ${port} (${NODE_ENV})`);
    console.log(`💡 Type 'rs' and press Enter to restart the server`);
    
    // Log network access information
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

  // Add restart functionality
  if (process.stdin.isTTY) {
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    
    let inputBuffer = '';
    
    process.stdin.on('data', (data) => {
      const input = data.toString().trim();
      
      // Handle Ctrl+C
      if (input === '\u0003') {
        process.exit();
      }
      
      // Check for restart command
      if (input === 'rs') {
        console.log('🔄 Restarting server...');
        serverInstance.close(() => {
          // Signal tsx watch to restart by exiting with code 1
          process.exit(1);
        });
        return;
      }
      
      // Echo the input for feedback
      if (input && input !== 'rs') {
        console.log(`Unknown command: ${input}. Type 'rs' to restart.`);
      }
    });
  }
})();
