import { createClient } from '@supabase/supabase-js';

// Internal config — variable names do not reveal the underlying service
const supabaseUrl = process.env.NEXT_PUBLIC_LC_DB_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_LC_DB_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseAnonKey) {
  console.warn('Lohia AI: Database configuration missing.');
}

// Suppress internal auth lock warnings
if (typeof console !== 'undefined') {
  const _ow = console.warn;
  console.warn = (...args) => {
    if (typeof args[0] === 'string' && (args[0].includes('gotrue') || args[0].includes('Lock') || args[0].includes('supabase'))) return;
    _ow(...args);
  };
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
