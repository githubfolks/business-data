import { Router, Request, Response, NextFunction } from 'express';
import { BusinessSearchService } from '../services/BusinessSearchService';
import { GooglePlacesClient } from '../services/GooglePlacesClient';
import { BusinessNormalizer } from '../services/BusinessNormalizer';

const router = Router();
const searchService = new BusinessSearchService();
const googlePlacesClient = new GooglePlacesClient();

/**
 * Shared logic for real-time search
 */
async function handleSearch(req: Request, res: Response, next: NextFunction) {
  try {
    const { query, limit = 20, pincode, radius, pagetoken, country, deepSearch } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'query parameter is required' });
    }

    let lat, lng;
    let finalQuery = String(query);

    // Handle Pincode Geocoding if provided
    if (pincode) {
      try {
        const coords = await googlePlacesClient.geocodePincode(
          String(pincode), 
          country ? String(country) : undefined
        );
        if (coords) {
          lat = coords.latitude;
          lng = coords.longitude;
        } else {
          finalQuery = `${query} in ${pincode}`;
        }
      } catch (err: any) {
        console.warn(`Geocoding failed for pincode ${pincode}: ${err.message}`);
        finalQuery = `${query} in ${pincode}`;
      }
    }

    const results = await searchService.externalSearch(
      finalQuery, 
      Number(limit), 
      pagetoken ? String(pagetoken) : undefined,
      lat ? Number(lat) : undefined,
      lng ? Number(lng) : undefined,
      radius ? Number(radius) : undefined,
      country ? String(country) : undefined,
      String(deepSearch) === 'true'
    );

    return res.status(200).json({
      ...results,
      total: results.businesses.length,
      page: 1,
      page_size: Number(limit),
      pages: 1,
      source: 'google_places_realtime'
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/v1/search
 * Modern Real-time Search (The main entry point for the dashboard)
 */
router.get('/', handleSearch);

/**
 * GET /api/v1/search/external
 * Legacy alias for external search (kept for compatibility)
 */
router.get('/external', handleSearch);

/**
 * GET /api/v1/search/:id
 * Get business by ID (Always fetches fresh from Google)
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!id.startsWith('google_')) {
      return res.status(404).json({ error: 'Only Google place IDs are supported in real-time mode' });
    }

    const placeId = id.replace('google_', '');
    console.log(`Fetching real-time details for: ${placeId}`);
    
    try {
      const details = await googlePlacesClient.getPlaceDetails(placeId);
      const normalized = BusinessNormalizer.normalizeGooglePlace(details);
      
      return res.status(200).json(normalized);
    } catch (err) {
      console.error(`Failed to fetch real-time details for ${id}:`, err);
      return res.status(404).json({ error: 'Business details not found' });
    }
  } catch (error) {
    return next(error);
  }
});

export default router;
