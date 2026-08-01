import { NextFunction, Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../types/appError.js';
import { Prisma, NotificationType } from '@prisma/client';

// get all comments for a specific task.

export const getComments = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const taskIdParam = req.params.taskId;
    if (!taskIdParam) {
      return next(new AppError('Task ID is required.', 400));
    }

    const taskId = parseInt(taskIdParam);
    if (Number.isNaN(taskId)) {
      return next(new AppError('Task ID must be a number.', 400));
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true },
    });
    if (!task) {
      return next(new AppError('Task not found.', 404));
    }

    const comments = await prisma.comment.findMany({
      where: { taskId },
      include: {
        author: { select: { id: true, username: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json(comments);
  } catch (error) {
    next(error);
  }
};

// creates a new comment for a task and handles notifications for mentions and task assignee.

export const createComment = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { content } = req.body;
    const taskId = req.params.taskId;
    if (!req.user) {
      return next(new AppError('Unauthorized', 400));
    }
    const authorId = req.user.userId;
    if (!content || !taskId) {
      return next(new AppError('Task ID and content are required.', 400));
    }
    const newComment = await prisma.comment.create({
      data: {
        content, // creating the comment in database
        taskId: parseInt(taskId),
        authorId: authorId,
      },
      include: {
        author: { select: { id: true, username: true, avatar: true } },
      },
    });

    const task = await prisma.task.findUnique({
      where: { id: parseInt(taskId) },
      select: { assigneeId: true, title: true },
    });

    const notificationsToCreate: Prisma.NotificationCreateManyInput[] = [];
    // regex to find mentions (e.g., @username) in the comment content.
    const mentionMatches = content.match(/@([a-zA-Z0-9_]+)/g);
    if (mentionMatches) {
      const usernames = mentionMatches.map(
        (
          match: string, // finding match for usernames in @UserName notation
        ) => match.substring(1),
      );
      // find the user IDs for the mentioned usernames, excluding the comment author.
      const mentionedUsers = await prisma.user.findMany({
        where: {
          username: { in: usernames },
          id: { not: authorId },
        },
        select: {
          id: true,
        },
      });
      mentionedUsers.forEach((user) => {
        notificationsToCreate.push({
          userId: user.id, // mentioning the existing usernames database found in text
          taskId: parseInt(taskId),
          type: 'USER_MENTIONED',
          message: `${newComment.author.username} mentioned you in a comment of "${task?.title}"`,
        });
      });
    }
    if (task && task.assigneeId && task.assigneeId !== authorId) {
      const alreadMentioned = notificationsToCreate.some(
        (n) => n.userId === task.assigneeId,
      );
      if (!alreadMentioned) {
        await prisma.notification.create({
          data: {
            userId: task.assigneeId,
            taskId: parseInt(taskId),
            type: 'COMMENT_ADDED',
            message: `${newComment.author.username} added a new comment to your task.`,
          },
        });
      }
    }
    if (notificationsToCreate.length > 0) {
      await prisma.notification.createMany({
        data: notificationsToCreate,
      });
    }
    await prisma.auditLog.create({
      data: {
        taskId: parseInt(taskId),
        userId: authorId,
        type: 'COMMENT_ADDED',
        newValue: newComment.id.toString(),
      },
    });
    res.status(201).json(newComment);
  } catch (error) {
    next(error);
  }
};

// updates an existing comment. Only the author of the comment can update it.
export const updateComment = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!req.user) {
      return next(new AppError('Unauthorized', 400));
    }
    const userId = req.user.userId;
    if (!content) {
      return next(new AppError('Content is required.', 400));
    }

    const existingComment = await prisma.comment.findUnique({
      where: { id: parseInt(commentId) },
      include: { author: true },
    });

    if (!existingComment) {
      return next(new AppError('Comment not found.', 404));
    }
    // authorize: ensure the authenticated user is the author of the comment.
    if (existingComment.authorId !== userId) {
      return next(
        new AppError('Unauthorized: You can only edit your own comments.', 403),
      );
    }

    const updatedComment = await prisma.comment.update({
      where: { id: parseInt(commentId) },
      data: { content },
    });

    // record the comment update in the audit log, including old and new content.
    await prisma.auditLog.create({
      data: {
        taskId: existingComment.taskId,
        userId: userId,
        type: 'COMMENT_EDITED',
        oldValue: existingComment.content,
        newValue: content,
      },
    });

    const extractMentions = (text: string) => {
      const mentionRegex = /@([a-zA-Z0-9_.-]+)/g;
      const matches = Array.from(text.matchAll(mentionRegex));
      return [...new Set(matches.map((m) => m[1]))];
    };

    const oldMentions = extractMentions(existingComment.content);
    const newMentions = extractMentions(content);

    const newlyAddedMentions = newMentions.filter(
      (username) => !oldMentions.includes(username),
    );

    if (newlyAddedMentions.length > 0) {
      const usersToNotify = await prisma.user.findMany({
        where: { username: { in: newlyAddedMentions } },
      });

      const validUsersToNotify = usersToNotify.filter((u) => u.id !== userId);

      if (validUsersToNotify.length > 0) {
        const notificationsData = validUsersToNotify.map((user) => ({
          userId: user.id,
          type: NotificationType.USER_MENTIONED,
          message: `${existingComment.author.username} mentioned you in an edited comment.`,
          taskId: existingComment.taskId,
        }));

        await prisma.notification.createMany({
          data: notificationsData,
        });
      }
    }

    res.status(200).json(updatedComment);
  } catch (error) {
    next(error);
  }
};

// deletes a specific comment. Only the author of the comment can delete it.

export const deleteComment = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { commentId } = req.params;
    const userId = req.user?.userId;
    const existingComment = await prisma.comment.findUnique({
      where: { id: parseInt(commentId) },
    });
    if (!existingComment) {
      return next(new AppError('Comment not found.', 404));
    }
    if (existingComment.authorId !== userId) {
      return next(
        new AppError(
          'Unauthorized: You can only delete your own comments.',
          403,
        ),
      );
    }
    const deletedComment = await prisma.comment.delete({
      where: {
        id: parseInt(commentId),
      },
    });
    await prisma.auditLog.create({
      data: {
        taskId: existingComment.taskId,
        userId: userId,
        type: 'COMMENT_DELETED',
        oldValue: existingComment.content,
      },
    });
    res
      .status(200)
      .json({ message: 'Comment deleted successfully', deletedComment });
  } catch (error) {
    next(error);
  }
};
