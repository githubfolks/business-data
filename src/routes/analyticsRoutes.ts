import { Router, Request, Response, NextFunction } from 'express';
import { DataExportService } from '../services/DataExportService';
import { AnalyticsService } from '../services/AnalyticsService';

const router = Router();
const exportService = new DataExportService();
const analyticsService = new AnalyticsService();

/**
 * GET /api/v1/export/json
 * Export all businesses as JSON
 */
router.get('/json', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await exportService.exportToJson();

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="businesses.json"');

    return res.status(200).json(data);
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/v1/export/csv
 * Export all businesses as CSV
 */
router.get('/csv', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const csv = await exportService.exportToCsv();

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="businesses.csv"');

    return res.status(200).send(csv);
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/v1/export/status/:status
 * Export businesses by status
 */
router.get('/status/:status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.params;
    const { format = 'json' } = req.query;

    if (!['active', 'inactive', 'closed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const data = await exportService.getByStatus(status as any);

    if (format === 'csv') {
      const csv = await exportService.exportToCsv({ status });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="businesses_${status}.csv"`);
      return res.status(200).send(csv);
    }

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(data);
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/v1/analytics/metrics
 * Get comprehensive metrics
 */
router.get('/analytics/metrics', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const metrics = await analyticsService.getMetrics();
    return res.status(200).json(metrics);
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/v1/analytics/category
 * Get category statistics
 */
router.get('/analytics/category', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await analyticsService.getByCategory();
    return res.status(200).json({ by_category: data });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/v1/analytics/status
 * Get status statistics
 */
router.get('/analytics/status', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await analyticsService.getByStatus();
    return res.status(200).json({ by_status: data });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/v1/analytics/provider
 * Get provider statistics
 */
router.get('/analytics/provider', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await analyticsService.getByProvider();
    return res.status(200).json({ by_provider: data });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/v1/analytics/geographic
 * Get geographic distribution
 */
router.get('/analytics/geographic', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await analyticsService.getGeographicDistribution();
    return res.status(200).json({ geographic_distribution: data });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/v1/analytics/rating
 * Get rating distribution
 */
router.get('/analytics/rating', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await analyticsService.getRatingDistribution();
    return res.status(200).json({ rating_distribution: data });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/v1/analytics/top-categories
 * Get top categories by review count
 */
router.get('/analytics/top-categories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit = 10 } = req.query;
    const data = await analyticsService.getTopCategoriesByReviews(Number(limit));
    return res.status(200).json({ top_categories: data });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/v1/analytics/trends
 * Get trend analysis
 */
router.get('/analytics/trends', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { days = 30 } = req.query;
    const data = await analyticsService.getTrendAnalysis(Number(days));
    return res.status(200).json({ trends: data });
  } catch (error) {
    return next(error);
  }
});

export default router;
