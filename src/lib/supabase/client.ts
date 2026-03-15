import { createClient } from '@supabase/supabase-js';
import { createMockSupabaseClient } from '@/lib/mock/client';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const useMock = !supabaseUrl || supabaseUrl === 'https://your-project.supabase.co';

/**
 * Browser-side Supabase client using the anon key.
 * Falls back to an in-memory mock client when Supabase is not configured.
 */
export const supabase = useMock
  ? (createMockSupabaseClient() as unknown as ReturnType<typeof createClient>)
  : createClient(supabaseUrl!, supabaseAnonKey!);
