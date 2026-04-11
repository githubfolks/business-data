import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

export interface ValidationSchema {
  body?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
}

export const validateRequest = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: Record<string, string> = {};

    if (schema.body) {
      const { error } = schema.body.validate(req.body, { abortEarly: false });
      if (error) {
        error.details.forEach((detail) => {
          errors[detail.path.join('.')] = detail.message;
        });
      }
    }

    if (schema.query) {
      const { error } = schema.query.validate(req.query, { abortEarly: false });
      if (error) {
        error.details.forEach((detail) => {
          errors[detail.path.join('.')] = detail.message;
        });
      }
    }

    if (schema.params) {
      const { error } = schema.params.validate(req.params, { abortEarly: false });
      if (error) {
        error.details.forEach((detail) => {
          errors[detail.path.join('.')] = detail.message;
        });
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    return next();
  };
};

// Common validation schemas
export const searchValidationSchema = {
  query: Joi.object({
    query: Joi.string().required(),
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(20),
  }),
};

export const advancedSearchValidationSchema = {
  body: Joi.object({
    filters: Joi.object({
      text: Joi.string(),
      category: Joi.string(),
      city: Joi.string(),
      country: Joi.string(),
      rating_min: Joi.number().min(0).max(5),
      status: Joi.string().valid('active', 'inactive', 'closed'),
      latitude: Joi.number(),
      longitude: Joi.number(),
      radius_km: Joi.number().min(0),
    }),
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(20),
  }),
};

export const googlePlacesTextSearchValidationSchema = {
  body: Joi.object({
    query: Joi.string().required(),
    language: Joi.string().default('en'),
    radius: Joi.number().min(0),
  }),
};

export const googlePlacesNearbyValidationSchema = {
  body: Joi.object({
    latitude: Joi.number().required(),
    longitude: Joi.number().required(),
    radius: Joi.number().default(1500),
    type: Joi.string(),
  }),
};
