import { prisma } from '../../lib/prisma.js';
import { Prisma } from '@prisma/client';
import { AppError } from '../../types/appError.js';
import { CreateColumnDTO, UpdateColumnDTO } from '../types/dtos.js';

//creating a column on a board:
export const createColumn = async (boardId: number, data: CreateColumnDTO) => {
  const { title, order, wipLimit, status } = data;

  if (!title) throw new AppError('Column title is required.', 400);

  const newColumn = await prisma.column.create({
    data: {
      title,
      boardId,
      order: order !== undefined ? Number(order) : 0,
      wipLimit: wipLimit ? Number(wipLimit) : null,
      status: status || 'TODO',
    },
  });

  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (board) {
    await prisma.project.update({
      where: { id: board.projectId },
      data: { updatedAt: new Date() },
    });
  }

  return newColumn;
};

//fetching all columns for a board:
export const getColumnsByBoardId = async (boardId: number) => {
  return await prisma.column.findMany({
    where: { boardId },
    orderBy: { order: 'asc' },
    include: {
      tasks: { orderBy: { order: 'asc' } },
    },
  });
};

//Updating column:
export const updateColumn = async (columnId: number, data: UpdateColumnDTO) => {
  const { title, wipLimit, order, status } = data;

  const oldColumn = await prisma.column.findUnique({
    where: { id: columnId },
    include: { board: true },
  });
  if (!oldColumn) throw new AppError('Column not found.', 404);

  // Implement strategy: Fetch the 4 default columns based on ascending ID order
  const defaultColumns = await prisma.column.findMany({
    where: { boardId: oldColumn.boardId },
    orderBy: { id: 'asc' },
    take: 4,
  });
  if (
    defaultColumns.some((c) => c.id === columnId) &&
    status !== undefined &&
    status !== oldColumn.status
  ) {
    throw new AppError('Cannot change the status of a default column.', 400);
  }

  //Case 1: order changed
  if (order !== undefined && Number(order) !== oldColumn.order) {
    const newOrderInt = Number(order);
    const oldOrderInt = oldColumn.order;

    // Using a transaction so "Either all columns safely shift or if fails then stop and update nothing.
    await prisma.$transaction(async (tx) => {
      if (oldOrderInt < newOrderInt) {
        // Moving column to the right so Shift intermediate columns left
        await tx.column.updateMany({
          where: {
            boardId: oldColumn.boardId,
            order: { gt: oldOrderInt, lte: newOrderInt },
          },
          data: { order: { decrement: 1 } },
        });
      } else {
        // Moving column to the left so shift intermediate columns right
        await tx.column.updateMany({
          where: {
            boardId: oldColumn.boardId,
            order: { gte: newOrderInt, lt: oldOrderInt },
          },
          data: { order: { increment: 1 } },
        });
      }

      //Updating target column:
      await tx.column.update({
        where: { id: columnId },
        data: {
          title: title || oldColumn.title,
          status: status !== undefined ? status : oldColumn.status,
          wipLimit:
            wipLimit !== undefined
              ? wipLimit
                ? Number(wipLimit)
                : null
              : oldColumn.wipLimit,
          order: newOrderInt,
        },
      });
    });

    await prisma.project.update({
      where: { id: oldColumn.board.projectId },
      data: { updatedAt: new Date() },
    });

    return await prisma.column.findUnique({
      where: { id: columnId },
      include: { tasks: { orderBy: { order: 'asc' } } },
    });
  }

  // Case 2: Order did not change
  const updatedColumn = await prisma.column.update({
    where: { id: columnId },
    include: { tasks: { orderBy: { order: 'asc' } } },
    data: {
      title,
      status,
      wipLimit:
        wipLimit !== undefined
          ? wipLimit
            ? Number(wipLimit)
            : null
          : undefined,
    },
  });

  await prisma.project.update({
    where: { id: oldColumn.board.projectId },
    data: { updatedAt: new Date() },
  });

  return updatedColumn;
};

//Deleting a column:
export const deleteColumn = async (columnId: number) => {
  try {
    const col = await prisma.column.findUnique({
      where: { id: columnId },
      include: { board: true },
    });
    if (col) {
      const defaultColumns = await prisma.column.findMany({
        where: { boardId: col.boardId },
        orderBy: { id: 'asc' },
        take: 4,
      });
      if (defaultColumns.some((c) => c.id === columnId)) {
        throw new AppError('Cannot delete default columns.', 400);
      }
    }

    const deletedColumn = await prisma.column.delete({
      where: { id: columnId },
    });

    if (col) {
      await prisma.project.update({
        where: { id: col.board.projectId },
        data: { updatedAt: new Date() },
      });
    }

    return deletedColumn;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        throw new AppError('Record not found.', 404);
      }
    }
    throw error;
  }
};
