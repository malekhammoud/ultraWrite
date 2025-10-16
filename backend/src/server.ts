import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import documentsRouter from './routes/documents.js';
import aiRouter from './routes/ai.js';
import agentRouter from './routes/agent.js';
import chatRouter from './routes/chat.js';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware
// Configure CORS to allow multiple origins (localhost + Vercel frontend)
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'UltraWrite API Server is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API Routes
app.use('/api/documents', documentsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/agent', agentRouter);
app.use('/api/chat', chatRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  });
});

// Only start the server if running locally (not in Vercel serverless)
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log('');
    console.log('╔═══════════════════════════════════════════════════════╗');
    console.log('║                                                       ║');
    console.log('║          🚀  UltraWrite API Server  🚀                ║');
    console.log('║                                                       ║');
    console.log('╠═══════════════════════════════════════════════════════╣');
    console.log(`║  Server:        http://localhost:${PORT}                    ║`);
    console.log(`║  Health Check:  http://localhost:${PORT}/health            ║`);
    console.log('║                                                       ║');
    console.log('║  📝 Documents API:  /api/documents                    ║');
    console.log('║  🤖 AI API:         /api/ai                           ║');
    console.log('║  🎯 Agent Mode API: /api/agent                        ║');
    console.log('║  💬 Chat API:       /api/chat                         ║');
    console.log('║                                                       ║');
    console.log('╚═══════════════════════════════════════════════════════╝');
    console.log('');
  });
}

export default app;

