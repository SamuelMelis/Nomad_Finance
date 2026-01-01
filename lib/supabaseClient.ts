import { createClient } from '@supabase/supabase-js';

// Credentials provided for the NomadFinance Project
const SUPABASE_URL = 'https://srvnuabapkvpffagkojo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_QzZnLKYoGG65WCHbaXnXPw_QL_AbGHj';

// Attempt to use environment variables if available (e.g. Vite/Next.js), otherwise fallback to hardcoded
// This allows you to override these in Vercel project settings using VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
const url = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_SUPABASE_URL) || SUPABASE_URL;
const key = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_SUPABASE_ANON_KEY) || SUPABASE_ANON_KEY;

export const supabase = createClient(url, key);