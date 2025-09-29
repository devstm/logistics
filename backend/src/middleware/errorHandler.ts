import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let { statusCode = 500, message } = error;

  // Handle specific Prisma errors
  if (error.message.includes('Unique constraint')) {
    statusCode = 409;
    message = 'Resource already exists';
  } else if (error.message.includes('Record to update not found')) {
    statusCode = 404;
    message = 'Resource not found';
  } else if (error.message.includes('Record to delete does not exist')) {
    statusCode = 404;
    message = 'Resource not found';
  }

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error details:', error);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};

export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
};

export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);