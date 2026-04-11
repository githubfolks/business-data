import { Router, Request, Response, NextFunction } from 'express';
import { RecommendationService } from '../services/RecommendationService';

const router = Router();
const recommendationService = new RecommendationService();

/**
 * GET /api/v1/recommendations/similar/:id
 * Get similar businesses
 */
router.get('/similar/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { limit = 10 } = req.query;

    const results = await recommendationService.getSimilarBusinesses(id, Number(limit));

    return res.status(200).json({
      recommendations: results,
      count: results.length,
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/v1/recommendations/user
 * Get recommendations for user
 */
router.get('/user', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { city, categories, minRating = 3.5, limit = 20 } = req.query;

    if (!city) {
      return res.status(400).json({ error: 'city parameter is required' });
    }

    const categoryList = categories ? String(categories).split(',') : [];

    const results = await recommendationService.getRecommendedForUser(String(city), categoryList, Number(minRating), Number(limit));

    return res.status(200).json({
      recommendations: results,
      count: results.length,
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/v1/recommendations/trending
 * Get trending businesses
 */
router.get('/trending', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit = 20 } = req.query;

    const results = await recommendationService.getTrendingBusinesses(Number(limit));

    return res.status(200).json({
      recommendations: results,
      count: results.length,
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/v1/recommendations/competitors/:id
 * Get competitor businesses
 */
router.get('/competitors/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { limit = 10 } = req.query;

    const results = await recommendationService.getCompetitors(id, Number(limit));

    return res.status(200).json({
      recommendations: results,
      count: results.length,
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/v1/recommendations/up-and-coming
 * Get up-and-coming businesses
 */
router.get('/up-and-coming', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit = 20 } = req.query;

    const results = await recommendationService.getUpAndComing(Number(limit));

    return res.status(200).json({
      recommendations: results,
      count: results.length,
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
