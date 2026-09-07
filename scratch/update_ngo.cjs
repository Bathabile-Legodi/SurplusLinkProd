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
  const { error, data } = await supabase
    .from('ngos')
    .update({ 
      address_components: {
        city: "Johannesburg",
        country: "South Africa",
        formatted: "87 Fulham Rd, Brixton, Johannesburg, 2092, South Africa",
        lat: -26.1915593,
        lng: 27.9984522,
        postalCode: "2092",
        province: "Gauteng",
        streetName: "Fulham Road",
        streetNumber: "87",
        suburb: "Brixton"
      }
    })
    .eq('organization_name', 'Hope Shelter')
    .select();
  
  if (error) {
    console.error("Update failed:", error);
  } else {
    console.log("Update successful! Data:", data);
  }
}

main();
