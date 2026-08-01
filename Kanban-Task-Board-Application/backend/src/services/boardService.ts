import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../types/appError.js';
import { Prisma } from '@prisma/client';
import { CreateBoardDTO } from '../types/dtos.js';

// Creates a new board under a specific project.
export const createBoard = async (projectId: number, data: CreateBoardDTO) => {
  const { title, description } = data;
  if (!title) throw new AppError('Board title is required.', 400);

  const newBoard = await prisma.board.create({
    data: { title, description: description || null, projectId },
  });
  const columns = await prisma.$transaction([
    prisma.column.create({
      data: { title: 'To Do', order: 0, boardId: newBoard.id, status: 'TODO' },
    }),
    prisma.column.create({
      data: {
        title: 'In Progress',
        order: 1,
        boardId: newBoard.id,
        status: 'IN_PROGRESS',
      },
    }),
    prisma.column.create({
      data: {
        title: 'Review',
        order: 2,
        boardId: newBoard.id,
        status: 'IN_REVIEW',
      },
    }),
    prisma.column.create({
      data: { title: 'Done', order: 3, boardId: newBoard.id, status: 'DONE' },
    }),
  ]);
  await prisma.workflowTransition.createMany({
    data: [
      {
        projectId: projectId,
        boardId: newBoard.id,
        fromColumnId: columns[0].id,
        toColumnId: columns[1].id,
      },
      {
        projectId: projectId,
        boardId: newBoard.id,
        fromColumnId: columns[1].id,
        toColumnId: columns[0].id,
      },
      {
        projectId: projectId,
        boardId: newBoard.id,
        fromColumnId: columns[1].id,
        toColumnId: columns[2].id,
      },
      {
        projectId: projectId,
        boardId: newBoard.id,
        fromColumnId: columns[2].id,
        toColumnId: columns[1].id,
      },
      {
        projectId: projectId,
        boardId: newBoard.id,
        fromColumnId: columns[2].id,
        toColumnId: columns[3].id,
      },
      {
        projectId: projectId,
        boardId: newBoard.id,
        fromColumnId: columns[3].id,
        toColumnId: columns[2].id,
      },
    ],
  });

  await prisma.project.update({
    where: { id: projectId },
    data: { updatedAt: new Date() },
  });

  return newBoard;
};

//Getting all the boards for a project
export const getBoardsByProjectId = async (projectId: number) => {
  return await prisma.board.findMany({
    where: { projectId },
    orderBy: { createdAt: 'asc' }, //orders boards from oldest to newest
  });
};

//Getting a single board with all its columns and tasks:
export const getBoardById = async (boardId: number) => {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: {
      columns: {
        orderBy: { order: 'asc' },
        include: {
          tasks: { orderBy: { order: 'asc' } },
        },
      },
    },
  });

  if (!board) throw new AppError('Board not found.', 404);
  return board;
};

//Updating data:
export const updateBoard = async (boardId: number, data: CreateBoardDTO) => {
  const { title, description } = data;

  const existingBoard = await prisma.board.findUnique({
    where: { id: boardId },
  });
  if (!existingBoard) throw new AppError('Board not found.', 404);

  const updatedBoard = await prisma.board.update({
    where: { id: boardId },
    data: {
      title: title !== undefined ? title : undefined,
      description: description !== undefined ? description : undefined,
    },
  });

  await prisma.project.update({
    where: { id: existingBoard.projectId },
    data: { updatedAt: new Date() },
  });

  return updatedBoard;
};

//Deleting a board:
export const deleteBoard = async (boardId: number) => {
  try {
    const deletedBoard = await prisma.board.delete({
      where: { id: boardId },
    });

    await prisma.project.update({
      where: { id: deletedBoard.projectId },
      data: { updatedAt: new Date() },
    });

    return deletedBoard;
  } catch (error) {
    //Telling typeScript that this is a Prisma error
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        throw new AppError('Board not found.', 404);
      }
    }
    throw error;
  }
};
