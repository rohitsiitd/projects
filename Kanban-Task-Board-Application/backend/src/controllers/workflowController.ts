import { NextFunction, Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../types/appError.js';
import { Prisma, WorkflowTransition } from '@prisma/client';

export const getTransitions = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { boardId } = req.params;
    const transitions = await prisma.workflowTransition.findMany({
      where: { boardId: parseInt(boardId) },
      include: {
        fromColumn: {
          select: { id: true, title: true },
        },
        toColumn: { select: { id: true, title: true } },
      },
    });
    res.status(200).json(transitions);
  } catch (error) {
    next(error);
  }
};

export const updateTransitions = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { boardId } = req.params;
    const { transitions } = req.body as { transitions: WorkflowTransition[] };
    if (!Array.isArray(transitions)) {
      return next(new AppError('Transitions must be an array', 400));
    }
    const board = await prisma.board.findUnique({
      where: { id: Number(boardId) },
      select: { projectId: true },
    });
    if (!board) {
      return next(new AppError('Board not found.', 404));
    }
    await prisma.$transaction(async (tx) => {
      await tx.workflowTransition.deleteMany({
        where: { boardId: Number(boardId) },
      });
      if (transitions.length > 0) {
        const dataToInsert = transitions.map((t) => ({
          projectId: board.projectId,
          boardId: Number(boardId),
          fromColumnId: t.fromColumnId,
          toColumnId: t.toColumnId,
        }));
        await tx.workflowTransition.createMany({
          data: dataToInsert,
          skipDuplicates: true,
        });
      }
    });
    const updatedTransitions = await prisma.workflowTransition.findMany({
      where: { boardId: Number(boardId) },
    });
    res.status(200).json({ updatedTransitions });
  } catch (error) {
    next(error);
  }
};

// POST route to add a new workflow transition
export const createTransition = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { projectId, boardId } = req.params;
    const { fromColumnId, toColumnId } = req.body;

    if (!projectId || !boardId || !fromColumnId || !toColumnId) {
      next(new AppError('Missing required fields for transition', 400));
      return;
    }

    // Check if the transition already exists to prevent duplicates
    const existing = await prisma.workflowTransition.findFirst({
      where: {
        boardId: Number(boardId),
        fromColumnId: Number(fromColumnId),
        toColumnId: Number(toColumnId),
      },
    });

    if (existing) {
      next(new AppError('Transition already exists', 400));
      return;
    }

    const newTransition = await prisma.workflowTransition.create({
      data: {
        projectId: Number(projectId),
        boardId: Number(boardId),
        fromColumnId: Number(fromColumnId),
        toColumnId: Number(toColumnId),
      },
    });

    res.status(201).json(newTransition);
  } catch (error) {
    next(error);
  }
};

// DELETE route to remove a workflow transition
export const deleteTransition = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      next(new AppError('Transition ID is required', 400));
      return;
    }

    await prisma.workflowTransition.delete({
      where: { id: Number(id) },
    });
    res
      .status(200)
      .json({ success: true, message: 'Transition deleted successfully' });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      next(new AppError('Transition not found', 404));
      return;
    }
    next(error);
  }
};
