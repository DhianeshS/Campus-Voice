import app from './app';
import { config } from './config/env';
import { closeDbPool } from './db/database';

const server = app.listen(config.PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 CampusVoice Backend API listening on port ${config.PORT}`);
  console.log(`🌐 Environment: ${config.NODE_ENV}`);
  console.log(`🩺 Health check: http://localhost:${config.PORT}/api/health`);
  console.log(`📡 Base API URL: http://localhost:${config.PORT}/api/v1`);
  console.log(`===============================================`);
});

const handleShutdown = async (signal: string) => {
  console.log(`\nReceived ${signal}. Shutting down CampusVoice API server gracefully...`);
  server.close(async () => {
    try {
      await closeDbPool();
      console.log('PostgreSQL connection pool drained successfully.');
    } catch (err) {
      console.error('Error closing database pool:', err);
    }
    console.log('HTTP server closed. Exiting process.');
    process.exit(0);
  });

  // Force exit after 10 seconds if graceful close hangs
  setTimeout(() => {
    console.error('Forcing shutdown after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

export default server;
