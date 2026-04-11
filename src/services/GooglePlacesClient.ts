import axios, { AxiosInstance } from 'axios';
import { config } from '../config';

export interface GooglePlacesSearchOptions {
  query?: string;
  location?: { latitude: number; longitude: number };
  radius?: number;
  type?: string;
  language?: string;
}

export interface GooglePlacesDetails {
  place_id: string;
  [key: string]: any;
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
  async textSearch(query: string, options: Partial<GooglePlacesSearchOptions> = {}): Promise<GooglePlacesDetails[]> {
    try {
      const params = {
        query,
        key: this.apiKey,
        language: options.language || 'en',
      };

      const response = await this.client.get(`${this.baseUrl}/place/textsearch/json`, { params });

      if (response.data.status !== 'OK') {
        throw new Error(`Google Places API error: ${response.data.status}`);
      }

      return response.data.results || [];
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
  ): Promise<GooglePlacesDetails[]> {
    try {
      const params = {
        location: `${location.latitude},${location.longitude}`,
        radius: options.radius || 1500,
        type: options.type,
        key: this.apiKey,
        language: options.language || 'en',
      };

      const response = await this.client.get(`${this.baseUrl}/place/nearbysearch/json`, { params });

      if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
        throw new Error(`Google Places API error: ${response.data.status}`);
      }

      return response.data.results || [];
    } catch (error) {
      throw new Error(`Failed to search nearby places: ${error}`);
    }
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
    return this.textSearch(`${name} ${city}`);
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
}
