import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../types/appError.js';
import * as taskService from '../services/taskService.js';
import { MoveTaskDTO } from '../types/dtos.js';
import { prisma } from '../../lib/prisma.js';

// The actual task creation logic is delegated to `taskService.createTask`.
export const createTask = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user || !req.user.userId)
      // Check if the user is authenticated.
      return next(new AppError('Unauthorized', 401));

    const newTask = await taskService.createTask(req.body, req.user.userId);

    res.status(201).json(newTask);
  } catch (error) {
    next(error);
  }
};

// Retrieves a single task by its ID, including its activity timeline.
// Requires a task ID in the request parameters.
// The detailed task retrieval logic is delegated to `taskService.getTaskWithTimeline`.
export const getTask = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { taskId } = req.params;
    if (!taskId) return next(new AppError('Task ID is required.', 400));

    const taskData = await taskService.getTaskWithTimeline(parseInt(taskId));

    res.status(200).json(taskData);
  } catch (error) {
    next(error);
  }
};

// Retrieves all tasks for a specific column.
// Requires a column ID in the request parameters.
// Tasks are ordered by their `order` property.
export const getTasks = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { columnId } = req.params;
    if (!columnId) {
      return next(new AppError('Column ID is required.', 400));
    }
    const parsedId = parseInt(columnId, 10);

    if (isNaN(parsedId)) {
      return next(new AppError('Column ID must be a valid number.', 400));
    }
    const taskData = await prisma.task.findMany({
      where: {
        columnId: parsedId,
      },
      orderBy: {
        order: 'asc',
      },
    });

    res.status(200).json(taskData);
  } catch (error) {
    next(error);
  }
};
// The update logic is delegated to `taskService.updateTask`.
export const updateTask = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { taskId } = req.params;
    if (!req.user || !req.user.userId)
      return next(new AppError('Unauthorized', 401));

    const updatedTask = await taskService.updateTask(
      parseInt(taskId),
      req.body,
      req.user.userId,
    );

    res.status(200).json(updatedTask);
  } catch (error) {
    next(error);
  }
};

// Moves a task to a different column or reorders it within the same column.
export const moveTask = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user || !req.user.userId) {
      return next(new AppError('Missing user authentication', 401));
    }
    const { taskId } = req.params;

    const { targetColumnId, newOrder } = req.body;
    const updatedTask = await taskService.moveTask(
      parseInt(taskId),
      { targetColumnId, newOrder } as MoveTaskDTO,
      req.user.userId,
    );

    res.status(200).json(updatedTask);
  } catch (error) {
    next(error);
  }
};

// The deletion logic is in  `taskService.deleteTask`.
export const deleteTask = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { taskId } = req.params;
    if (!req.user || !req.user.userId)
      return next(new AppError('Unauthorized', 401));
    if (!taskId) return next(new AppError('Task ID is required.', 400));

    const deletedTask = await taskService.deleteTask(
      parseInt(taskId),
      req.user.userId,
    );

    res.status(200).json({ message: 'Task deleted successfully', deletedTask });
  } catch (error) {
    next(error);
  }
};
