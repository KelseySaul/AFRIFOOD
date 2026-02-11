import { createClient } from '@supabase/supabase-js';

// These variables are pulled from your .env file automatically by Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Throw a friendly error if keys are missing
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase Keys! Check your .env file.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);