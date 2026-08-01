import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../types/appError.js';
import { prisma } from '../../lib/prisma.js';

export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const rawPage = Number(req.query.page ?? 1);
    const rawLimit = Number(req.query.limit ?? 10);
    const search = String(req.query.search ?? '').trim();

    const page =
      Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
    const limit =
      Number.isFinite(rawLimit) && rawLimit > 0
        ? Math.min(Math.floor(rawLimit), 50)
        : 10;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            {
              username: {
                contains: search,
                mode: 'insensitive' as const,
              },
            },
            {
              email: {
                contains: search,
                mode: 'insensitive' as const,
              },
            },
          ],
        }
      : undefined;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          email: true,
          globalRole: true,
          avatar: true,
        },
        orderBy: {
          id: 'asc',
        },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    res.status(200).json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};

export const updateUserGlobalRole = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const { globalRole } = req.body;

    if (req.user?.globalRole !== 'GLOBAL_ADMIN') {
      return next(
        new AppError('Unauthorized: Only Global Admins can modify roles', 403),
      );
    }

    if (globalRole !== 'GLOBAL_ADMIN') {
      return next(new AppError('Invalid role provided', 400));
    }

    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: { globalRole },
      select: {
        id: true,
        username: true,
        email: true,
        globalRole: true,
      },
    });

    res.status(200).json({
      message: 'User role updated successfully',
      user: updatedUser,
    });
  } catch (err) {
    next(err);
  }
};

export const updateAvatar = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.userId;

    if (!req.file) {
      return next(new AppError('No file uploaded', 400));
    }
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
    });

    res.status(200).json({
      message: 'Avatar updated',
      avatar: user.avatar,
    });
  } catch (err) {
    next(err);
  }
};
