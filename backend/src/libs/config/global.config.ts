export const GlobalConfig = () => ({
  typeorm: {
    url: process.env.DATABASE_URL,
    logging: process.env.ENABLE_DATABASE_LOGGING
      ? process.env.ENABLE_DATABASE_LOGGING === 'true'
      : false,
  },
  server: {
    port: process.env.BACKEND_SERVER_PORT || 6969,
  },
});
