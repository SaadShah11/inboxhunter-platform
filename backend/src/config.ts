import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  databaseUrl: process.env.DATABASE_URL || '',
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'development-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  
  // Agent
  agentTokenExpiresIn: process.env.AGENT_TOKEN_EXPIRES_IN || '30d',
  
  // AWS S3
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || 'us-east-1',
    s3Bucket: process.env.S3_BUCKET || 'inboxhunter-storage',
  },
} as const;

// Validate required config
if (!config.databaseUrl && config.nodeEnv === 'production') {
  throw new Error('DATABASE_URL is required in production');
}

if (config.jwtSecret === 'development-secret-change-me' && config.nodeEnv === 'production') {
  throw new Error('JWT_SECRET must be set in production');
}

