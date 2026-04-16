import { GooglePlacesClient } from './src/services/GooglePlacesClient';
import { config } from './src/config';

async function checkCount() {
  const client = new GooglePlacesClient();
  const query = 'barbershop in 10001';
  
  console.log(`Searching for: ${query}`);
  try {
    const results = await client.searchAll(query, 3);
    console.log(`Total records found across 3 pages: ${results.length}`);
  } catch (error) {
    console.error('Search failed:', error);
  }
}

checkCount();
