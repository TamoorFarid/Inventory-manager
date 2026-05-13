const fallbackUrl = 'https://example.supabase.co';
const fallbackAnonKey = 'public-anon-key';

export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? fallbackUrl,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? fallbackAnonKey,
  isSupabaseConfigured:
    Boolean(import.meta.env.VITE_SUPABASE_URL) &&
    Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY),
};
