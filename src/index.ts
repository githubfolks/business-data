import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { rateLimit } from 'express-rate-limit';
import 'express-async-errors';
import { config } from './config';
import searchRoutes from './routes/searchRoutes';
import systemRoutes from './routes/systemRoutes';

const app: Express = express();

// Trust proxy for rate limiting (needed when behind Nginx)
app.set('trust proxy', 1);

// Middleware
console.log('Allowed CORS Origins:', config.corsOrigins);
app.use(cors({ 
  origin: config.corsOrigins,
  optionsSuccessStatus: 200 
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Rate limiting
const globalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests, please try again later.',
    status: 429,
  },
});

// Apply global rate limiter to all api routes
app.use('/api/v1', globalLimiter);

// API Root/Health
app.get('/api/v1', (_req: Request, res: Response) => {
  return res.status(200).json({
    status: 'ok',
    message: 'Business Intelligence Platform API v1 (Real-time)',
    docs: '/api/v1/docs',
    health: '/api/v1/health'
  });
});

// API Routes
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1', systemRoutes);

// Health check root
app.get('/', (_req: Request, res: Response) => {
  return res.status(200).json({
    service: 'Business Intelligence Platform',
    status: 'running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    mode: 'storage-free-realtime'
  });
});

// 404 handler - catch unmatched routes
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handling middleware
app.use((error: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', error);

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';

  return res.status(statusCode).json({
    error: message,
    timestamp: new Date().toISOString(),
    path: _req.path,
  });
});

// Start server
function startServer(): void {
  try {
    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
      console.log(`Environment: ${config.nodeEnv}`);
      console.log(`Mode: PURE REAL-TIME (No Database)`);
      console.log(`API available at http://localhost:${config.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
