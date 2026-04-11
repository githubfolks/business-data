import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Default CORS origins based on environment
const getDefaultCorsOrigins = (): string => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  if (nodeEnv === 'production') {
    return process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001';
  }
  
  // Development - allow local ports
  return process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:3001';
};

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || process.env.POSTGRES_URL || 'postgresql://localhost/business-platform',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  googlePlacesApiKey: process.env.GOOGLE_PLACES_API_KEY || '',
  logLevel: process.env.LOG_LEVEL || 'info',
  corsOrigins: getDefaultCorsOrigins().split(','),
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
