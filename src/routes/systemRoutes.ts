import { Router, Request, Response } from 'express';

const router = Router();

/**
 * Health check endpoint
 */
router.get('/health', (_req: Request, res: Response) => {
  return res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * API version endpoint
 */
router.get('/version', (_req: Request, res: Response) => {
  return res.status(200).json({
    version: '1.0.0',
    api_version: 'v1',
    timestamp: new Date().toISOString(),
  });
});

/**
 * API documentation
 */
router.get('/docs', (_req: Request, res: Response) => {
  const docs = {
    title: 'Business Intelligence Platform API',
    version: '1.0.0',
    description: 'Scalable platform for collecting, normalizing, and exposing business data',
    endpoints: {
      ingestion: {
        'POST /api/v1/ingest/google-places/text-search': 'Search and ingest businesses from Google Places',
        'POST /api/v1/ingest/google-places/nearby': 'Search nearby businesses on Google Places',
        'POST /api/v1/ingest/google-places/:place_id': 'Ingest a single business by Google Place ID',
        'POST /api/v1/ingest/batch': 'Batch ingest multiple businesses',
        'POST /api/v1/ingest/sync/:id': 'Sync a specific business',
        'POST /api/v1/ingest/sync-batch': 'Batch sync businesses',
      },
      search: {
        'GET /api/v1/search?query=...': 'Full-text search',
        'POST /api/v1/search/advanced': 'Advanced search with filters',
        'GET /api/v1/search/category/:category': 'Search by category',
        'GET /api/v1/search/location?city=...&country=...': 'Search by location',
        'GET /api/v1/search/nearby?latitude=...&longitude=...&radius=...': 'Search nearby',
        'GET /api/v1/search/name/:name': 'Search by business name',
        'GET /api/v1/search/:id': 'Get business by ID',
        'GET /api/v1/search/external/:external_id': 'Get business by external ID',
        'GET /api/v1/search/top-rated/:category?': 'Get top-rated businesses',
        'GET /api/v1/search/stats': 'Get statistics',
        'GET /api/v1/search/leads/:category': 'Find leads by category',
      },
    },
  };

  return res.status(200).json(docs);
});

export default router;
