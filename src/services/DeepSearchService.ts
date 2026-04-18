import { GooglePlacesClient } from './GooglePlacesClient';
import { BusinessNormalizer } from './BusinessNormalizer';
import { IBusinessDocument } from '../models/Business';

export class DeepSearchService {
  private googleClient: GooglePlacesClient;

  constructor() {
    this.googleClient = new GooglePlacesClient();
  }

  /**
   * Perform a deep search by splitting the area into a grid
   * Goal: Gather up to 1000 records (REAL-TIME VERSION)
   */
  async performDeepSearch(query: string, latitude: number, longitude: number, radiusKm: number = 5): Promise<IBusinessDocument[]> {
    console.log(`Starting Real-time Deep Search for "${query}" in ${radiusKm}km radius around ${latitude},${longitude}`);
    
    // 1. Calculate a denser grid of search points for maximum coverage
    const searchPoints = this.generateGridPoints(latitude, longitude, radiusKm, 8);
    const allResults: IBusinessDocument[] = [];
    const processedPlaceIds = new Set<string>();

    for (const point of searchPoints) {
      if (allResults.length >= 1000) break;

      try {
        console.log(`Deep Search: Querying point ${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}`);
        // Use a smaller radius for each point to ensure we hit local results precisely
        const results = await this.googleClient.searchAllNew(query, {
          location: { latitude: point.lat, longitude: point.lng },
          radius: 1.5 // Tight 1.5km radius for each point in the 8x8 grid
        });
        
        for (const place of results) {
          const placeId = place.id || place.place_id;
          if (placeId && !processedPlaceIds.has(placeId)) {
            const normalized = BusinessNormalizer.normalizeAnyGooglePlace(place) as IBusinessDocument;
            allResults.push(normalized);
            processedPlaceIds.add(placeId);
          }
        }

        console.log(`Deep Search: Cumulative results: ${allResults.length}`);

        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.error(`Deep Search error at point ${point.lat},${point.lng}:`, error);
      }
    }

    return allResults;
  }

  /**
   * Generate a grid of points within a radius
   */
  private generateGridPoints(lat: number, lng: number, radiusKm: number, gridSize: number): { lat: number, lng: number }[] {
    const points: { lat: number, lng: number }[] = [];
    const step = (radiusKm * 2) / gridSize; // km per step
    const kmPerDegreeLat = 111.32;
    const kmPerDegreeLng = 111.32 * Math.cos(lat * (Math.PI / 180));

    const startLat = lat - (radiusKm / kmPerDegreeLat);
    const startLng = lng - (radiusKm / kmPerDegreeLng);

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const pLat = startLat + (i * step / kmPerDegreeLat);
        const pLng = startLng + (j * step / kmPerDegreeLng);
        
        // Only include if within circle radius
        const dist = this.calculateDistance(lat, lng, pLat, pLng);
        if (dist <= radiusKm) {
          points.push({ lat: pLat, lng: pLng });
        }
      }
    }

    return points;
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
