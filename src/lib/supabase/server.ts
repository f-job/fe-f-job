import { createClient } from '@supabase/supabase-js';
import { createMockSupabaseClient } from '@/lib/mock/client';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const useMock = !supabaseUrl || supabaseUrl === 'https://your-project.supabase.co';

/**
 * Server-side Supabase client using the service role key.
 * Falls back to an in-memory mock client when Supabase is not configured.
 */
export function createServerSupabaseClient() {
  if (useMock) {
    // Return mock client typed to match SupabaseClient interface
    return createMockSupabaseClient() as unknown as ReturnType<typeof createClient>;
  }
  return createClient(supabaseUrl!, supabaseServiceRoleKey!, {
    auth: { persistSession: false },
  });
}
