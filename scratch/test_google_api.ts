import axios from 'axios';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.join(__dirname, '../.env') });

const apiKey = process.env.GOOGLE_PLACES_API_KEY;

async function testApi() {
  console.log('Testing Google Places API (New)...');
  console.log('API Key (first 5 chars):', apiKey?.substring(0, 5));

  const url = 'https://places.googleapis.com/v1/places:searchText';
  const headers = {
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': apiKey,
    'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress'
  };

  const data = {
    textQuery: 'barbershop in New York',
    maxResultCount: 1
  };

  try {
    const response = await axios.post(url, data, { headers });
    console.log('Success!');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    console.error('FAILED!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error Message:', error.message);
    }
  }
}

testApi();
