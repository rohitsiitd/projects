import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../types/appError.js';
import * as boardService from '../services/boardService.js';

export const createBoard = async (
  // creates the board
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { projectId } = req.params;
    if (!projectId) return next(new AppError('Project ID is required.', 400));
    const newBoard = await boardService.createBoard(
      parseInt(projectId),
      req.body,
    );

    res.status(201).json(newBoard);
  } catch (error) {
    next(error); // Forward errors to the global Express error handler
  }
};

export const getBoards = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { projectId } = req.params;
    if (!projectId) return next(new AppError('Project ID is required.', 400));

    const boards = await boardService.getBoardsByProjectId(parseInt(projectId));
    res.status(200).json(boards);
  } catch (error) {
    next(error);
  }
};

export const getBoardDetails = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { boardId } = req.params;
    if (!boardId) return next(new AppError('Board ID is required.', 400));

    const board = await boardService.getBoardById(parseInt(boardId));
    res.status(200).json(board);
  } catch (error) {
    next(error);
  }
};

export const updateBoard = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { boardId } = req.params;
    if (!boardId) return next(new AppError('Board ID is required.', 400));

    const updatedBoard = await boardService.updateBoard(
      parseInt(boardId),
      req.body,
    );
    res.status(200).json(updatedBoard);
  } catch (error) {
    next(error);
  }
};

export const deleteBoard = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { boardId } = req.params;
    if (!boardId) return next(new AppError('Board ID is required.', 400));

    const deletedBoard = await boardService.deleteBoard(parseInt(boardId));
    res
      .status(200)
      .json({ message: 'Board deleted successfully', deletedBoard });
  } catch (error) {
    next(error);
  }
};
