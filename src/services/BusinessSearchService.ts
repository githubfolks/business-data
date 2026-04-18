import { IBusinessDocument } from '../models/Business';
import { prisma } from '../db/prisma';

export interface SearchQuery {
  text?: string;
  category?: string;
  city?: string;
  country?: string;
  rating_min?: number;
  status?: 'active' | 'inactive' | 'closed';
  latitude?: number;
  longitude?: number;
  radius_km?: number;
}

export interface SearchResult {
  businesses: IBusinessDocument[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export class BusinessSearchService {
  /**
   * Full-text search across business names, descriptions, and addresses
   */
  async fullTextSearch(query: string, page: number = 1, pageSize: number = 20): Promise<SearchResult> {
    const skip = (page - 1) * pageSize;

    const [businesses, total] = await Promise.all([
      (await prisma.$queryRaw`
        SELECT *, 
          ts_rank(to_tsvector('english', 
            name || ' ' || 
            COALESCE(description, '') || ' ' || 
            category || ' ' || 
            COALESCE(city, '') || ' ' || 
            COALESCE(state, '') || ' ' || 
            COALESCE(country, '')
          ), plainto_tsquery('english', ${query})) as rank
        FROM "Business"
        WHERE to_tsvector('english', 
          name || ' ' || 
          COALESCE(description, '') || ' ' || 
          category || ' ' || 
          COALESCE(city, '') || ' ' || 
          COALESCE(state, '') || ' ' || 
          COALESCE(country, '')
        ) @@ plainto_tsquery('english', ${query})
        ORDER BY rank DESC
        LIMIT ${pageSize} OFFSET ${skip}
      `) as unknown as IBusinessDocument[],
      prisma.business.count({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { category: { contains: query, mode: 'insensitive' } },
          ],
        },
      }),
    ]);

    return {
      businesses,
      total,
      page,
      page_size: pageSize,
      pages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Advanced search with filters
   */
  async search(filters: SearchQuery, page: number = 1, pageSize: number = 20): Promise<SearchResult> {
    const skip = (page - 1) * pageSize;
    const where: any = {};

    if (filters.text) {
      where.OR = [
        { name: { contains: filters.text, mode: 'insensitive' } },
        { description: { contains: filters.text, mode: 'insensitive' } },
        { category: { contains: filters.text, mode: 'insensitive' } },
      ];
    }

    if (filters.category) {
      where.OR = [
        { category: { contains: filters.category, mode: 'insensitive' } },
        { subcategories: { has: filters.category } },
      ];
    }

    if (filters.city) {
      where.city = { contains: filters.city, mode: 'insensitive' };
    }

    if (filters.country) {
      where.country = { contains: filters.country, mode: 'insensitive' };
    }

    if (filters.rating_min !== undefined) {
      where.rating = { gte: filters.rating_min };
    }

    if (filters.status) {
      where.status = filters.status;
    }

    const [businesses, total] = await Promise.all([
      prisma.business.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: filters.text ? { name: 'asc' } : { created_at: 'desc' },
      }),
      prisma.business.count({ where }),
    ]);

    return {
      businesses: businesses as unknown as IBusinessDocument[],
      total,
      page,
      page_size: pageSize,
      pages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Find businesses by category
   */
  async findByCategory(category: string, page: number = 1, pageSize: number = 20): Promise<SearchResult> {
    return this.search({ category }, page, pageSize);
  }

  /**
   * Find businesses by location (city/country)
   */
  async findByLocation(city: string, country?: string, page: number = 1, pageSize: number = 20): Promise<SearchResult> {
    return this.search({ city, country }, page, pageSize);
  }

  /**
   * Find businesses within radius
   */
  async findNearby(latitude: number, longitude: number, radiusKm: number = 5, pageSize: number = 50): Promise<IBusinessDocument[]> {
    const results = await prisma.$queryRaw<any[]>`
      SELECT *, 
        (6371 * acos(cos(radians(${latitude})) * cos(radians(latitude)) * 
                    cos(radians(longitude) - radians(${longitude})) + 
                    sin(radians(${latitude})) * sin(radians(latitude)))) as distance
      FROM "Business"
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL
      HAVING (6371 * acos(cos(radians(${latitude})) * cos(radians(latitude)) * 
                         cos(radians(longitude) - radians(${longitude})) + 
                         sin(radians(${latitude})) * sin(radians(latitude)))) <= ${radiusKm}
      ORDER BY distance ASC
      LIMIT ${pageSize}
    `;

    return results as IBusinessDocument[];
  }

  /**
   * Find businesses by name (exact or partial)
   */
  async findByName(name: string, page: number = 1, pageSize: number = 20): Promise<SearchResult> {
    return this.search({ text: name }, page, pageSize);
  }

  /**
   * Get business by ID
   */
  async getById(id: string): Promise<IBusinessDocument | null> {
    return (await prisma.business.findUnique({
      where: { id },
    })) as unknown as IBusinessDocument | null;
  }

  /**
   * Get business by external ID
   */
  async getByExternalId(externalId: string): Promise<IBusinessDocument | null> {
    return (await prisma.business.findUnique({
      where: { external_id: externalId },
    })) as unknown as IBusinessDocument | null;
  }

  /**
   * Find top-rated businesses
   */
  async findTopRated(category?: string, limit: number = 20): Promise<IBusinessDocument[]> {
    return (await prisma.business.findMany({
      where: category ? {
        OR: [
          { category: { contains: category, mode: 'insensitive' } },
          { subcategories: { has: category } },
        ],
      } : undefined,
      orderBy: [{ rating: 'desc' }, { review_count: 'desc' }],
      take: limit,
    })) as unknown as IBusinessDocument[];
  }

  /**
   * Get business statistics
   */
  async getStatistics(): Promise<{
    total_businesses: number;
    by_status: Record<string, number>;
    by_category: Record<string, number>;
    avg_rating: number;
  }> {
    const [totalCount, statusStats, categoryStats, ratingStats] = await Promise.all([
      prisma.business.count(),
      prisma.$queryRaw<any[]>`
        SELECT status, COUNT(*) as count FROM "Business" GROUP BY status
      `,
      prisma.$queryRaw<any[]>`
        SELECT category, COUNT(*) as count FROM "Business" GROUP BY category
      `,
      prisma.$queryRaw<any[]>`
        SELECT AVG(rating) as avg_rating FROM "Business" WHERE rating IS NOT NULL
      `,
    ]);

    const byStatus: Record<string, number> = {};
    statusStats.forEach((item: any) => {
      byStatus[item.status] = Number(item.count);
    });

    const byCategory: Record<string, number> = {};
    categoryStats.forEach((item: any) => {
      byCategory[item.category] = Number(item.count);
    });

    return {
      total_businesses: totalCount,
      by_status: byStatus,
      by_category: byCategory,
      avg_rating: ratingStats[0]?.avg_rating ? Number(ratingStats[0].avg_rating) : 0,
    };
  }

  /**
   * Find businesses for lead generation
   */
  async findLeads(
    category: string,
    options: { minReviews?: number; minRating?: number; country?: string; limit?: number } = {}
  ): Promise<IBusinessDocument[]> {
    const where: any = {
      status: 'active',
      verified: true,
      OR: [
        { category: { contains: category, mode: 'insensitive' } },
        { subcategories: { has: category } },
      ],
    };

    if (options.minReviews !== undefined) {
      where.review_count = { gte: options.minReviews };
    }

    if (options.minRating !== undefined) {
      where.rating = { gte: options.minRating };
    }

    if (options.country) {
      where.country = { contains: options.country, mode: 'insensitive' };
    }

    return (await prisma.business.findMany({
      where,
      orderBy: [{ rating: 'desc' }, { review_count: 'desc' }],
      take: options.limit || 100,
    })) as unknown as IBusinessDocument[];
  }

  /**
   * Perform real-time external search via Google Places (no DB ingestion)
   */
  async externalSearch(
    query: string, 
    limit: number = 20, 
    pageToken?: string,
    latitude?: number,
    longitude?: number,
    radius?: number
  ): Promise<{ businesses: IBusinessDocument[], next_page_token?: string }> {
    const { GooglePlacesClient } = require('./GooglePlacesClient');
    const { BusinessNormalizer } = require('./BusinessNormalizer');
    
    const googlePlacesClient = new GooglePlacesClient();
    console.log(`External search for: "${query}", limit: ${limit}, pageToken: ${pageToken ? 'PRESENT' : 'NONE'}, coords: ${latitude},${longitude}, radius: ${radius}`);
    
    let response;
    if (latitude && longitude) {
      // Use text search with location bias/restriction
      // We can append the location filter or use specific params if textSearch supports it
      // Standard Google API textSearch supports location and radius
      response = await googlePlacesClient.textSearch(query, { 
        pageToken,
        location: { latitude, longitude },
        radius: radius ? radius * 1000 : 1500 // Convert km to meters
      });
    } else {
      response = await googlePlacesClient.textSearch(query, { pageToken });
    }
    
    const { results: places, next_page_token } = response;
    console.log(`Google results: ${places.length}, fresh next_page_token: ${next_page_token ? 'YES' : 'NO'}`);
    
    if (places.length === 0) return { businesses: [] };

    // Get detailed info for results
    const detailedResults = await Promise.all(
      places.slice(0, limit).map((place: any) =>
        googlePlacesClient.getPlaceDetails(place.place_id).catch(() => null)
      )
    );

    return {
      businesses: detailedResults
        .filter(r => r !== null)
        .map(r => BusinessNormalizer.normalizeGooglePlace(r)) as IBusinessDocument[],
      next_page_token
    };
  }
}

