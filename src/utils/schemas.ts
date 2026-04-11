import Joi from 'joi';

export const schemas = {
  // Ingestion schemas
  googlePlacesTextSearch: Joi.object({
    query: Joi.string().required().min(1).max(500),
    language: Joi.string().default('en'),
    radius: Joi.number().optional().min(0),
  }),

  googlePlacesNearby: Joi.object({
    latitude: Joi.number().required().min(-90).max(90),
    longitude: Joi.number().required().min(-180).max(180),
    radius: Joi.number().default(1500).min(0).max(50000),
    type: Joi.string().optional(),
  }),

  ingestBatch: Joi.object({
    businesses: Joi.array().items(Joi.object()).required().min(1).max(1000),
    source: Joi.string().valid('google_places', 'yelp', 'custom').default('google_places'),
  }),

  // Search schemas
  textSearch: Joi.object({
    query: Joi.string().required().min(1).max(500),
    page: Joi.number().optional().min(1).default(1),
    limit: Joi.number().optional().min(1).max(100).default(20),
  }),

  advancedSearch: Joi.object({
    filters: Joi.object({
      text: Joi.string().optional(),
      category: Joi.string().optional(),
      city: Joi.string().optional(),
      country: Joi.string().optional(),
      rating_min: Joi.number().optional().min(0).max(5),
      status: Joi.string().valid('active', 'inactive', 'closed').optional(),
      latitude: Joi.number().optional().min(-90).max(90),
      longitude: Joi.number().optional().min(-180).max(180),
      radius_km: Joi.number().optional().min(0),
    }).required(),
    page: Joi.number().optional().min(1).default(1),
    limit: Joi.number().optional().min(1).max(100).default(20),
  }),

  locationSearch: Joi.object({
    city: Joi.string().required(),
    country: Joi.string().optional(),
    page: Joi.number().optional().min(1).default(1),
    limit: Joi.number().optional().min(1).max(100).default(20),
  }),

  nearbySearch: Joi.object({
    latitude: Joi.number().required().min(-90).max(90),
    longitude: Joi.number().required().min(-180).max(180),
    radius: Joi.number().optional().default(5).min(0).max(100),
    limit: Joi.number().optional().default(50).min(1).max(500),
  }),
};
