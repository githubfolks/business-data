import { Request, Response, NextFunction } from 'express';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  status: number;
  timestamp: string;
}

export class AppError extends Error {
  constructor(
    public statusCode: number = 500,
    message: string = 'Internal server error'
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const successResponse = <T = any>(res: Response, data: T, statusCode: number = 200, message?: string) => {
  return res.status(statusCode).json({
    data,
    message,
    status: statusCode,
    timestamp: new Date().toISOString(),
  } as ApiResponse<T>);
};

export const errorResponse = (res: Response, message: string, statusCode: number = 500) => {
  return res.status(statusCode).json({
    error: message,
    status: statusCode,
    timestamp: new Date().toISOString(),
  });
};

export const paginationDefaults = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

export const calculatePagination = (page?: number | string, limit?: number | string) => {
  const pageNum = Math.max(1, parseInt(String(page || paginationDefaults.DEFAULT_PAGE), 10));
  const limitNum = Math.min(
    Math.max(1, parseInt(String(limit || paginationDefaults.DEFAULT_LIMIT), 10)),
    paginationDefaults.MAX_LIMIT
  );

  return {
    page: pageNum,
    limit: limitNum,
    skip: (pageNum - 1) * limitNum,
  };
};
