import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://iakeosgtaahderawczya.supabase.co', 'sb_publishable_uVqlTqpYJINNVed47Jlikw_4_U0u8Rj');

async function test() {
  const { data: donors } = await supabase.from('donors').select('*').limit(1);
  console.log('Donors:', donors);
  const { data: ngos } = await supabase.from('ngos').select('*').limit(1);
  console.log('NGOs:', ngos);
}
test();
