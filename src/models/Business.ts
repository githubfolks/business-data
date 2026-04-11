import { prisma } from '../db/prisma';

export interface IAddress {
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

export interface IPhoneNumber {
  type: 'phone' | 'mobile' | 'fax';
  number: string;
}

export interface IOpeningHours {
  day_of_week: number;
  open: string;
  close: string;
}

export interface IBusinessDocument {
  id: string;
  external_id: string;
  provider: 'google_places' | 'yelp' | 'custom';
  name: string;
  description?: string | null;
  category: string;
  subcategories?: string[];
  street?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  phone_numbers?: string[];
  website?: string | null;
  email?: string | null;
  rating?: number | null;
  review_count?: number | null;
  opening_hours?: any | null;
  attributes?: any | null;
  verified: boolean;
  verification_date?: Date | null;
  status: 'active' | 'inactive' | 'closed';
  source_data?: any | null;
  created_at: Date;
  updated_at: Date;
  last_synced?: Date | null;
  search_text?: string | null;
}

/**
 * Helper to safely serialize JSON data for Prisma
 */
function serializeJson(data: any): any | undefined {
  if (data === null || data === undefined) return undefined;
  return data;
}

export const Business = {
  /**
   * Create a new business record
   */
  async create(data: Omit<IBusinessDocument, 'id' | 'created_at' | 'updated_at'>) {
    return prisma.business.create({
      data: {
        external_id: data.external_id,
        provider: data.provider as any,
        name: data.name,
        description: data.description,
        category: data.category,
        subcategories: data.subcategories || [],
        street: data.street,
        city: data.city,
        state: data.state,
        postal_code: data.postal_code,
        country: data.country,
        latitude: data.latitude,
        longitude: data.longitude,
        phone_numbers: data.phone_numbers || [],
        website: data.website,
        email: data.email,
        rating: data.rating,
        review_count: data.review_count,
        opening_hours: serializeJson(data.opening_hours),
        attributes: serializeJson(data.attributes),
        verified: data.verified || false,
        verification_date: data.verification_date,
        status: data.status || 'active',
        source_data: serializeJson(data.source_data),
        search_text: data.search_text,
      },
    }) as unknown as IBusinessDocument;
  },

  /**
   * Find a business by ID
   */
  async findById(id: string) {
    return (await prisma.business.findUnique({
      where: { id },
    })) as unknown as IBusinessDocument | null;
  },

  /**
   * Find a business by external ID
   */
  async findByExternalId(externalId: string) {
    return (await prisma.business.findUnique({
      where: { external_id: externalId },
    })) as unknown as IBusinessDocument | null;
  },

  /**
   * Find multiple businesses
   */
  async find(filter: Record<string, any> = {}) {
    return (await prisma.business.findMany({
      where: filter,
    })) as unknown as IBusinessDocument[];
  },

  /**
   * Find first matching business
   */
  async findOne(filter: Record<string, any>) {
    return (await prisma.business.findFirst({
      where: filter,
    })) as unknown as IBusinessDocument | null;
  },

  /**
   * Count documents
   */
  async countDocuments(filter: Record<string, any> = {}) {
    return prisma.business.count({
      where: filter,
    });
  },

  /**
   * Update a business
   */
  async updateOne(filter: Record<string, any>, update: Record<string, any>) {
    const business = await prisma.business.findFirst({
      where: filter,
    });

    if (!business) return null;

    return (await prisma.business.update({
      where: { id: business.id },
      data: {
        ...update,
        opening_hours: update.opening_hours ? serializeJson(update.opening_hours) : undefined,
        attributes: update.attributes ? serializeJson(update.attributes) : undefined,
        source_data: update.source_data ? serializeJson(update.source_data) : undefined,
      },
    })) as unknown as IBusinessDocument;
  },

  /**
   * Delete a business
   */
  async deleteOne(filter: Record<string, any>) {
    const business = await prisma.business.findFirst({
      where: filter,
    });

    if (!business) return null;

    return prisma.business.delete({
      where: { id: business.id },
    });
  },

  /**
   * Delete multiple businesses
   */
  async deleteMany(filter: Record<string, any> = {}) {
    return prisma.business.deleteMany({
      where: filter,
    });
  },

  /**
   * Bulk insert
   */
  async insertMany(data: Array<Omit<IBusinessDocument, 'id' | 'created_at' | 'updated_at'>>) {
    return (await prisma.business.createMany({
      data: data.map((item) => ({
        external_id: item.external_id,
        provider: item.provider as any,
        name: item.name,
        description: item.description,
        category: item.category,
        subcategories: item.subcategories || [],
        street: item.street,
        city: item.city,
        state: item.state,
        postal_code: item.postal_code,
        country: item.country,
        latitude: item.latitude,
        longitude: item.longitude,
        phone_numbers: item.phone_numbers || [],
        website: item.website,
        email: item.email,
        rating: item.rating,
        review_count: item.review_count,
        opening_hours: serializeJson(item.opening_hours),
        attributes: serializeJson(item.attributes),
        verified: item.verified || false,
        verification_date: item.verification_date,
        status: item.status || 'active',
        source_data: serializeJson(item.source_data),
        search_text: item.search_text,
      })),
      skipDuplicates: true,
    })) as unknown as IBusinessDocument[];
  },

  /**
   * Full-text search using PostgreSQL
   */
  async fullTextSearch(query: string) {
    return (await prisma.$queryRaw`
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
    `) as unknown as IBusinessDocument[];
  },

  /**
   * Spatial query for nearby businesses
   */
  async nearby(latitude: number, longitude: number, radiusKm: number = 1.5) {
    return (await prisma.$queryRaw`
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
    `) as unknown as IBusinessDocument[];
  },
};

