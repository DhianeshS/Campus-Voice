import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  CLIENT_URL: z.string().default('http://localhost:5173'),

  // PostgreSQL Direct Connection on Supabase
  DATABASE_URL: z.string().optional(),
  DATABASE_SSL: z
    .string()
    .default('true')
    .transform((val) => val === 'true' || val === '1'),
  DATABASE_MAX_CONNECTIONS: z
    .string()
    .default('20')
    .transform((val) => parseInt(val, 10)),

  // Supabase Auth and API
  SUPABASE_URL: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_JWT_SECRET: z.string().optional(),

  // Email Notification Provider Configuration
  EMAIL_PROVIDER: z.enum(['resend', 'sendgrid', 'smtp', 'none']).default('none'),
  EMAIL_FROM: z.string().default('CampusVoice <notifications@campusvoice.edu>'),
  RESEND_API_KEY: z.string().optional(),
  SENDGRID_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
});

const parseEnv = () => {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.format());
    throw new Error('Environment configuration validation failed');
  }
  return parsed.data;
};

export const config = parseEnv();
export type Config = z.infer<typeof envSchema>;
