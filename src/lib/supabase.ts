import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iakeosgtaahderawczya.supabase.co';
const supabaseAnonKey = 'sb_publishable_uVqlTqpYJINNVed47Jlikw_4_U0u8Rj';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);