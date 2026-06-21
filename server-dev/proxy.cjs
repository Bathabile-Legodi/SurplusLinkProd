const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const KEY = process.env.GOOGLE_MAPS_SERVER_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;
if (!KEY) {
  console.warn('Warning: GOOGLE_MAPS_SERVER_KEY not set. Proxy will return 400 for requests.');
}

app.get('/api/places/autocomplete', async (req, res) => {
  const input = req.query.input || '';
  const country = req.query.country;
  if (!KEY) return res.status(400).json({ error: 'missing_api_key' });

  const params = new URLSearchParams({ input: String(input), key: KEY });
  if (country) params.append('components', `country:${country}`);

  try {
    const r = await fetch(`https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`);
    const body = await r.text();
    res.status(r.status).type('application/json').send(body);
  } catch (e) {
    res.status(500).json({ error: 'proxy_error', details: String(e) });
  }
});

app.get('/api/places/details', async (req, res) => {
  const place_id = req.query.place_id || '';
  const fields = req.query.fields || 'formatted_address,address_component';
  if (!KEY) return res.status(400).json({ error: 'missing_api_key' });

  const params = new URLSearchParams({ place_id: String(place_id), key: KEY, fields: String(fields) });
  try {
    const r = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`);
    const body = await r.text();
    res.status(r.status).type('application/json').send(body);
  } catch (e) {
    res.status(500).json({ error: 'proxy_error', details: String(e) });
  }
});

app.listen(port, () => {
  console.log(`Local Places proxy listening at http://localhost:${port}`);
});
