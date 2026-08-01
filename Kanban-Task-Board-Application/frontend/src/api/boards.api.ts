import { apiFetch } from './client';
import { type Board, type BoardDetails } from '../types/models';

export const boardApi = {
  // Get all boards for a project
  getBoardsByProject: (projectId: string): Promise<Board[]> =>
    apiFetch(`/projects/${projectId}/boards`),

  // Get a single board
  getBoardById: (boardId: string, projectId: string): Promise<BoardDetails> =>
    apiFetch(`/projects/${projectId}/boards/${boardId}`),

  // Create a new board
  createBoard: (
    projectId: string,
    data: {
      title: string;
      description?: string;
    },
  ): Promise<Board> =>
    apiFetch(`/projects/${projectId}/boards`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Update board
  updateBoard: (
    boardId: string,
    projectId: string,
    data: {
      title?: string;
      description?: string;
    },
  ): Promise<Board> =>
    apiFetch(`/projects/${projectId}/boards/${boardId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Delete board
  deleteBoard: (boardId: string, projectId: string): Promise<void> =>
    apiFetch(`/projects/${projectId}/boards/${boardId}`, {
      method: 'DELETE',
    }),
};
