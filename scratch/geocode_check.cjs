const fs = require('fs');

const rawEnv = fs.readFileSync('.env', 'utf8');
const env = rawEnv.split(/\r?\n/).reduce((acc, line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) acc[match[1]] = match[2].trim().replace(/^['"](.*)['"]$/, '$1');
  return acc;
}, {});

async function main() {
  const address = "87 Fulham Rd, Brixton, Johannesburg, 2092, South Africa";
  const apiKey = env.VITE_GOOGLE_MAPS_API_KEY;
  const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&components=country:ZA&key=${apiKey}`);
  const data = await res.json();
  console.log(JSON.stringify(data.results[0].geometry.location, null, 2));
}

main();
