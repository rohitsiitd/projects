import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../types/appError.js';
import * as columnService from '../services/columnService.js';

export const createColumn = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { boardId } = req.params; // Requires the route to be nested under a board or project
    if (!boardId) return next(new AppError('Board ID is required.', 400));

    const newColumn = await columnService.createColumn(
      parseInt(boardId),
      req.body,
    );
    res.status(201).json(newColumn);
  } catch (error) {
    next(error); // Pass to global error handler
  }
};

export const getColumns = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { boardId } = req.params;
    if (!boardId) return next(new AppError('Board ID is required.', 400));

    const columns = await columnService.getColumnsByBoardId(parseInt(boardId));
    res.status(200).json(columns);
  } catch (error) {
    next(error);
  }
};

export const updateColumn = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { columnId } = req.params;
    if (!columnId) return next(new AppError('Column ID is required.', 400));

    const updatedColumn = await columnService.updateColumn(
      parseInt(columnId),
      req.body,
    );
    res.status(200).json(updatedColumn);
  } catch (error) {
    next(error);
  }
};

export const deleteColumn = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { columnId } = req.params;
    if (!columnId) return next(new AppError('Column ID is required.', 400));

    const deletedColumn = await columnService.deleteColumn(parseInt(columnId));
    res
      .status(200)
      .json({ message: 'Column deleted successfully', deletedColumn });
  } catch (error) {
    next(error);
  }
};
