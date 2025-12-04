export default () => ({
  port: parseInt(process.env.API_PORT || process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.POSTGRES_USER || 'inboxhunter',
    password: process.env.POSTGRES_PASSWORD || 'inboxhunter',
    database: process.env.POSTGRES_DB || 'inboxhunter',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'development-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },

  agent: {
    tokenExpiresIn: process.env.AGENT_TOKEN_EXPIRES_IN || '30d',
  },

  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || 'us-east-1',
    s3Bucket: process.env.S3_BUCKET || 'inboxhunter-storage',
  },
});

