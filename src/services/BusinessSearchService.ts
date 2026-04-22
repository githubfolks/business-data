import { IBusinessDocument } from '../models/Business';
import { DeepSearchService } from './DeepSearchService';
import { GooglePlacesClient } from './GooglePlacesClient';
import { BusinessNormalizer } from './BusinessNormalizer';

export interface SearchQuery {
  text?: string;
  category?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  radius_km?: number;
}

export class BusinessSearchService {
  /**
   * Perform real-time external search via Google Places
   * Now synchronous for up to 1000 records as per "Deep Search" logic.
   */
  async externalSearch(
    query: string, 
    limit: number = 20, 
    pageToken?: string,
    latitude?: number,
    longitude?: number,
    radius?: number,
    country?: string,
    deepSearch: boolean = true
  ): Promise<{ businesses: IBusinessDocument[], next_page_token?: string }> {
    const googlePlacesClient = new GooglePlacesClient();
    const deepSearchService = new DeepSearchService();
    
    console.log(`Performing Real-time External search for: "${query}" (Country: ${country || 'Any'}, Mode: ${deepSearch ? 'DEEP' : 'FAST'})`);
    
    // Trigger Deep Search only if explicitly requested
    if (deepSearch && latitude && longitude && !pageToken) {
      const results = await deepSearchService.performDeepSearch(query, latitude, longitude, radius || 5);
      return {
        businesses: results.slice(0, 1000)
      };
    }

    // Default search logic
    if (latitude && longitude) {
      console.log(`Places API (New): Standard search for "${query}" near ${latitude},${longitude}`);
      const places = await googlePlacesClient.searchAllNew(query, {
        location: { latitude, longitude },
        radius: radius || 5
      });
      
      const businesses = places.map((place: any) => BusinessNormalizer.normalizeAnyGooglePlace(place)) as IBusinessDocument[];
      
      return {
        businesses: (businesses as any[]).filter(b => b.name)
      };
    }

    // Even if no location is provided, try the New API first to get Phone/Website
    if (!pageToken) {
      console.log(`Places API (New): Global search for "${query}"`);
      const places = await googlePlacesClient.searchAllNew(query, {
        radius: radius || 5
      });
      
      if (places && places.length > 0) {
        const businesses = places.map((place: any) => BusinessNormalizer.normalizeAnyGooglePlace(place)) as IBusinessDocument[];
        return {
          businesses: (businesses as any[]).filter(b => b.name)
        };
      }
    }

    // Fallback to old API for global searches or if no location is provided
    const response = await googlePlacesClient.textSearch(query, { pageToken });
    const { results: places, next_page_token } = response;
    const businesses = places.map((place: any) => BusinessNormalizer.normalizeAnyGooglePlace(place)) as IBusinessDocument[];

    return {
      businesses: businesses.slice(0, limit),
      next_page_token
    };
  }

  /**
   * Hydrate a business with detailed information (On-Demand)
   * Purely real-time version.
   */
  async hydrateBusinessDetails(business: IBusinessDocument): Promise<IBusinessDocument | null> {
    if (!business || !business.external_id?.startsWith('google_')) return business;

    const googlePlacesClient = new GooglePlacesClient();
    const googleId = business.external_id.replace('google_', '');
    
    try {
      console.log(`Hydrating business details for (Real-time): ${business.name}`);
      const details = await googlePlacesClient.getPlaceDetails(googleId);
      const normalized = BusinessNormalizer.normalizeAnyGooglePlace(details);
      
      return { ...business, ...normalized } as IBusinessDocument;
    } catch (error) {
      console.error(`Failed to hydrate business ${business.id}:`, error);
      return business;
    }
  }
}

