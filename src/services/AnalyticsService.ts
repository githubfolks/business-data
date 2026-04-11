import { prisma } from '../db/prisma';

export interface AnalyticsMetrics {
  total_businesses: number;
  by_category: Record<string, number>;
  by_status: Record<string, number>;
  by_provider: Record<string, number>;
  average_rating: number;
  verified_count: number;
  geographic_distribution: Record<string, number>;
  rating_distribution: Record<string, number>;
}

export class AnalyticsService {
  /**
   * Get comprehensive metrics
   */
  async getMetrics(): Promise<AnalyticsMetrics> {
    const [
      totalCount,
      categoryStats,
      statusStats,
      providerStats,
      ratingStats,
      verifiedCount,
      geoStats,
      ratingDistribution,
    ] = await Promise.all([
      prisma.business.count(),
      this.getByCategory(),
      this.getByStatus(),
      this.getByProvider(),
      this.getAverageRating(),
      prisma.business.count({ where: { verified: true } }),
      this.getGeographicDistribution(),
      this.getRatingDistribution(),
    ]);

    return {
      total_businesses: totalCount,
      by_category: categoryStats,
      by_status: statusStats,
      by_provider: providerStats,
      average_rating: ratingStats,
      verified_count: verifiedCount,
      geographic_distribution: geoStats,
      rating_distribution: ratingDistribution,
    };
  }

  /**
   * Get count by category
   */
  async getByCategory(): Promise<Record<string, number>> {
    const results = await prisma.$queryRaw<any[]>`
      SELECT category, COUNT(*) as count 
      FROM "Business" 
      GROUP BY category 
      ORDER BY count DESC
    `;

    const distribution: Record<string, number> = {};
    results.forEach((item: any) => {
      distribution[item.category] = Number(item.count);
    });

    return distribution;
  }

  /**
   * Get count by status
   */
  async getByStatus(): Promise<Record<string, number>> {
    const results = await prisma.$queryRaw<any[]>`
      SELECT status, COUNT(*) as count 
      FROM "Business" 
      GROUP BY status
    `;

    const distribution: Record<string, number> = {};
    results.forEach((item: any) => {
      distribution[item.status] = Number(item.count);
    });

    return distribution;
  }

  /**
   * Get count by provider
   */
  async getByProvider(): Promise<Record<string, number>> {
    const results = await prisma.$queryRaw<any[]>`
      SELECT provider, COUNT(*) as count 
      FROM "Business" 
      GROUP BY provider
    `;

    const distribution: Record<string, number> = {};
    results.forEach((item: any) => {
      distribution[item.provider] = Number(item.count);
    });

    return distribution;
  }

  /**
   * Get average rating
   */
  async getAverageRating(): Promise<number> {
    const results = await prisma.$queryRaw<any[]>`
      SELECT AVG(rating) as avg 
      FROM "Business" 
      WHERE rating IS NOT NULL
    `;

    return results[0]?.avg ? Number(results[0].avg) : 0;
  }

  /**
   * Get geographic distribution
   */
  async getGeographicDistribution(): Promise<Record<string, number>> {
    const results = await prisma.$queryRaw<any[]>`
      SELECT country, COUNT(*) as count 
      FROM "Business" 
      GROUP BY country 
      ORDER BY count DESC
    `;

    const distribution: Record<string, number> = {};
    results.forEach((item: any) => {
      distribution[item.country || 'Unknown'] = Number(item.count);
    });

    return distribution;
  }

  /**
   * Get rating distribution
   */
  async getRatingDistribution(): Promise<Record<string, number>> {
    const results = await prisma.$queryRaw<any[]>`
      SELECT 
        CASE 
          WHEN rating IS NULL THEN 'Unknown'
          WHEN rating < 1 THEN '0-1'
          WHEN rating < 2 THEN '1-2'
          WHEN rating < 3 THEN '2-3'
          WHEN rating < 4 THEN '3-4'
          WHEN rating <= 5 THEN '4-5'
        END as rating_range,
        COUNT(*) as count
      FROM "Business"
      GROUP BY rating_range
      ORDER BY rating_range ASC
    `;

    const distribution: Record<string, number> = {};
    results.forEach((item: any) => {
      distribution[item.rating_range] = Number(item.count);
    });

    return distribution;
  }

  /**
   * Get top categories by review count
   */
  async getTopCategoriesByReviews(limit: number = 10): Promise<Array<{ category: string; total_reviews: number; avg_rating: number }>> {
    const results = await prisma.$queryRaw<any[]>`
      SELECT 
        category,
        SUM(review_count) as total_reviews,
        AVG(rating) as avg_rating
      FROM "Business"
      WHERE review_count IS NOT NULL
      GROUP BY category
      ORDER BY total_reviews DESC
      LIMIT ${limit}
    `;

    return results.map((item: any) => ({
      category: item.category,
      total_reviews: Number(item.total_reviews),
      avg_rating: Number(item.avg_rating),
    }));
  }

  /**
   * Get trend analysis
   */
  async getTrendAnalysis(days: number = 30): Promise<{
    new_businesses: number;
    updated_businesses: number;
    newly_verified: number;
  }> {
    const date = new Date();
    date.setDate(date.getDate() - days);

    const [newBusinesses, updatedBusinesses, newlyVerified] = await Promise.all([
      prisma.business.count({ where: { created_at: { gte: date } } }),
      prisma.business.count({ where: { updated_at: { gte: date } } }),
      prisma.business.count({
        where: {
          verification_date: { gte: date },
          verified: true,
        },
      }),
    ]);

    return {
      new_businesses: newBusinesses,
      updated_businesses: updatedBusinesses,
      newly_verified: newlyVerified,
    };
  }
}
