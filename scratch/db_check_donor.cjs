const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const rawEnv = fs.readFileSync('.env', 'utf8');
const env = rawEnv.split(/\r?\n/).reduce((acc, line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) acc[match[1]] = match[2].trim().replace(/^['"](.*)['"]$/, '$1');
  return acc;
}, {});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function main() {
  const { data: donors } = await supabase.from('donors').select('id, business_name, address, address_components').eq('id', '3cd84e66-37e3-4a8a-bd93-1dfa6bf1a1bd')
  console.log("DONOR Fresh Market:\n", JSON.stringify(donors, null, 2))
}

main();
