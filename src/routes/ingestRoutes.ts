import { Router, Request, Response, NextFunction } from 'express';
import { BusinessIngestionService } from '../services/BusinessIngestionService';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const ingestionService = new BusinessIngestionService();

/**
 * POST /api/v1/ingest/google-places/text-search
 * Ingest businesses from Google Places text search
 */
router.post('/google-places/text-search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query, language, radius } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'query is required' });
    }

    const results = await ingestionService.ingestFromGooglePlaces(query, {
      language,
      radius,
    });

    return res.status(200).json({
      id: uuidv4(),
      timestamp: new Date(),
      results_count: results.length,
      results,
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * POST /api/v1/ingest/google-places/nearby
 * Ingest businesses from Google Places nearby search
 */
router.post('/google-places/nearby', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { latitude, longitude, radius, type } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'latitude and longitude are required' });
    }

    const results = await ingestionService.ingestNearby({ latitude, longitude }, { radius, type });

    return res.status(200).json({
      id: uuidv4(),
      timestamp: new Date(),
      results_count: results.length,
      results,
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * POST /api/v1/ingest/google-places/:place_id
 * Ingest a single business by Google Place ID
 */
router.post('/google-places/:place_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { place_id } = req.params;

    const result = await ingestionService.ingestGooglePlaceById(place_id);

    if (!result) {
      return res.status(404).json({ error: 'Failed to ingest place' });
    }

    return res.status(201).json({
      id: uuidv4(),
      timestamp: new Date(),
      result,
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * POST /api/v1/ingest/batch
 * Ingest multiple businesses
 */
router.post('/batch', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businesses, source = 'google_places' } = req.body;

    if (!Array.isArray(businesses) || businesses.length === 0) {
      return res.status(400).json({ error: 'businesses array is required' });
    }

    const results = await ingestionService.ingestBatch(businesses, source);

    return res.status(200).json({
      id: uuidv4(),
      timestamp: new Date(),
      results_count: results.length,
      results,
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * POST /api/v1/ingest/sync/:id
 * Sync a specific business from its source
 */
router.post('/sync/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const result = await ingestionService.syncBusiness(id);

    if (!result) {
      return res.status(404).json({ error: 'Business not found or sync failed' });
    }

    return res.status(200).json({
      id: uuidv4(),
      timestamp: new Date(),
      result,
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * POST /api/v1/ingest/sync-batch
 * Sync multiple businesses
 */
router.post('/sync-batch', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit = 100 } = req.body;

    const synced = await ingestionService.syncBusinesses(limit);

    return res.status(200).json({
      id: uuidv4(),
      timestamp: new Date(),
      synced_count: synced,
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
