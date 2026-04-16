import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Default CORS origins based on environment
const getDefaultCorsOrigins = (): string[] => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const rawOrigins = process.env.CORS_ORIGINS;
  
  if (rawOrigins) {
    return rawOrigins.split(',').map(origin => origin.trim()).filter(Boolean);
  }

  if (nodeEnv === 'production') {
    return [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:8081',
      'http://localhost:5173',
      'http://65.20.90.180:8081',
      'http://65.20.90.180:3001'
    ];
  }
  
  // Development - allow local ports
  return [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'http://localhost:8081',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001'
  ];
};

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || process.env.POSTGRES_URL || (process.env.NODE_ENV === 'production' ? 'postgresql://postgres-app:5432/app_db' : 'postgresql://localhost/business-platform'),
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  googlePlacesApiKey: process.env.GOOGLE_PLACES_API_KEY || '',
  logLevel: process.env.LOG_LEVEL || 'info',
  corsOrigins: getDefaultCorsOrigins(),
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    jwtSecret: process.env.SUPABASE_JWT_SECRET || '',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    maxRequests: parseInt(
      process.env.RATE_LIMIT_MAX_REQUESTS || 
      (process.env.NODE_ENV === 'production' ? '100' : '1000'), 
      10
    ),
    ingestMaxRequests: parseInt(
      process.env.RATE_LIMIT_INGEST_MAX || 
      (process.env.NODE_ENV === 'production' ? '20' : '100'), 
      10
    ),
  },
};
