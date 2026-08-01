import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../types/appError.js';

export const requireGlobalAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return next(new AppError('Unauthorized', 401));
    }

    if (req.user.globalRole !== 'GLOBAL_ADMIN') {
      return next(new AppError('Global admin access required', 403));
    }

    next();
  } catch (err) {
    next(err);
  }
};
