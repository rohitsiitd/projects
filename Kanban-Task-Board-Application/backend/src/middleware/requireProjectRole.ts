import { NextFunction, Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../types/appError.js';

export const requireProjectRole = (allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      const projectId = parseInt(req.params.projectId);

      if (!userId) {
        return next(new AppError('Unauthorized', 401));
      }

      const membership = await prisma.projectMembership.findUnique({
        where: {
          userId_projectId: {
            userId,
            projectId,
          },
        },
      });
      if (req.user?.globalRole == 'GLOBAL_ADMIN') {
        return next();
      }

      if (!membership) {
        return next(new AppError('Not part of project', 403));
      }

      if (!allowedRoles.includes(membership.role)) {
        return next(new AppError('Insufficient permissions', 403));
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};
