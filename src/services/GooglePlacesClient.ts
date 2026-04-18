import axios, { AxiosInstance } from 'axios';
import { config } from '../config';

export interface GooglePlacesSearchOptions {
  query?: string;
  location?: { latitude: number; longitude: number };
  radius?: number;
  type?: string;
  language?: string;
  pageToken?: string;
}

export interface GooglePlacesDetails {
  place_id: string;
  [key: string]: any;
}

export interface GooglePlacesResponse {
  results: GooglePlacesDetails[];
  next_page_token?: string;
  status: string;
  error_message?: string;
}

export class GooglePlacesClient {
  private client: AxiosInstance;
  private baseUrl = 'https://maps.googleapis.com/maps/api';
  private apiKey: string;

  constructor() {
    this.apiKey = config.googlePlacesApiKey;
    this.client = axios.create({
      timeout: 30000,
    });
  }

  /**
   * Search for places using text query
   */
  async textSearch(query: string, options: Partial<GooglePlacesSearchOptions> = {}): Promise<{ results: GooglePlacesDetails[], next_page_token?: string }> {
    try {
      const params: any = {
        query,
        key: this.apiKey,
        language: options.language || 'en',
      };

      if (options.pageToken) {
        params.pagetoken = options.pageToken;
      }

      if (options.location) {
        params.location = `${options.location.latitude},${options.location.longitude}`;
      }

      if (options.radius) {
        params.radius = options.radius;
      }

      const response = await this.client.get(`${this.baseUrl}/place/textsearch/json`, { params });

      if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
        throw new Error(`Google Places API error: ${response.data.status}${response.data.error_message ? ` - ${response.data.error_message}` : ''}`);
      }

      return {
        results: response.data.results || [],
        next_page_token: response.data.next_page_token
      };
    } catch (error) {
      throw new Error(`Failed to search places: ${error}`);
    }
  }

  /**
   * Search for places by location and type
   */
  async nearbySearch(
    location: { latitude: number; longitude: number },
    options: Partial<GooglePlacesSearchOptions> = {}
  ): Promise<{ results: GooglePlacesDetails[], next_page_token?: string }> {
    try {
      const params: any = {
        location: `${location.latitude},${location.longitude}`,
        radius: options.radius || 1500,
        type: options.type,
        key: this.apiKey,
        language: options.language || 'en',
      };

      if (options.pageToken) {
        params.pagetoken = options.pageToken;
      }

      const response = await this.client.get(`${this.baseUrl}/place/nearbysearch/json`, { params });

      if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
        throw new Error(`Google Places API error: ${response.data.status}${response.data.error_message ? ` - ${response.data.error_message}` : ''}`);
      }

      return {
        results: response.data.results || [],
        next_page_token: response.data.next_page_token
      };
    } catch (error) {
      throw new Error(`Failed to search nearby places: ${error}`);
    }
  }

  /**
   * Fetch multiple pages of results (up to 3 pages / 60 results)
   */
  async searchAll(query: string, maxPages: number = 3): Promise<GooglePlacesDetails[]> {
    let allResults: GooglePlacesDetails[] = [];
    let pageToken: string | undefined;
    let pagesFetched = 0;

    do {
      const response = await this.textSearch(query, { pageToken });
      allResults = [...allResults, ...response.results];
      pageToken = response.next_page_token;
      pagesFetched++;

      // Google requires a short delay before the next_page_token becomes valid
      if (pageToken && pagesFetched < maxPages) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } while (pageToken && pagesFetched < maxPages);

    return allResults;
  }

  /**
   * Get detailed information about a place
   */
  async getPlaceDetails(placeId: string, fields?: string[]): Promise<GooglePlacesDetails> {
    try {
      const defaultFields = [
        'place_id',
        'name',
        'formatted_address',
        'address_components',
        'geometry',
        'rating',
        'user_ratings_total',
        'formatted_phone_number',
        'website',
        'business_status',
        'types',
      ];

      const params = {
        place_id: placeId,
        fields: (fields || defaultFields).join(','),
        key: this.apiKey,
        language: 'en',
      };

      const response = await this.client.get(`${this.baseUrl}/place/details/json`, { params });

      if (response.data.status !== 'OK') {
        throw new Error(`Google Places API error: ${response.data.status}`);
      }

      return response.data.result;
    } catch (error) {
      throw new Error(`Failed to get place details: ${error}`);
    }
  }

  /**
   * Search for places by name and city
   */
  async findByNameAndCity(name: string, city: string): Promise<GooglePlacesDetails[]> {
    const response = await this.textSearch(`${name} ${city}`);
    return response.results;
  }

  /**
   * Autocomplete place names
   */
  async autoComplete(input: string, options: { sessionToken?: string; radius?: number } = {}): Promise<any[]> {
    try {
      const params = {
        input,
        key: this.apiKey,
        sessionToken: options.sessionToken,
        radius: options.radius || 1000,
      };

      const response = await this.client.get(`${this.baseUrl}/place/autocomplete/json`, { params });

      if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
        throw new Error(`Google Places API error: ${response.data.status}`);
      }

      return response.data.predictions || [];
    } catch (error) {
      throw new Error(`Failed to autocomplete: ${error}`);
    }
  }

  /**
   * Geocode a pincode/address to get coordinates
   */
  async geocodePincode(pincode: string): Promise<{ latitude: number, longitude: number } | null> {
    try {
      const params = {
        address: pincode,
        key: this.apiKey,
      };

      const response = await this.client.get(`${this.baseUrl}/geocode/json`, { params });

      if (response.data.status !== 'OK') {
        if (response.data.status === 'ZERO_RESULTS') return null;
        throw new Error(`Google Geocoding API error: ${response.data.status}`);
      }

      const result = response.data.results[0];
      const { lat, lng } = result.geometry.location;

      return { latitude: lat, longitude: lng };
    } catch (error) {
      throw new Error(`Failed to geocode pincode: ${error}`);
    }
  }
}
