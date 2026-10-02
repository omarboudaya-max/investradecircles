import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseUrl = (rawUrl && typeof rawUrl === 'string' && rawUrl.trim() !== '' && rawUrl !== 'undefined')
  ? rawUrl.trim()
  : 'https://earhypzdxwbohdncdzvz.supabase.co';

const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseAnonKey = (rawKey && typeof rawKey === 'string' && rawKey.trim() !== '' && rawKey !== 'undefined')
  ? rawKey.trim()
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhcmh5cHpkeHdib2hkbmNkenZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1Mzg2OTksImV4cCI6MjA5NzExNDY5OX0.gMKrm7I88A5N-9YS_bi1HnMN1nrVfXMU7ilgrHGGgXw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

