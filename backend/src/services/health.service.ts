import { config } from '../config/env';
import { isSupabaseConfigured } from '../db/supabase';
import { testDatabaseConnection } from '../db/database';

export interface HealthCheckData {
  status: 'ok' | 'degraded';
  service: string;
  version: string;
  timestamp: string;
  environment: string;
  uptimeSeconds: number;
  memoryUsageMb: number;
  database: {
    configured: boolean;
    provider: string;
    connected?: boolean;
    error?: string;
  };
}

export const healthService = {
  async getHealthStatus(): Promise<HealthCheckData> {
    const memory = process.memoryUsage();
    const dbTest = await testDatabaseConnection();

    return {
      status: 'ok',
      service: 'CampusVoice API',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
      environment: config.NODE_ENV,
      uptimeSeconds: process.uptime(),
      memoryUsageMb: Math.round((memory.heapUsed / 1024 / 1024) * 100) / 100,
      database: {
        configured: isSupabaseConfigured() || Boolean(config.DATABASE_URL),
        provider: dbTest.provider,
        connected: dbTest.connected,
        error: dbTest.error,
      },
    };
  },
};
