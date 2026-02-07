import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'node:path';
import authRoutes from './routes/auth.routes.ts';
import transactionRoutes from './routes/transaction.routes.js';
import slipRoutes from './routes/slip.routes.js';
import { connectRedis } from './lib/redis.js';

dotenv.config();

const app: express.Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Transaction routes
app.use('/api/transactions', transactionRoutes);

// Slip routes
app.use('/api/slips', slipRoutes);

// Serve uploaded files statically (behind auth in production you may want a signed URL)
app.use('/uploads', express.static(path.resolve('uploads')));

// API routes placeholder
app.get('/api', (_req, res) => {
  res.json({ message: 'MoneyMate API v1.0' });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});


const server = app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);

  // Connect to Redis (non-blocking – the server still starts if Redis is unavailable)
  const redisResult = await connectRedis();
  if (!redisResult.ok) {
    console.warn('[redis] Could not connect:', redisResult.message);
  }
});

const gracefulShutdown = () => {
  console.log('Received kill signal, shutting down gracefully');
  server.close(() => {
    console.log('Closed out remaining connections');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

export default app;
