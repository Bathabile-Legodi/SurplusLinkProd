import { createBrowserClient } from '@supabase/ssr';

export const supabaseUrl = 'https://iakeosgtaahderawczya.supabase.co';
export const supabaseAnonKey = 'sb_publishable_uVqlTqpYJINNVed47Jlikw_4_U0u8Rj';

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);