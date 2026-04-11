const { GooglePlacesClient } = require('./src/services/GooglePlacesClient');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, './.env') });

async function debug() {
  const client = new GooglePlacesClient();
  const results = await client.textSearch('Barbershop in Darbhanga');
  if (results.length > 0) {
    const details = await client.getPlaceDetails(results[0].place_id);
    console.log(JSON.stringify(details.address_components, null, 2));
  } else {
    console.log('No results found');
  }
}

debug();
