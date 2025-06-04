export const GlobalConfig = () => ({
  typeorm: {
    url: process.env.DATABASE_URL,
    logging: process.env.ENABLE_DATABASE_LOGGING
      ? process.env.ENABLE_DATABASE_LOGGING === 'true'
      : false,
  },
  server: {
    port: process.env.BACKEND_SERVER_PORT || 6969,
    env: process.env.NODE_ENV ?? 'development',
  },
  jwt: {
    refresh_token_secret: process.env.REFRESH_JWT_SECRET,
    refresh_token_expiration_minutes:
      process.env.REFRESH_JWT_EXPIRATION_MINUTES,
    access_token_secret: process.env.ACCESS_JWT_SECRET,
    access_token_expiration_minutes: process.env.ACCESS_JWT_EXPIRATION_MINUTES,
  },
  cache: {
    url: process.env.REDIS_URL || 'redis://default:@localhost:6379',
    ttl: process.env.REDIS_TTL || 15 * 60 * 1000,
  },
});
