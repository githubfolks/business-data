import { Router, Request, Response, NextFunction } from 'express';
import { BusinessSearchService, SearchQuery } from '../services/BusinessSearchService';
import { GooglePlacesClient } from '../services/GooglePlacesClient';
import { BusinessIngestionService } from '../services/BusinessIngestionService';

const router = Router();
const searchService = new BusinessSearchService();
const googlePlacesClient = new GooglePlacesClient();
const ingestionService = new BusinessIngestionService();

/**
 * Helper to perform hybrid search (Local + Google Places with ingestion)
 */
async function performHybridSearch(query: string, page: number, limit: number) {
  // Search local database first
  const localResults = await searchService.fullTextSearch(query, page, limit);

  let googleResults: any[] = [];
  let ingestedBusinesses: any[] = [];

  // Also search Google Places in parallel
  try {
    const places = await googlePlacesClient.textSearch(query);

    if (places.length > 0) {
      // Get details for first 5 results
      const detailedResults = await Promise.all(
        places.slice(0, 5).map(place =>
          googlePlacesClient.getPlaceDetails(place.place_id).catch(err => {
            console.error(`Failed to get details for ${place.place_id}:`, err);
            return null;
          })
        )
      );

      const validDetails = detailedResults.filter(r => r !== null);

      // Ingest into database
      ingestedBusinesses = await ingestionService.ingestBatch(validDetails, 'google_places');
      googleResults = ingestedBusinesses;
    }
  } catch (error) {
    console.warn('Google Places search failed (continuing with local results):', error);
  }

  // Combine results (avoid duplicates, preferring fresh Google data)
  const freshIds = new Set(googleResults.map(b => b.external_id));
  const filteredLocal = localResults.businesses.filter(b => !freshIds.has(b.external_id));
  
  const allBusinesses = [...googleResults, ...filteredLocal];

  return {
    businesses: allBusinesses.slice(0, limit),
    total: allBusinesses.length,
    page,
    page_size: limit,
    pages: Math.ceil(allBusinesses.length / limit),
    source: googleResults.length > 0 ? 'hybrid' : 'local',
    localCount: localResults.businesses.length,
    googleCount: googleResults.length,
  };
}

/**
 * GET /api/v1/search
 * Full-text search with Smart Fallback
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query, page = 1, limit = 20, force_refresh = 'false' } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'query parameter is required' });
    }

    // 1. Try local search first
    const results = await searchService.fullTextSearch(String(query), Number(page), Number(limit));

    // 2. If results found and not forcing refresh, return them immediately
    if (results.total > 0 && force_refresh !== 'true') {
      return res.status(200).json({
        ...results,
        source: 'local'
      });
    }

    // 3. SMART FALLBACK: If no results found locally, trigger hybrid search to find/ingest from Google
    console.log(`Smart search fallback triggered for query: "${query}"`);
    const hybridResults = await performHybridSearch(String(query), Number(page), Number(limit));

    return res.status(200).json({
      ...hybridResults,
      fallback: true,
      message: results.total === 0 ? 'No local matches found. Fetched fresh results from Google.' : undefined
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * POST /api/v1/search/advanced
 * Advanced search with filters
 */
router.post('/advanced', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { filters, page = 1, limit = 20 } = req.body;

    const results = await searchService.search(filters as SearchQuery, Number(page), Number(limit));

    return res.status(200).json(results);
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/v1/search/category/:category
 * Search by category
 */
router.get('/category/:category', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const results = await searchService.findByCategory(category, Number(page), Number(limit));

    return res.status(200).json(results);
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/v1/search/location
 * Search by city/country
 */
router.get('/location', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { city, country, page = 1, limit = 20 } = req.query;

    if (!city) {
      return res.status(400).json({ error: 'city parameter is required' });
    }

    const results = await searchService.findByLocation(String(city), country ? String(country) : undefined, Number(page), Number(limit));

    return res.status(200).json(results);
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/v1/search/nearby
 * Search by coordinates
 */
router.get('/nearby', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { latitude, longitude, radius = 5, limit = 50 } = req.query;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'latitude and longitude are required' });
    }

    const results = await searchService.findNearby(Number(latitude), Number(longitude), Number(radius), Number(limit));

    return res.status(200).json({ businesses: results, count: results.length });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/v1/search/name/:name
 * Search by business name
 */
router.get('/name/:name', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const results = await searchService.findByName(name, Number(page), Number(limit));

    return res.status(200).json(results);
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/v1/search/google
 * Search using Google Places API for real-time business data
 */
router.get('/google', async (req: Request, res: Response) => {
  try {
    const { query, latitude, longitude, radius = 1500, page = 1, limit = 20 } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'query parameter is required' });
    }

    let googleResults: any[] = [];

    // If coordinates provided, use nearby search
    if (latitude && longitude) {
      googleResults = await googlePlacesClient.nearbySearch(
        {
          latitude: Number(latitude),
          longitude: Number(longitude),
        },
        {
          query: String(query),
          radius: Number(radius),
        }
      );
    } else {
      // Use text search
      googleResults = await googlePlacesClient.textSearch(String(query));
    }

    if (googleResults.length === 0) {
      return res.status(200).json({
        businesses: [],
        total: 0,
        page: Number(page),
        page_size: Number(limit),
        pages: 0,
        source: 'google_places',
        message: 'No results found from Google Places API',
      });
    }

    // Get detailed info for each result (up to limit)
    const detailedResults = await Promise.all(
      googleResults.slice(0, Number(limit)).map(place =>
        googlePlacesClient.getPlaceDetails(place.place_id).catch(err => {
          console.error(`Failed to get details for ${place.place_id}:`, err);
          return null;
        })
      )
    );

    const validDetails = detailedResults.filter(r => r !== null);

    // Ingest into database
    const ingestedBusinesses = await ingestionService.ingestBatch(
      validDetails,
      'google_places'
    );

    return res.status(200).json({
      businesses: ingestedBusinesses,
      total: ingestedBusinesses.length,
      page: Number(page),
      page_size: Number(limit),
      pages: Math.ceil(ingestedBusinesses.length / Number(limit)),
      source: 'google_places',
    });
  } catch (error) {
    console.error('Google Places search error:', error);
    return res.status(500).json({
      error: 'Google Places search failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/v1/search/hybrid
 * Search both local database AND Google Places, return combined results
 */
router.get('/hybrid', async (req: Request, res: Response) => {
  try {
    const { query, page = 1, limit = 20 } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'query parameter is required' });
    }

    const results = await performHybridSearch(String(query), Number(page), Number(limit));

    return res.status(200).json(results);
  } catch (error) {
    console.error('Hybrid search error:', error);
    return res.status(500).json({
      error: 'Hybrid search failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/v1/search/:id
 * Get business by ID
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const business = await searchService.getById(id);

    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    return res.status(200).json(business);
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/v1/search/external/:external_id
 * Get business by external ID
 */
router.get('/external/:external_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { external_id } = req.params;

    const business = await searchService.getByExternalId(external_id);

    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    return res.status(200).json(business);
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/v1/search/top-rated
 * Get top-rated businesses
 */
router.get('/top-rated/:category?', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category } = req.params;
    const { limit = 20 } = req.query;

    const results = await searchService.findTopRated(category, Number(limit));

    return res.status(200).json({ businesses: results, count: results.length });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/v1/search/stats
 * Get business statistics
 */
router.get('/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await searchService.getStatistics();

    return res.status(200).json(stats);
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/v1/search/leads
 * Find leads by category
 */
router.get('/leads/:category', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category } = req.params;
    const { minReviews, minRating, country, limit } = req.query;

    const results = await searchService.findLeads(category, {
      minReviews: minReviews ? Number(minReviews) : undefined,
      minRating: minRating ? Number(minRating) : undefined,
      country: country ? String(country) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    return res.status(200).json({ businesses: results, count: results.length });
  } catch (error) {
    return next(error);
  }
});

export default router;
