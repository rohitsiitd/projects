import { NextFunction, Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../types/appError.js';

//Retrieves all notifications for the authenticated user.
//Includes associated task, column, and board details to provide context in the UI.

export const getUserNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Ensure the user is authenticated
    if (!req.user || !req.user.userId) {
      return next(new AppError('Unauthorized', 401));
    }
    const { userId } = req.user as { userId: number };

    // Fetch notifications ordered by newest first, including deeply nested task relation data
    const notifications = await prisma.notification.findMany({
      where: {
        userId: Number(userId),
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        task: {
          select: {
            title: true,
            column: {
              select: {
                id: true,
                board: {
                  select: {
                    id: true,
                    projectId: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Flatten the nested relation data for simpler frontend consumption
    const formattedNotifications = notifications.map((n) => ({
      id: n.id,
      userId: n.userId,
      taskId: n.taskId,
      type: n.type,
      message: n.message,
      isRead: n.isRead,
      createdAt: n.createdAt,
      projectId: n.task?.column?.board?.projectId || null,
      boardId: n.task?.column?.board?.id || null,
      columnId: n.task?.column?.id || null,
      taskTitle: n.task?.title || null,
    }));
    res.status(200).json({ notifications: formattedNotifications });
  } catch (error) {
    next(error);
  }
};

//Marks a specific notification as read.
export const readNotfications = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { notificationId } = req.params;
    if (!req.user || !req.user.userId) {
      return next(new AppError('Unauthorized', 401));
    }
    const { userId } = req.user as { userId: number };

    // Verify the notification exists and the user is the owner
    const notification = await prisma.notification.findUnique({
      where: {
        id: parseInt(notificationId),
      },
    });
    if (!notification || notification.userId !== userId) {
      return next(new AppError('Notification not found or unauthorized.', 404));
    }

    // Update the notification's isRead status to true
    const updated = await prisma.notification.update({
      where: {
        id: parseInt(notificationId),
      },
      data: {
        isRead: true,
      },
    });
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};
