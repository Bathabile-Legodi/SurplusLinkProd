const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const rawEnv = fs.readFileSync('.env', 'utf8');
const env = rawEnv.split(/\r?\n/).reduce((acc, line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) acc[match[1]] = match[2].trim().replace(/^['"](.*)['"]$/, '$1');
  return acc;
}, {});

console.log(env.VITE_SUPABASE_URL)

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function main() {
  const { data: donors } = await supabase.from('donors').select('id, organization_name, address, address_components').limit(5)
  console.log("DONORS:\n", JSON.stringify(donors, null, 2))

  const { data: ngos } = await supabase.from('ngo_profiles').select('id, organization_name, address, latitude, longitude').limit(5)
  console.log("\nNGOS:\n", JSON.stringify(ngos, null, 2))
  
  const { data: network } = await supabase.from('donor_community_network').select('*').limit(5)
  console.log("\nNETWORK:\n", JSON.stringify(network, null, 2))
}

main();
