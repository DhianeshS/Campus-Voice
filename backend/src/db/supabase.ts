import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/env';

let supabaseClient: SupabaseClient | null = null;

const getSupabaseKey = (): string | undefined => {
  if (
    config.SUPABASE_SERVICE_ROLE_KEY &&
    config.SUPABASE_SERVICE_ROLE_KEY !== 'PASTE_SERVICE_ROLE_KEY_HERE'
  ) {
    return config.SUPABASE_SERVICE_ROLE_KEY;
  }
  return config.SUPABASE_ANON_KEY;
};

export const isSupabaseConfigured = (): boolean => {
  const key = getSupabaseKey();
  return Boolean(
    config.SUPABASE_URL &&
    key &&
    !config.SUPABASE_URL.includes('your-project')
  );
};

export const getSupabaseClient = (): SupabaseClient => {
  if (supabaseClient) {
    return supabaseClient;
  }

  const key = getSupabaseKey();
  if (!isSupabaseConfigured() || !key) {
    throw new Error(
      'Supabase is not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY in your .env file.'
    );
  }

  supabaseClient = createClient(config.SUPABASE_URL!, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return supabaseClient;
};
