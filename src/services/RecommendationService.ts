import { prisma } from '../db/prisma';

export interface Recommendation {
  business_id: string;
  name: string;
  category: string;
  score: number;
}

export class RecommendationService {
  /**
   * Get businesses similar to a given business
   */
  async getSimilarBusinesses(businessId: string, limit: number = 10): Promise<Recommendation[]> {
    try {
      const business = await prisma.business.findUnique({
        where: { id: businessId },
      });

      if (!business) return [];

      const similar = await prisma.business.findMany({
        where: {
          id: { not: businessId },
          category: business.category,
          status: 'active',
        },
        orderBy: [{ rating: 'desc' }, { review_count: 'desc' }],
        take: limit,
      });

      return similar.map((b: any) => ({
        business_id: b.id,
        name: b.name,
        category: b.category,
        score: (b.rating || 0) * 0.7 + (b.review_count || 0) * 0.001,
      }));
    } catch (error) {
      console.error('Error getting similar businesses:', error);
      return [];
    }
  }

  /**
   * Get recommended businesses for a user based on category and location
   */
  async getRecommendedForUser(
    city: string,
    preferredCategories: string[],
    minRating: number = 3.5,
    limit: number = 20
  ): Promise<Recommendation[]> {
    try {
      const recommendations = await prisma.business.findMany({
        where: {
          OR: [
            { category: { in: preferredCategories } },
            { subcategories: { hasSome: preferredCategories } },
          ],
          city: { contains: city, mode: 'insensitive' },
          status: 'active',
          rating: { gte: minRating },
        },
        orderBy: [{ rating: 'desc' }, { review_count: 'desc' }],
        take: limit,
      });

      return recommendations.map((b: any) => ({
        business_id: b.id,
        name: b.name,
        category: b.category,
        score: (b.rating || 0) * 0.8 + (b.review_count || 0) * 0.002,
      }));
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return [];
    }
  }

  /**
   * Get trending businesses based on recent activity
   */
  async getTrendingBusinesses(limit: number = 20): Promise<Recommendation[]> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const trending = await prisma.business.findMany({
        where: {
          status: 'active',
          updated_at: { gte: thirtyDaysAgo },
        },
        orderBy: [{ rating: 'desc' }, { review_count: 'desc' }, { updated_at: 'desc' }],
        take: limit,
      });

      return trending.map((b: any) => ({
        business_id: b.id,
        name: b.name,
        category: b.category,
        score: (b.rating || 0) * 0.6 + (b.review_count || 0) * 0.001,
      }));
    } catch (error) {
      console.error('Error getting trending businesses:', error);
      return [];
    }
  }

  /**
   * Get competitor analysis
   */
  async getCompetitors(businessId: string, limit: number = 10): Promise<Recommendation[]> {
    try {
      const business = await prisma.business.findUnique({
        where: { id: businessId },
      });

      if (!business) return [];

      const competitors = await prisma.business.findMany({
        where: {
          id: { not: businessId },
          category: business.category,
          city: business.city,
          status: 'active',
        },
        orderBy: [{ review_count: 'desc' }, { rating: 'desc' }],
        take: limit,
      });

      return competitors.map((b: any) => ({
        business_id: b.id,
        name: b.name,
        category: b.category,
        score: (b.rating || 0) * 0.7 + (b.review_count || 0) * 0.0015,
      }));
    } catch (error) {
      console.error('Error getting competitors:', error);
      return [];
    }
  }

  /**
   * Get up-and-coming businesses (high potential)
   */
  async getUpAndComing(limit: number = 20): Promise<Recommendation[]> {
    try {
      const upAndComing = await prisma.business.findMany({
        where: {
          status: 'active',
          rating: { gte: 4.0 },
          review_count: { lt: 100, gte: 10 },
        },
        orderBy: [{ rating: 'desc' }, { review_count: 'desc' }],
        take: limit,
      });

      return upAndComing.map((b: any) => ({
        business_id: b.id,
        name: b.name,
        category: b.category,
        score: (b.rating || 0) * 0.8 + (b.review_count || 0) * 0.002,
      }));
    } catch (error) {
      console.error('Error getting up and coming businesses:', error);
      return [];
    }
  }
}
