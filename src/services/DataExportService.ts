import { prisma } from '../db/prisma';
import { IBusinessDocument } from '../models/Business';

export interface ExportOptions {
  format: 'json' | 'csv';
  fields?: string[];
  filters?: Record<string, any>;
}

export class DataExportService {
  /**
   * Export businesses to JSON
   */
  async exportToJson(filters?: Record<string, any>): Promise<IBusinessDocument[]> {
    return (await prisma.business.findMany({
      where: filters || {},
    })) as IBusinessDocument[];
  }

  /**
   * Export businesses to CSV
   */
  async exportToCsv(filters?: Record<string, any>): Promise<string> {
    const businesses = await prisma.business.findMany({
      where: filters || {},
    });

    if (businesses.length === 0) {
      return '';
    }

    const headers = [
      'id',
      'external_id',
      'provider',
      'name',
      'category',
      'city',
      'country',
      'phone',
      'website',
      'rating',
      'review_count',
      'status',
    ];

    const rows = businesses.map((b: any) => [
      b.id,
      b.external_id,
      b.provider,
      b.name,
      b.category,
      b.city || '',
      b.country || '',
      b.phone_numbers?.[0] || '',
      b.website || '',
      b.rating || '',
      b.review_count || '',
      b.status,
    ]);

    const csvContent = [headers, ...rows]
      .map((row: any) => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    return csvContent;
  }

  /**
   * Get businesses by status
   */
  async getByStatus(status: 'active' | 'inactive' | 'closed'): Promise<IBusinessDocument[]> {
    return (await prisma.business.findMany({
      where: { status },
    })) as IBusinessDocument[];
  }

  /**
   * Get businesses by provider
   */
  async getByProvider(provider: 'google_places' | 'yelp' | 'custom'): Promise<IBusinessDocument[]> {
    return (await prisma.business.findMany({
      where: { provider },
    })) as IBusinessDocument[];
  }

  /**
   * Get recently added businesses
   */
  async getRecent(days: number = 7, limit: number = 100): Promise<IBusinessDocument[]> {
    const date = new Date();
    date.setDate(date.getDate() - days);

    return (await prisma.business.findMany({
      where: { created_at: { gte: date } },
      orderBy: { created_at: 'desc' },
      take: limit,
    })) as IBusinessDocument[];
  }

  /**
   * Get recently updated businesses
   */
  async getRecentlyUpdated(days: number = 7, limit: number = 100): Promise<IBusinessDocument[]> {
    const date = new Date();
    date.setDate(date.getDate() - days);

    return (await prisma.business.findMany({
      where: { updated_at: { gte: date } },
      orderBy: { updated_at: 'desc' },
      take: limit,
    })) as IBusinessDocument[];
  }

  /**
   * Get businesses not synced in X days
   */
  async getUnsynced(days: number = 30, limit: number = 100): Promise<IBusinessDocument[]> {
    const date = new Date();
    date.setDate(date.getDate() - days);

    return (await prisma.business.findMany({
      where: {
        OR: [
          { last_synced: null },
          { last_synced: { lt: date } },
        ],
      },
      take: limit,
    })) as IBusinessDocument[];
  }
}
