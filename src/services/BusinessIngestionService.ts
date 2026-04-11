import { IBusinessDocument } from '../models/Business';
import { BusinessNormalizer } from './BusinessNormalizer';
import { GooglePlacesClient, GooglePlacesSearchOptions } from './GooglePlacesClient';
import { prisma } from '../db/prisma';

export interface DataIngestionOptions {
  source: 'google_places' | 'yelp' | 'custom';
  batchSize?: number;
  skipDuplicates?: boolean;
}

export class BusinessIngestionService {
  private googlePlacesClient: GooglePlacesClient;

  constructor() {
    this.googlePlacesClient = new GooglePlacesClient();
  }

  /**
   * Ingest businesses from Google Places API
   */
  async ingestFromGooglePlaces(
    query: string,
    options: Partial<GooglePlacesSearchOptions & DataIngestionOptions> = {}
  ): Promise<IBusinessDocument[]> {
    const results = await this.googlePlacesClient.textSearch(query, options);
    const ingested: IBusinessDocument[] = [];

    for (const place of results) {
      try {
        const details = await this.googlePlacesClient.getPlaceDetails(place.place_id);
        const normalized = BusinessNormalizer.normalizeGooglePlace(details);
        const document = await this.saveNormalizedBusiness(normalized, options);
        if (document) {
          ingested.push(document);
        }
      } catch (error) {
        console.error(`Failed to ingest place ${place.place_id}:`, error);
      }
    }

    return ingested;
  }

  /**
   * Ingest single business by place ID
   */
  async ingestGooglePlaceById(placeId: string): Promise<IBusinessDocument | null> {
    try {
      const details = await this.googlePlacesClient.getPlaceDetails(placeId);
      const normalized = BusinessNormalizer.normalizeGooglePlace(details);
      return this.saveNormalizedBusiness(normalized);
    } catch (error) {
      console.error(`Failed to ingest place ${placeId}:`, error);
      return null;
    }
  }

  /**
   * Ingest businesses from nearby search
   */
  async ingestNearby(
    location: { latitude: number; longitude: number },
    options: Partial<GooglePlacesSearchOptions & DataIngestionOptions> = {}
  ): Promise<IBusinessDocument[]> {
    const results = await this.googlePlacesClient.nearbySearch(location, options);
    const ingested: IBusinessDocument[] = [];

    for (const place of results) {
      try {
        const details = await this.googlePlacesClient.getPlaceDetails(place.place_id);
        const normalized = BusinessNormalizer.normalizeGooglePlace(details);
        const document = await this.saveNormalizedBusiness(normalized, options);
        if (document) {
          ingested.push(document);
        }
      } catch (error) {
        console.error(`Failed to ingest place ${place.place_id}:`, error);
      }
    }

    return ingested;
  }

  /**
   * Ingest multiple businesses from array of place data
   */
  async ingestBatch(businesses: any[], source: 'google_places' | 'yelp' = 'google_places'): Promise<IBusinessDocument[]> {
    const ingested: IBusinessDocument[] = [];

    for (const business of businesses) {
      try {
        let normalized;
        if (source === 'google_places') {
          normalized = BusinessNormalizer.normalizeGooglePlace(business);
        } else if (source === 'yelp') {
          normalized = BusinessNormalizer.normalizeYelpBusiness(business);
        } else {
          continue;
        }

        const document = await this.saveNormalizedBusiness(normalized);
        if (document) {
          ingested.push(document);
        }
      } catch (error) {
        console.error(`Failed to ingest business:`, error);
      }
    }

    return ingested;
  }

  /**
   * Save normalized business data
   */
  private async saveNormalizedBusiness(
    normalized: Partial<IBusinessDocument>,
    options: Partial<DataIngestionOptions> = { source: 'google_places' }
  ): Promise<IBusinessDocument | null> {
    try {
      const existingBusiness = await prisma.business.findUnique({
        where: { external_id: normalized.external_id! },
      });

      if (existingBusiness && options.skipDuplicates) {
        return existingBusiness as unknown as IBusinessDocument;
      }

      if (existingBusiness) {
        // Update existing business
        return (await prisma.business.update({
          where: { external_id: normalized.external_id! },
          data: {
            ...normalized,
            opening_hours: normalized.opening_hours ? (normalized.opening_hours as any) : undefined,
            attributes: normalized.attributes ? (normalized.attributes as any) : undefined,
            source_data: normalized.source_data ? (normalized.source_data as any) : undefined,
            last_synced: new Date(),
          },
        })) as unknown as IBusinessDocument;
      }

      // Create new business
      return (await prisma.business.create({
        data: {
          external_id: normalized.external_id!,
          provider: (normalized.provider || 'custom') as any,
          name: normalized.name!,
          description: normalized.description,
          category: normalized.category!,
          subcategories: normalized.subcategories || [],
          street: normalized.street,
          city: normalized.city,
          state: normalized.state,
          postal_code: normalized.postal_code,
          country: normalized.country,
          latitude: normalized.latitude,
          longitude: normalized.longitude,
          phone_numbers: normalized.phone_numbers || [],
          website: normalized.website,
          email: normalized.email,
          rating: normalized.rating,
          review_count: normalized.review_count,
          opening_hours: normalized.opening_hours ? (normalized.opening_hours as any) : null,
          attributes: normalized.attributes ? (normalized.attributes as any) : null,
          verified: normalized.verified || false,
          status: (normalized.status || 'active') as any,
          source_data: normalized.source_data ? (normalized.source_data as any) : null,
          last_synced: new Date(),
        },
      })) as unknown as IBusinessDocument;
    } catch (error) {
      console.error('Failed to save business:', error);
      return null;
    }
  }

  /**
   * Update business data from external source
   */
  async syncBusiness(businessId: string): Promise<IBusinessDocument | null> {
    try {
      const business = await prisma.business.findUnique({
        where: { id: businessId },
      });

      if (!business) return null;

      if (business.provider === 'google_places') {
        const placeId = business.external_id.replace('google_', '');
        const details = await this.googlePlacesClient.getPlaceDetails(placeId);
        const normalized = BusinessNormalizer.normalizeGooglePlace(details);

        return (await prisma.business.update({
          where: { id: businessId },
          data: {
            ...normalized,
            opening_hours: normalized.opening_hours ? (normalized.opening_hours as any) : undefined,
            attributes: normalized.attributes ? (normalized.attributes as any) : undefined,
            source_data: normalized.source_data ? (normalized.source_data as any) : undefined,
            last_synced: new Date(),
          },
        })) as unknown as IBusinessDocument;
      }

      return null;
    } catch (error) {
      console.error(`Failed to sync business ${businessId}:`, error);
      return null;
    }
  }

  /**
   * Batch sync businesses
   */
  async syncBusinesses(limit: number = 100): Promise<number> {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const businesses = await prisma.business.findMany({
        where: {
          provider: 'google_places',
          OR: [
            { last_synced: null },
            { last_synced: { lt: sevenDaysAgo } },
          ],
        },
        take: limit,
      });

      let synced = 0;
      for (const business of businesses) {
        const result = await this.syncBusiness(business.id);
        if (result) synced++;
      }

      return synced;
    } catch (error) {
      console.error('Failed to sync businesses:', error);
      return 0;
    }
  }
}
