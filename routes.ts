import { Express } from 'express';
import { Server } from 'http';
import { createServer } from 'http';
import authRoutes from './routes/auth.routes';
import patentRoutes from './routes/patent.routes';
import aiRoutes from './routes/ai.routes';
import consultantRoutes from './routes/consultant.routes';
import documentRoutes from './routes/document.routes';
import dashboardRoutes from './routes/dashboard.routes';
import searchRoutes from './routes/search.routes';
import appointmentRoutes from './routes/appointment.routes';
import chatRoutes from './routes/chat.routes';
import adminRoutes from './routes/admin.routes';

export async function setupRoutes(app: Express): Promise<Server> {
  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/patents', patentRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/consultants', consultantRoutes);
  app.use('/api/documents', documentRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/search', searchRoutes);
  app.use('/api/appointments', appointmentRoutes);
  app.use('/api/chat', chatRoutes);
  app.use('/api/admin', adminRoutes);

  const httpServer = createServer(app);
  return httpServer;
}
